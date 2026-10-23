import { parseVehicle, parseFilters } from '../validation/vehicle.js'
import { publicVehicle } from '../views/serializers.js'

export function createVehicleController({ vehicles }) {
  return {
    async list(_req, res) {
      return res.json((await vehicles.list()).map(publicVehicle))
    },

    async search(req, res) {
      const criteria = parseFilters(req.query)
      if (criteria === null) return res.status(422).json({ error: 'Invalid search filters' })
      return res.json((await vehicles.list(criteria)).map(publicVehicle))
    },

    async create(req, res) {
      const data = parseVehicle(req.body)
      if (data === null) return res.status(422).json({ error: 'Invalid vehicle details' })
      const created = publicVehicle(await vehicles.create(data))
      return res.status(201).location(`/api/vehicles/${created.id}`).json(created)
    },

    async update(req, res) {
      const changes = parseVehicle(req.body, true)
      if (changes === null) return res.status(422).json({ error: 'Invalid vehicle details' })
      const updated = await vehicles.update(req.params.id, changes)
      if (!updated) return res.status(404).json({ error: 'Vehicle not found' })
      return res.json(publicVehicle(updated))
    },

    async remove(req, res) {
      if (!(await vehicles.delete(req.params.id))) return res.status(404).json({ error: 'Vehicle not found' })
      return res.status(204).end()
    },

    async purchase(req, res) {
      const purchased = await vehicles.purchase(req.params.id)
      if (purchased) return res.json(publicVehicle(purchased))
      if (!(await vehicles.findById(req.params.id))) return res.status(404).json({ error: 'Vehicle not found' })
      return res.status(409).json({ error: 'Vehicle is out of stock' })
    },

    async restock(req, res) {
      const quantity = req.body?.quantity
      if (!Number.isSafeInteger(quantity) || quantity <= 0) return res.status(422).json({ error: 'Quantity must be a positive whole number' })
      const restocked = await vehicles.restock(req.params.id, quantity)
      if (!restocked) return res.status(404).json({ error: 'Vehicle not found' })
      return res.json(publicVehicle(restocked))
    },
  }
}
