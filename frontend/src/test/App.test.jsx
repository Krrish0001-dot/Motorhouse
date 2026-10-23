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

test('admin creates and edits vehicles, then restocks and deletes one', async () => {
  localStorage.setItem('motorhouse_auth', JSON.stringify({ access_token: 'admin-token', role: 'admin' }))
  let items = [honda]
  const calls = []
  vi.stubGlobal('fetch', vi.fn(async (url, options) => {
    calls.push({ url, options })
    if (url.endsWith('/api/vehicles') && options.method === 'POST') {
      const created = { ...JSON.parse(options.body), id: '3' }
      items = [...items, created]
      return response(created, 201)
    }
    if (url.endsWith('/api/vehicles/3') && options.method === 'PUT') {
      items = items.map(item => item.id === '3' ? { ...item, ...JSON.parse(options.body) } : item)
      return response(items[1])
    }
    if (url.endsWith('/api/vehicles/3/restock')) {
      items = items.map(item => item.id === '3' ? { ...item, quantity: item.quantity + JSON.parse(options.body).quantity } : item)
      return response(items[1])
    }
    if (url.endsWith('/api/vehicles/3') && options.method === 'DELETE') {
      items = items.filter(item => item.id !== '3')
      return { ok: true, status: 204 }
    }
    if (url.endsWith('/api/vehicles')) return response(items)
    throw new Error(`Unexpected request: ${url}`)
  }))
  const user = userEvent.setup()
  render(<App />)
  expect(await screen.findByText('Civic')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /add vehicle/i }))
  await user.type(screen.getByLabelText(/^make$/i), 'Ford')
  await user.type(screen.getByLabelText(/^model$/i), 'Mustang')
  await user.type(screen.getByLabelText(/^category$/i), 'Coupe')
  await user.type(screen.getByLabelText(/^price$/i), '28000.50')
  await user.type(screen.getByLabelText(/^quantity$/i), '0')
  await user.click(screen.getByRole('button', { name: /^save vehicle$/i }))
  expect(await screen.findByText('Mustang')).toBeInTheDocument()
  expect(JSON.parse(calls.find(call => call.options.method === 'POST').options.body)).toEqual({ make: 'Ford', model: 'Mustang', category: 'Coupe', price: 28000.5, quantity: 0 })
  const card = screen.getByTestId('vehicle-3')
  await user.click(within(card).getByRole('button', { name: /^edit$/i }))
  await user.clear(screen.getByLabelText(/^price$/i))
  await user.type(screen.getByLabelText(/^price$/i), '27000')
  await user.click(screen.getByRole('button', { name: /^save vehicle$/i }))
  await waitFor(() => expect(calls.some(call => call.options.method === 'PUT' && JSON.parse(call.options.body).price === 27000)).toBe(true))
  await user.click(within(card).getByRole('button', { name: /^restock$/i }))
  await user.type(screen.getByLabelText(/restock quantity/i), '2')
  await user.click(screen.getByRole('button', { name: /^confirm restock$/i }))
  await waitFor(() => expect(within(card).getByText('2 in stock')).toBeInTheDocument())
  await user.click(within(card).getByRole('button', { name: /^delete$/i }))
  await user.click(screen.getByRole('button', { name: /^confirm delete$/i }))
  await waitFor(() => expect(screen.queryByText('Mustang')).not.toBeInTheDocument())
  expect(calls.filter(call => call.options.method && call.options.method !== 'GET').every(call => call.options.headers.Authorization === 'Bearer admin-token')).toBe(true)
})

test('member has no admin inventory controls', async () => {
  localStorage.setItem('motorhouse_auth', JSON.stringify({ access_token: 'member-token', role: 'member' }))
  vi.stubGlobal('fetch', vi.fn(async () => response([honda])))
  render(<App />)
  const card = await screen.findByTestId('vehicle-1')
  expect(screen.queryByRole('button', { name: /add vehicle/i })).not.toBeInTheDocument()
  expect(within(card).queryByRole('button', { name: /^edit$|^delete$|^restock$/i })).not.toBeInTheDocument()
})
