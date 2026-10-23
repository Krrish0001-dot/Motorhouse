import { Router } from 'express'
import { asyncRoute } from '../middleware/asyncRoute.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

export function vehicleRoutes({ controller }) {
  const router = Router()
  router.get('/', asyncRoute(controller.list))
  router.get('/search', asyncRoute(controller.search))
  router.post('/', requireAdmin, asyncRoute(controller.create))
  router.put('/:id', requireAdmin, asyncRoute(controller.update))
  router.delete('/:id', requireAdmin, asyncRoute(controller.remove))
  router.post('/:id/purchase', asyncRoute(controller.purchase))
  router.post('/:id/restock', requireAdmin, asyncRoute(controller.restock))
  return router
}
