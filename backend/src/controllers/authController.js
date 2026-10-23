import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createHash, timingSafeEqual } from 'node:crypto'
import { publicUser } from '../views/serializers.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function createAuthController({ users, jwtSecret, adminInviteCode }) {
  return {
    async register(req, res) {
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
      const password = req.body?.password
      if (!emailPattern.test(email) || email.length > 320 || typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password) > 72) {
        return res.status(422).json({ error: 'Enter a valid email and a password of 8–72 bytes' })
      }
      const requestedCode = req.body?.admin_code
      let role = 'user'
      if (requestedCode !== undefined && requestedCode !== '') {
        if (typeof requestedCode !== 'string' || !adminInviteCode) return res.status(403).json({ error: 'Invalid admin invite code' })
        const suppliedHash = createHash('sha256').update(requestedCode).digest()
        const expectedHash = createHash('sha256').update(adminInviteCode).digest()
        if (!timingSafeEqual(suppliedHash, expectedHash)) return res.status(403).json({ error: 'Invalid admin invite code' })
        role = 'admin'
      }
      if (await users.findByEmail(email)) return res.status(409).json({ error: 'Email already registered' })

      const passwordHash = await bcrypt.hash(password, 12)
      try {
        // Roles come from the server-side invite check, never a client-supplied role.
        const user = await users.create({ email, passwordHash, role })
        return res.status(201).json(publicUser(user))
      } catch (error) {
        if (error.code === 11000) return res.status(409).json({ error: 'Email already registered' })
        throw error
      }
    },

    async login(req, res) {
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
      const password = req.body?.password
      const user = email && typeof password === 'string' ? await users.findByEmail(email) : null
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }
      const access_token = jwt.sign({ sub: String(user.id) }, jwtSecret, { algorithm: 'HS256', expiresIn: '12h' })
      return res.json({ access_token, token_type: 'bearer', role: user.role })
    },

    me(req, res) { return res.json(publicUser(req.user)) },
  }
}
