const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(path, { token, ...options } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (response.status === 204) return null
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || 'Something went wrong. Please try again.')
  return body
}

export const api = {
  register: data => request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: data => request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  vehicles: token => request('/api/vehicles', { token }),
  purchase: (id, token) => request(`/api/vehicles/${encodeURIComponent(id)}/purchase`, { method: 'POST', token }),
  createVehicle: (data, token) => request('/api/vehicles', { method: 'POST', token, body: JSON.stringify(data) }),
  updateVehicle: (id, data, token) => request(`/api/vehicles/${encodeURIComponent(id)}`, { method: 'PUT', token, body: JSON.stringify(data) }),
  deleteVehicle: (id, token) => request(`/api/vehicles/${encodeURIComponent(id)}`, { method: 'DELETE', token }),
  restockVehicle: (id, quantity, token) => request(`/api/vehicles/${encodeURIComponent(id)}/restock`, { method: 'POST', token, body: JSON.stringify({ quantity }) }),
}
