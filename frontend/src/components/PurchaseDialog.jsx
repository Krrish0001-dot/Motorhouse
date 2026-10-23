import { useState } from 'react'
import { X } from 'lucide-react'

export default function PurchaseDialog({ vehicle, onClose, onPurchase }) {
  const [pending, setPending] = useState(false)

  async function confirm() {
    setPending(true)
    try {
      if (await onPurchase(vehicle)) onClose()
    } finally { setPending(false) }
  }

  return <div className="fixed inset-0 z-20 bg-[#10251c]/65 p-4 flex items-center justify-center" onMouseDown={event => { if (event.target === event.currentTarget && !pending) onClose() }}>
    <section role="dialog" aria-modal="true" aria-labelledby="purchase-dialog-title" className="w-full max-w-md bg-white rounded-3xl p-6 md:p-8 shadow-2xl">
      <div className="flex items-center justify-between gap-4"><h2 id="purchase-dialog-title" className="font-display font-extrabold text-2xl text-ink">Confirm purchase</h2><button aria-label="Close" onClick={onClose} disabled={pending} className="p-2 rounded-lg hover:bg-sage"><X size={20} /></button></div>
      <p className="mt-5 text-slate-600">Purchase one {vehicle.make} {vehicle.model}? This will reduce its stock from {vehicle.quantity} to {vehicle.quantity - 1}.</p>
      <p className="mt-3 text-sm text-slate-500">This demo tracks inventory only; no payment is taken.</p>
      <div className="flex gap-3 mt-8"><button className="button-outline flex-1 justify-center" disabled={pending} onClick={onClose}>Cancel</button><button className="button-primary flex-1 justify-center disabled:opacity-50" disabled={pending} onClick={confirm}>{pending ? 'Processing...' : 'Confirm purchase'}</button></div>
    </section>
  </div>
}
