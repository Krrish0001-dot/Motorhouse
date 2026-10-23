import assert from 'node:assert/strict'
import { test } from 'node:test'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { createApp } from '../src/app.js'

function fixture({ adminInviteCode = 'test-admin-invite-code' } = {}) {
  const records = new Map()
  let nextId = 1
  const users = {
    async findByEmail(email) { return [...records.values()].find(user => user.email === email) ?? null },
    async findById(id) { return records.get(id) ?? null },
    async create(user) {
      if (await this.findByEmail(user.email)) {
        const error = new Error('duplicate email')
        error.code = 11000
        throw error
      }
      const saved = { ...user, id: String(nextId++) }
      records.set(saved.id, saved)
      return saved
    },
  }
  return { app: createApp({ users, jwtSecret: 'test-secret-with-at-least-32-characters', adminInviteCode }), records }
}

test('exposes an unauthenticated health check for deployment', async () => {
  const { app } = fixture()
  const response = await request(app).get('/api/health')
  assert.equal(response.status, 200)
  assert.deepEqual(response.body, { status: 'ok' })
})

test('registers a member with a hashed password and normalized email', async () => {
  const { app, records } = fixture()
  const response = await request(app).post('/api/auth/register').send({ email: '  Buyer@Example.com ', password: 'longpassword', role: 'admin' })
  assert.equal(response.status, 201)
  assert.deepEqual(Object.keys(response.body).sort(), ['email', 'id', 'role'])
  assert.equal(response.body.email, 'buyer@example.com')
  assert.equal(response.body.role, 'user')
  assert.notEqual([...records.values()][0].passwordHash, 'longpassword')
})

test('registers an admin only with the private invite code', async () => {
  const { app, records } = fixture()
  const invalid = await request(app).post('/api/auth/register').send({
    email: 'admin@example.com', password: 'longpassword', admin_code: 'incorrect', role: 'admin',
  })
  assert.equal(invalid.status, 403)
  assert.equal(records.size, 0)

  const registration = await request(app).post('/api/auth/register').send({
    email: 'admin@example.com', password: 'longpassword', admin_code: 'test-admin-invite-code',
  })
  assert.equal(registration.status, 201)
  assert.equal(registration.body.role, 'admin')
  const login = await request(app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'longpassword' })
  assert.equal(login.body.role, 'admin')
  const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.access_token}`)
  assert.equal(me.body.role, 'admin')
})

test('rejects admin-code registration when no invite code is configured', async () => {
  const { app } = fixture({ adminInviteCode: '' })
  assert.equal((await request(app).post('/api/auth/register').send({
    email: 'admin@example.com', password: 'longpassword', admin_code: 'any-code',
  })).status, 403)
})

test('rejects duplicate accounts and invalid registration input', async () => {
  const { app } = fixture()
  assert.equal((await request(app).post('/api/auth/register').send({ email: 'bad', password: 'short' })).status, 422)
  await request(app).post('/api/auth/register').send({ email: 'buyer@example.com', password: 'longpassword' })
  assert.equal((await request(app).post('/api/auth/register').send({ email: 'BUYER@example.com', password: 'longpassword' })).status, 409)
})

test('logs in and authenticates a bearer token', async () => {
  const { app } = fixture()
  await request(app).post('/api/auth/register').send({ email: 'buyer@example.com', password: 'longpassword' })
  const login = await request(app).post('/api/auth/login').send({ email: 'buyer@example.com', password: 'longpassword' })
  assert.equal(login.status, 200)
  assert.equal(login.body.token_type, 'bearer')
  assert.equal(typeof login.body.access_token, 'string')
  const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.access_token}`)
  assert.equal(me.status, 200)
  assert.equal(me.body.email, 'buyer@example.com')
  assert.equal(me.body.passwordHash, undefined)
})

test('rejects invalid credentials and missing, forged, or expired tokens', async () => {
  const { app } = fixture()
  await request(app).post('/api/auth/register').send({ email: 'buyer@example.com', password: 'longpassword' })
  assert.equal((await request(app).post('/api/auth/login').send({ email: 'buyer@example.com', password: 'wrong' })).status, 401)
  assert.equal((await request(app).post('/api/auth/login').send({ email: 'absent@example.com', password: 'longpassword' })).status, 401)
  assert.equal((await request(app).get('/api/auth/me')).status, 401)
  assert.equal((await request(app).get('/api/auth/me').set('Authorization', 'Bearer forged')).status, 401)
  const expired = jwt.sign({ sub: '1' }, 'test-secret-with-at-least-32-characters', { expiresIn: -1 })
  assert.equal((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`)).status, 401)
})
