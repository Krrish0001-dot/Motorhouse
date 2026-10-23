import { Router } from 'express'

const fields = ['make', 'model', 'category', 'price', 'quantity']
const asyncRoute = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)

function cents(value, allowZero = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || (allowZero ? value < 0 : value <= 0)) return null
  const amount = Math.round(value * 100)
  return Number.isSafeInteger(amount) && Math.abs(value * 100 - amount) < 1e-7 ? amount : null
}

function parseVehicle(body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const keys = Object.keys(body)
  if (!keys.length || keys.some(key => !fields.includes(key)) || (!partial && fields.some(key => !keys.includes(key)))) return null
  const data = {}
  for (const key of keys) {
    const value = body[key]
    if (['make', 'model', 'category'].includes(key)) {
      if (typeof value !== 'string' || !value.trim() || value.trim().length > 100) return null
      data[key] = value.trim()
    } else if (key === 'price') {
      const priceCents = cents(value)
      if (priceCents === null) return null
      data.priceCents = priceCents
    } else if (key === 'quantity') {
      if (!Number.isSafeInteger(value) || value < 0) return null
      data.quantity = value
    }
  }
  return data
}

function filters(query) {
  const result = {}
  for (const field of ['make', 'model', 'category']) {
    if (query[field] !== undefined) {
      if (typeof query[field] !== 'string' || !query[field].trim() || query[field].length > 100) return null
      result[field] = query[field].trim()
    }
  }
  for (const [name, key] of [['min_price', 'minPriceCents'], ['max_price', 'maxPriceCents']]) {
    if (query[name] !== undefined) {
      if (typeof query[name] !== 'string' || !query[name].trim()) return null
      const amount = cents(Number(query[name]), true)
      if (amount === null) return null
      result[key] = amount
    }
  }
  if (result.minPriceCents != null && result.maxPriceCents != null && result.minPriceCents > result.maxPriceCents) return null
  return result
}

const publicVehicle = vehicle => ({
  id: String(vehicle.id), make: vehicle.make, model: vehicle.model,
  category: vehicle.category, price: vehicle.priceCents / 100, quantity: vehicle.quantity,
})

function admin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
  next()
}

export function vehicleRoutes({ vehicles }) {
  const router = Router()

  router.get('/', asyncRoute(async (_req, res) => {
    res.json((await vehicles.list()).map(publicVehicle))
  }))

  router.get('/search', asyncRoute(async (req, res) => {
    const criteria = filters(req.query)
    if (criteria === null) return res.status(422).json({ error: 'Invalid search filters' })
    res.json((await vehicles.list(criteria)).map(publicVehicle))
  }))

  router.post('/', admin, asyncRoute(async (req, res) => {
    const data = parseVehicle(req.body)
    if (data === null) return res.status(422).json({ error: 'Invalid vehicle details' })
    const created = publicVehicle(await vehicles.create(data))
    return res.status(201).location(`/api/vehicles/${created.id}`).json(created)
  }))

  router.post('/:id/purchase', asyncRoute(async (req, res) => {
    const purchased = await vehicles.purchase(req.params.id)
    if (purchased) return res.json(publicVehicle(purchased))
    if (!(await vehicles.findById(req.params.id))) return res.status(404).json({ error: 'Vehicle not found' })
    return res.status(409).json({ error: 'Vehicle is out of stock' })
  }))

  router.post('/:id/restock', admin, asyncRoute(async (req, res) => {
    const quantity = req.body?.quantity
    if (!Number.isSafeInteger(quantity) || quantity <= 0) return res.status(422).json({ error: 'Quantity must be a positive whole number' })
    const restocked = await vehicles.restock(req.params.id, quantity)
    if (!restocked) return res.status(404).json({ error: 'Vehicle not found' })
    return res.json(publicVehicle(restocked))
  }))

  router.put('/:id', admin, asyncRoute(async (req, res) => {
    const changes = parseVehicle(req.body, true)
    if (changes === null) return res.status(422).json({ error: 'Invalid vehicle details' })
    const updated = await vehicles.update(req.params.id, changes)
    if (!updated) return res.status(404).json({ error: 'Vehicle not found' })
    return res.json(publicVehicle(updated))
  }))

  router.delete('/:id', admin, asyncRoute(async (req, res) => {
    if (!(await vehicles.delete(req.params.id))) return res.status(404).json({ error: 'Vehicle not found' })
    return res.status(204).end()
  }))

  return router
}
