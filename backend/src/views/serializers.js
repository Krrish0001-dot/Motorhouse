// JSON representations returned to clients; database-only fields stay private.
export const publicUser = user => ({ id: String(user.id), email: user.email, role: user.role })

export const publicVehicle = vehicle => ({
  id: String(vehicle.id), make: vehicle.make, model: vehicle.model,
  category: vehicle.category, price: vehicle.priceCents / 100, quantity: vehicle.quantity,
})
