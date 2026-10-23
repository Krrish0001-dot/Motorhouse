import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createMongoVehicles } from '../src/mongo-vehicles.js'

test('Mongo search treats text as literal and applies price bounds in cents', async () => {
  let actualQuery
  const collection = {
    async createIndex() {},
    find(query) {
      actualQuery = query
      return { sort() { return { async toArray() { return [] } } } }
    },
  }
  const vehicles = await createMongoVehicles({ collection: () => collection })
  assert.deepEqual(await vehicles.list({ make: 'Hon.*', minPriceCents: 10050, maxPriceCents: 20000 }), [])
  assert.deepEqual(actualQuery, {
    make: { $regex: 'Hon\\.\\*', $options: 'i' },
    priceCents: { $gte: 10050, $lte: 20000 },
  })
})

test('Mongo purchase uses an atomic conditional decrement', async () => {
  const { ObjectId } = await import('mongodb')
  const id = new ObjectId()
  let captured
  const collection = {
    async createIndex() {},
    async findOneAndUpdate(filter, update, options) {
      captured = { filter, update, options }
      return { _id: id, make: 'Honda', model: 'Civic', category: 'Sedan', priceCents: 1900050, quantity: 1 }
    },
  }
  const vehicles = await createMongoVehicles({ collection: () => collection })
  const result = await vehicles.purchase(id.toString())
  assert.equal(result.quantity, 1)
  assert.deepEqual(captured, {
    filter: { _id: id, quantity: { $gt: 0 } },
    update: { $inc: { quantity: -1 } },
    options: { returnDocument: 'after' },
  })
})
