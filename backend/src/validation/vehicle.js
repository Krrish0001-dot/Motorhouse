const fields = ['make', 'model', 'category', 'price', 'quantity']

function cents(value, allowZero = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || (allowZero ? value < 0 : value <= 0)) return null
  const amount = Math.round(value * 100)
  return Number.isSafeInteger(amount) && Math.abs(value * 100 - amount) < 1e-7 ? amount : null
}

export function parseVehicle(body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const keys = Object.keys(body)
  if (!keys.length || keys.some(key => !fields.includes(key)) || (!partial && fields.some(key => !keys.includes(key)))) return null
  const data = {}
  for (const key of keys) {
    const value = body[key]
    if (['make', 'model', 'category'].includes(key)) {
      if (typeof value !== 'string' || !value.trim() || value.trim().length > 100) return null
      data[key] = value.trim()
    } else if (key === 'price') {
      const priceCents = cents(value)
      if (priceCents === null) return null
      data.priceCents = priceCents
    } else if (key === 'quantity') {
      if (!Number.isSafeInteger(value) || value < 0) return null
      data.quantity = value
    }
  }
  return data
}

export function parseFilters(query) {
  const result = {}
  for (const field of ['make', 'model', 'category']) {
    if (query[field] !== undefined) {
      if (typeof query[field] !== 'string' || !query[field].trim() || query[field].length > 100) return null
      result[field] = query[field].trim()
    }
  }
  for (const [name, key] of [['min_price', 'minPriceCents'], ['max_price', 'maxPriceCents']]) {
    if (query[name] !== undefined) {
      if (typeof query[name] !== 'string' || !query[name].trim()) return null
      const amount = cents(Number(query[name]), true)
      if (amount === null) return null
      result[key] = amount
    }
  }
  if (result.minPriceCents != null && result.maxPriceCents != null && result.minPriceCents > result.maxPriceCents) return null
  return result
}
