import { beforeEach, expect, test, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App.jsx'

const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body })
const honda = { id: '1', make: 'Honda', model: 'Civic', category: 'Sedan', price: 19000.5, quantity: 1 }
const tesla = { id: '2', make: 'Tesla', model: 'Model 3', category: 'Electric', price: 42000, quantity: 0 }

beforeEach(() => vi.restoreAllMocks())

test('registers with an optional admin invite code, signs in, and shows inventory', async () => {
  const calls = []
  vi.stubGlobal('fetch', vi.fn(async (url, options) => {
    calls.push({ url, options })
    if (url.endsWith('/api/auth/register')) return response({ id: '1', email: 'admin@example.com', role: 'admin' }, 201)
    if (url.endsWith('/api/auth/login')) return response({ access_token: 'test-token', token_type: 'bearer', role: 'admin' })
    if (url.endsWith('/api/vehicles')) return response([honda])
    throw new Error(`Unexpected request: ${url}`)
  }))
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: /create an account/i }))
  await user.type(screen.getByLabelText(/email address/i), 'admin@example.com')
  await user.type(screen.getByLabelText(/^password/i), 'longpassword')
  await user.type(screen.getByLabelText(/admin invite code/i), 'private-code')
  await user.click(screen.getByRole('button', { name: /^create account$/i }))
  expect(await screen.findByText('Civic')).toBeInTheDocument()
  expect(JSON.parse(calls[0].options.body).admin_code).toBe('private-code')
  expect(calls[2].options.headers.Authorization).toBe('Bearer test-token')
})

test('filters vehicles and disables purchase when out of stock', async () => {
  localStorage.setItem('motorhouse_auth', JSON.stringify({ access_token: 'member-token', role: 'user' }))
  let items = [honda, tesla]
  const calls = []
  vi.stubGlobal('fetch', vi.fn(async (url, options) => {
    calls.push({ url, options })
    if (url.endsWith('/api/vehicles/1/purchase')) { items = [{ ...honda, quantity: 0 }, tesla]; return response(items[0]) }
    if (url.endsWith('/api/vehicles')) return response(items)
    throw new Error(`Unexpected request: ${url}`)
  }))
  const user = userEvent.setup()
  render(<App />)
  expect(await screen.findByText('Civic')).toBeInTheDocument()
  const teslaCard = screen.getByTestId('vehicle-2')
  expect(within(teslaCard).getByRole('button', { name: /purchase/i })).toBeDisabled()
  await user.type(screen.getByRole('searchbox', { name: /search vehicles/i }), 'Honda')
  expect(screen.getByText('Civic')).toBeInTheDocument()
  expect(screen.queryByText('Model 3')).not.toBeInTheDocument()
  await user.clear(screen.getByRole('searchbox', { name: /search vehicles/i }))
  await user.click(within(screen.getByTestId('vehicle-1')).getByRole('button', { name: /purchase/i }))
  await waitFor(() => expect(within(screen.getByTestId('vehicle-1')).getByRole('button', { name: /purchase/i })).toBeDisabled())
  expect(calls.some(call => call.url.endsWith('/api/vehicles/1/purchase') && call.options.headers.Authorization === 'Bearer member-token')).toBe(true)
})
