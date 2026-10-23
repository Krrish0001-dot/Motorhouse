import assert from 'node:assert/strict'
import { test } from 'node:test'
import request from 'supertest'
import { createApp } from '../src/app.js'

const sample = { make: 'Honda', model: 'Civic', category: 'Sedan', price: 19000.50, quantity: 2 }

function fixture() {
  const people = new Map()
  const inventory = new Map()
  let nextUser = 1
  let nextVehicle = 1
  const users = {
    async findByEmail(email) { return [...people.values()].find(user => user.email === email) ?? null },
    async findById(id) { return people.get(id) ?? null },
    async create(user) {
      const saved = { ...user, id: String(nextUser++) }
      people.set(saved.id, saved)
      return saved
    },
  }
  const vehicles = {
    async list(filters = {}) {
      return [...inventory.values()].filter(item =>
        ['make', 'model', 'category'].every(field => !filters[field] || item[field].toLowerCase().includes(filters[field].toLowerCase())) &&
        (filters.minPriceCents == null || item.priceCents >= filters.minPriceCents) &&
        (filters.maxPriceCents == null || item.priceCents <= filters.maxPriceCents))
    },
    async findById(id) { return inventory.get(id) ?? null },
    async create(data) {
      const saved = { ...data, id: String(nextVehicle++) }
      inventory.set(saved.id, saved)
      return saved
    },
    async update(id, changes) {
      if (!inventory.has(id)) return null
      const saved = { ...inventory.get(id), ...changes }
      inventory.set(id, saved)
      return saved
    },
    async delete(id) { return inventory.delete(id) },
    async purchase(id) {
      const item = inventory.get(id)
      if (!item || item.quantity < 1) return null
      const saved = { ...item, quantity: item.quantity - 1 }
      inventory.set(id, saved)
      return saved
    },
    async restock(id, amount) {
      const item = inventory.get(id)
      if (!item) return null
      const saved = { ...item, quantity: item.quantity + amount }
      inventory.set(id, saved)
      return saved
    },
  }
  return { app: createApp({ users, vehicles, jwtSecret: 'test-secret-with-at-least-32-characters', adminInviteCode: 'test-admin-code' }) }
}

async function access(app, email, admin = false) {
  await request(app).post('/api/auth/register').send({ email, password: 'longpassword', ...(admin && { admin_code: 'test-admin-code' }) })
  const response = await request(app).post('/api/auth/login').send({ email, password: 'longpassword' })
  return { Authorization: `Bearer ${response.body.access_token}` }
}

test('requires authentication and restricts vehicle writes to admins', async () => {
  const { app } = fixture()
  assert.equal((await request(app).get('/api/vehicles')).status, 401)
  assert.equal((await request(app).get('/api/vehicles/search?make=Honda')).status, 401)
  assert.equal((await request(app).post('/api/vehicles').send(sample)).status, 401)
  const member = await access(app, 'member@example.com')
  assert.equal((await request(app).post('/api/vehicles').set(member).send(sample)).status, 403)
  assert.equal((await request(app).get('/api/vehicles').set(member)).status, 200)
})

test('creates, lists and searches vehicles by text and price range', async () => {
  const { app } = fixture()
  const admin = await access(app, 'admin@example.com', true)
  const member = await access(app, 'member@example.com')
  const first = await request(app).post('/api/vehicles').set(admin).send(sample)
  assert.equal(first.status, 201)
  assert.match(first.get('location'), /^\/api\/vehicles\/\d+$/)
  assert.deepEqual(first.body, { id: first.body.id, ...sample })
  await request(app).post('/api/vehicles').set(admin).send({ make: 'Toyota', model: 'RAV4', category: 'SUV', price: 33000, quantity: 0 })
  assert.equal((await request(app).get('/api/vehicles').set(member)).body.length, 2)
  const match = await request(app).get('/api/vehicles/search?make=hon&model=ivic&category=sed&min_price=19000&max_price=19001').set(member)
  assert.deepEqual(match.body, [first.body])
  assert.deepEqual((await request(app).get('/api/vehicles/search?category=suv&max_price=30000').set(member)).body, [])
  assert.equal((await request(app).get('/api/vehicles/search?min_price=200&max_price=100').set(member)).status, 422)
})

test('validates create and update without changing existing inventory', async () => {
  const { app } = fixture()
  const admin = await access(app, 'admin@example.com', true)
  for (const data of [{ ...sample, price: -1 }, { ...sample, price: 12.345 }, { ...sample, quantity: -1 }, { ...sample, model: '  ' }]) {
    assert.equal((await request(app).post('/api/vehicles').set(admin).send(data)).status, 422)
  }
  const created = await request(app).post('/api/vehicles').set(admin).send(sample)
  const id = created.body.id
  assert.equal((await request(app).put(`/api/vehicles/${id}`).set(admin).send({ price: 0 })).status, 422)
  assert.equal((await request(app).put(`/api/vehicles/${id}`).set(admin).send({ quantity: null })).status, 422)
  assert.deepEqual((await request(app).get('/api/vehicles').set(admin)).body, [created.body])
})

test('admins update and delete; members cannot; missing IDs return 404', async () => {
  const { app } = fixture()
  const admin = await access(app, 'admin@example.com', true)
  const member = await access(app, 'member@example.com')
  const id = (await request(app).post('/api/vehicles').set(admin).send(sample)).body.id
  assert.equal((await request(app).put(`/api/vehicles/${id}`).set(member).send({ price: 20000 })).status, 403)
  assert.equal((await request(app).delete(`/api/vehicles/${id}`).set(member)).status, 403)
  const changed = await request(app).put(`/api/vehicles/${id}`).set(admin).send({ price: 21000, quantity: 0 })
  assert.equal(changed.status, 200)
  assert.equal(changed.body.price, 21000)
  assert.equal(changed.body.quantity, 0)
  assert.equal((await request(app).put('/api/vehicles/missing').set(admin).send({ price: 20000 })).status, 404)
  assert.equal((await request(app).delete('/api/vehicles/missing').set(admin)).status, 404)
  assert.equal((await request(app).delete(`/api/vehicles/${id}`).set(admin)).status, 204)
  assert.deepEqual((await request(app).get('/api/vehicles').set(member)).body, [])
})

test('members purchase one at a time; stock cannot fall below zero', async () => {
  const { app } = fixture()
  const admin = await access(app, 'admin@example.com', true)
  const member = await access(app, 'member@example.com')
  const id = (await request(app).post('/api/vehicles').set(admin).send({ ...sample, quantity: 1 })).body.id
  assert.equal((await request(app).post(`/api/vehicles/${id}/purchase`)).status, 401)
  const bought = await request(app).post(`/api/vehicles/${id}/purchase`).set(member)
  assert.equal(bought.status, 200)
  assert.equal(bought.body.quantity, 0)
  assert.equal((await request(app).post(`/api/vehicles/${id}/purchase`).set(member)).status, 409)
  assert.equal((await request(app).post('/api/vehicles/missing/purchase').set(member)).status, 404)
  assert.equal((await request(app).get('/api/vehicles').set(member)).body[0].quantity, 0)
})

test('only admins can restock by a positive whole quantity', async () => {
  const { app } = fixture()
  const admin = await access(app, 'admin@example.com', true)
  const member = await access(app, 'member@example.com')
  const id = (await request(app).post('/api/vehicles').set(admin).send({ ...sample, quantity: 0 })).body.id
  assert.equal((await request(app).post(`/api/vehicles/${id}/restock`).set(member).send({ quantity: 2 })).status, 403)
  for (const quantity of [0, -1, 1.5, '2', null]) {
    assert.equal((await request(app).post(`/api/vehicles/${id}/restock`).set(admin).send({ quantity })).status, 422)
  }
  assert.equal((await request(app).post('/api/vehicles/missing/restock').set(admin).send({ quantity: 2 })).status, 404)
  const restocked = await request(app).post(`/api/vehicles/${id}/restock`).set(admin).send({ quantity: 3 })
  assert.equal(restocked.status, 200)
  assert.equal(restocked.body.quantity, 3)
  assert.equal((await request(app).post(`/api/vehicles/${id}/purchase`).set(member)).body.quantity, 2)
})
