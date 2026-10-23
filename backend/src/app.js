import express from 'express'
import cors from 'cors'
import { createAuthController } from './controllers/authController.js'
import { createVehicleController } from './controllers/vehicleController.js'
import { createAuthenticate } from './middleware/auth.js'
import { errorHandler } from './middleware/errorHandler.js'
import { authRoutes } from './routes/authRoutes.js'
import { vehicleRoutes } from './routes/vehicleRoutes.js'

// Compose the HTTP app with injected data stores so tests do not need Atlas credentials.
export function createApp({ users, vehicles, jwtSecret, adminInviteCode = '', frontendOrigin = 'http://localhost:5173' }) {
  if (!users || !jwtSecret || Buffer.byteLength(jwtSecret) < 32) {
    throw new Error('A user store and JWT secret of at least 32 bytes are required')
  }

  const app = express()
  app.disable('x-powered-by')
  app.use(cors({ origin: frontendOrigin }))
  app.use(express.json({ limit: '16kb' }))

  const authenticate = createAuthenticate({ users, jwtSecret })
  const auth = createAuthController({ users, jwtSecret, adminInviteCode })
  app.use('/api/auth', authRoutes({ controller: auth, authenticate }))

  if (vehicles) {
    const inventory = createVehicleController({ vehicles })
    app.use('/api/vehicles', authenticate, vehicleRoutes({ controller: inventory }))
  }

  app.use(errorHandler)
  return app
}
