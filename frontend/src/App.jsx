import { useEffect, useState } from 'react'
import { api } from './api/client.js'
import AuthScreen from './components/AuthScreen.jsx'
import Inventory from './components/Inventory.jsx'

function savedSession() {
  try { return JSON.parse(localStorage.getItem('motorhouse_auth') || 'null') }
  catch { return null }
}

export default function App() {
  const [session, setSession] = useState(savedSession)
  const [mode, setMode] = useState('login')
  const [vehicles, setVehicles] = useState([])
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const token = session?.access_token
  useEffect(() => {
    if (!token) return
    let active = true
    api.vehicles(token).then(items => { if (active) setVehicles(items) }).catch(error => { if (active) setNotice(error.message) })
    return () => { active = false }
  }, [token])

  function logout() { localStorage.removeItem('motorhouse_auth'); setSession(null); setVehicles([]) }

  async function authenticate(form) {
    setBusy(true); setNotice('')
    try {
      if (mode === 'register') await api.register(form)
      const result = await api.login({ email: form.email, password: form.password })
      localStorage.setItem('motorhouse_auth', JSON.stringify(result))
      setSession(result)
    } catch (error) { setNotice(error.message) }
    finally { setBusy(false) }
  }

  async function purchase(vehicle) {
    setBusyId(vehicle.id); setNotice('')
    try {
      await api.purchase(vehicle.id, token)
      setVehicles(await api.vehicles(token))
      setNotice(`You purchased a ${vehicle.make} ${vehicle.model}.`)
    } catch (error) { setNotice(error.message) }
    finally { setBusyId(null) }
  }

  return <>
    {session ? <Inventory vehicles={vehicles} role={session.role} onPurchase={purchase} busyId={busyId} onLogout={logout} /> : <AuthScreen mode={mode} setMode={setMode} onSubmit={authenticate} busy={busy} />}
    {notice && <div role="alert" className="toast">{notice}</div>}
  </>
}
