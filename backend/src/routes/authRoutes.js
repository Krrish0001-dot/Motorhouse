import { Router } from 'express'
import { asyncRoute } from '../middleware/asyncRoute.js'

export function authRoutes({ controller, authenticate }) {
  const router = Router()
  router.post('/register', asyncRoute(controller.register))
  router.post('/login', asyncRoute(controller.login))
  router.get('/me', authenticate, controller.me)
  return router
}
