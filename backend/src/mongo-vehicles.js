import { ObjectId } from 'mongodb'

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const toVehicle = document => document && ({
  id: document._id.toString(), make: document.make, model: document.model,
  category: document.category, priceCents: document.priceCents, quantity: document.quantity,
})

export async function createMongoVehicles(database) {
  const collection = database.collection('vehicles')
  await collection.createIndex({ priceCents: 1 })
  return {
    async list(filters = {}) {
      const query = {}
      for (const field of ['make', 'model', 'category']) {
        if (filters[field]) query[field] = { $regex: escapeRegex(filters[field]), $options: 'i' }
      }
      if (filters.minPriceCents != null || filters.maxPriceCents != null) {
        query.priceCents = {}
        if (filters.minPriceCents != null) query.priceCents.$gte = filters.minPriceCents
        if (filters.maxPriceCents != null) query.priceCents.$lte = filters.maxPriceCents
      }
      return (await collection.find(query).sort({ _id: 1 }).toArray()).map(toVehicle)
    },
    async findById(id) {
      if (!ObjectId.isValid(id)) return null
      return toVehicle(await collection.findOne({ _id: new ObjectId(id) }))
    },
    async create(data) {
      const result = await collection.insertOne(data)
      return { ...data, id: result.insertedId.toString() }
    },
    async update(id, changes) {
      if (!ObjectId.isValid(id)) return null
      return toVehicle(await collection.findOneAndUpdate(
        { _id: new ObjectId(id) }, { $set: changes }, { returnDocument: 'after' },
      ))
    },
    async delete(id) {
      if (!ObjectId.isValid(id)) return false
      return (await collection.deleteOne({ _id: new ObjectId(id) })).deletedCount === 1
    },
  }
}
