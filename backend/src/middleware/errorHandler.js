export function errorHandler(error, _req, res, _next) {
  if (error instanceof SyntaxError && 'body' in error) return res.status(400).json({ error: 'Malformed JSON' })
  console.error(error)
  return res.status(500).json({ error: 'Internal server error' })
}
