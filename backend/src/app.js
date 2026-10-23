import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const publicUser = user => ({ id: String(user.id), email: user.email, role: user.role })
const asyncRoute = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)

export function createApp({ users, jwtSecret, frontendOrigin = 'http://localhost:5173' }) {
  if (!users || !jwtSecret || Buffer.byteLength(jwtSecret) < 32) {
    throw new Error('A user store and JWT secret of at least 32 bytes are required')
  }

  const app = express()
  app.disable('x-powered-by')
  app.use(cors({ origin: frontendOrigin }))
  app.use(express.json({ limit: '16kb' }))

  app.post('/api/auth/register', asyncRoute(async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    const password = req.body?.password
    if (!emailPattern.test(email) || email.length > 320 || typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password) > 72) {
      return res.status(422).json({ error: 'Enter a valid email and a password of 8–72 bytes' })
    }
    if (await users.findByEmail(email)) return res.status(409).json({ error: 'Email already registered' })

    const passwordHash = await bcrypt.hash(password, 12)
    try {
      // Roles are assigned by the server. A client-supplied role is ignored.
      const user = await users.create({ email, passwordHash, role: 'user' })
      return res.status(201).json(publicUser(user))
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ error: 'Email already registered' })
      throw error
    }
  }))

  app.post('/api/auth/login', asyncRoute(async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    const password = req.body?.password
    const user = email && typeof password === 'string' ? await users.findByEmail(email) : null
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    const access_token = jwt.sign({ sub: String(user.id) }, jwtSecret, { algorithm: 'HS256', expiresIn: '12h' })
    return res.json({ access_token, token_type: 'bearer', role: user.role })
  }))

  app.get('/api/auth/me', asyncRoute(async (req, res) => {
    const match = /^Bearer (.+)$/i.exec(req.get('Authorization') || '')
    if (!match) return res.status(401).json({ error: 'Authentication required' })
    let payload
    try { payload = jwt.verify(match[1], jwtSecret, { algorithms: ['HS256'] }) }
    catch { return res.status(401).json({ error: 'Invalid token' }) }
    const user = await users.findById(payload.sub)
    if (!user) return res.status(401).json({ error: 'Invalid token' })
    return res.json(publicUser(user))
  }))

  app.use((error, _req, res, _next) => {
    if (error instanceof SyntaxError && 'body' in error) return res.status(400).json({ error: 'Malformed JSON' })
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  })
  return app
}
