import { useState } from 'react'
import { X } from 'lucide-react'

const initial = vehicle => ({
  make: vehicle?.make || '', model: vehicle?.model || '', category: vehicle?.category || '',
  price: vehicle?.price?.toString() || '', quantity: vehicle?.quantity?.toString() ?? '0',
})

export default function AdminDialog({ action, vehicle, onClose, onSubmit, busy }) {
  const [form, setForm] = useState(() => initial(vehicle))
  const [restockQuantity, setRestockQuantity] = useState('')
  const title = { add: 'Add vehicle', edit: 'Edit vehicle', restock: 'Restock vehicle', delete: 'Delete vehicle' }[action]
  const update = (name, value) => setForm(current => ({ ...current, [name]: value }))

  async function submit(event) {
    event.preventDefault()
    const data = action === 'restock' ? { quantity: Number(restockQuantity) } : action === 'delete' ? null : {
      make: form.make.trim(), model: form.model.trim(), category: form.category.trim(),
      price: Number(form.price), quantity: Number(form.quantity),
    }
    if (await onSubmit(action, vehicle, data)) onClose()
  }

  return <div className="fixed inset-0 z-20 bg-[#10251c]/65 p-4 flex items-center justify-center" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose() }}>
    <section role="dialog" aria-modal="true" aria-labelledby="admin-dialog-title" className="w-full max-w-lg max-h-[90vh] overflow-auto bg-white rounded-3xl p-6 md:p-8 shadow-2xl">
      <div className="flex items-center justify-between gap-4"><h2 id="admin-dialog-title" className="font-display font-extrabold text-2xl text-ink">{title}</h2><button aria-label="Close" onClick={onClose} disabled={busy} className="p-2 rounded-lg hover:bg-sage"><X size={20} /></button></div>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {(action === 'add' || action === 'edit') && <>
          {['make', 'model', 'category'].map(field => <label key={field} className="block text-sm font-bold capitalize">{field}<input className="input mt-1.5" required maxLength="100" value={form[field]} onChange={event => update(field, event.target.value)} /></label>)}
          <div className="grid grid-cols-2 gap-4"><label className="block text-sm font-bold">Price<input className="input mt-1.5" type="number" required min="0.01" step="0.01" value={form.price} onChange={event => update('price', event.target.value)} /></label><label className="block text-sm font-bold">Quantity<input className="input mt-1.5" type="number" required min="0" step="1" value={form.quantity} onChange={event => update('quantity', event.target.value)} /></label></div>
        </>}
        {action === 'restock' && <><p className="text-slate-600">Add stock for {vehicle.make} {vehicle.model}.</p><label className="block text-sm font-bold">Restock quantity<input className="input mt-1.5" type="number" required min="1" step="1" value={restockQuantity} onChange={event => setRestockQuantity(event.target.value)} /></label></>}
        {action === 'delete' && <p className="text-slate-600">Delete {vehicle.make} {vehicle.model}? This removes the vehicle from your inventory.</p>}
        <div className="flex gap-3 pt-3"><button type="button" className="button-outline justify-center flex-1" disabled={busy} onClick={onClose}>Cancel</button><button type="submit" className={`button-primary justify-center flex-1 disabled:opacity-50 ${action === 'delete' ? 'bg-red-700 hover:bg-red-800' : ''}`} disabled={busy}>{action === 'delete' ? 'Confirm delete' : action === 'restock' ? 'Confirm restock' : 'Save vehicle'}</button></div>
      </form>
    </section>
  </div>
}
