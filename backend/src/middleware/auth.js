import jwt from 'jsonwebtoken'
import { asyncRoute } from './asyncRoute.js'

export function createAuthenticate({ users, jwtSecret }) {
  return asyncRoute(async (req, res, next) => {
    const match = /^Bearer (.+)$/i.exec(req.get('Authorization') || '')
    if (!match) return res.status(401).json({ error: 'Authentication required' })
    let payload
    try { payload = jwt.verify(match[1], jwtSecret, { algorithms: ['HS256'] }) }
    catch { return res.status(401).json({ error: 'Invalid token' }) }
    const user = await users.findById(payload.sub)
    if (!user) return res.status(401).json({ error: 'Invalid token' })
    req.user = user
    next()
  })
}
