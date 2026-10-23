import { ObjectId } from 'mongodb'

function toUser(document) {
  return document && { id: document._id.toString(), email: document.email, passwordHash: document.passwordHash, role: document.role }
}

export async function createMongoUsers(database) {
  const collection = database.collection('users')
  await collection.createIndex({ email: 1 }, { unique: true })
  return {
    async findByEmail(email) { return toUser(await collection.findOne({ email })) },
    async findById(id) {
      if (!ObjectId.isValid(id)) return null
      return toUser(await collection.findOne({ _id: new ObjectId(id) }))
    },
    async create(user) {
      const result = await collection.insertOne(user)
      return { ...user, id: result.insertedId.toString() }
    },
  }
}
