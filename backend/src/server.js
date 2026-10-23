import 'dotenv/config'
import { MongoClient } from 'mongodb'
import { createApp } from './app.js'
import { createMongoUsers } from './mongo-users.js'

const { MONGODB_URI, JWT_SECRET, MONGODB_DB_NAME = 'motorhouse', FRONTEND_ORIGIN = 'http://localhost:5173' } = process.env
if (!MONGODB_URI || !JWT_SECRET) {
  throw new Error('Set MONGODB_URI and JWT_SECRET in backend/.env')
}

const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
try {
  await client.connect()
  const users = await createMongoUsers(client.db(MONGODB_DB_NAME))
  const app = createApp({ users, jwtSecret: JWT_SECRET, frontendOrigin: FRONTEND_ORIGIN })
  const server = app.listen(Number(process.env.PORT || 8000), () => {
    console.log(`Motorhouse API listening on port ${server.address().port}`)
  })
  const shutdown = () => server.close(() => client.close())
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
} catch (error) {
  await client.close()
  console.error('Could not start API:', error.message)
  process.exitCode = 1
}
