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
