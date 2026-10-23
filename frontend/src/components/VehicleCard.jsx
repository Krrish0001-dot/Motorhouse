import { ArrowRight } from 'lucide-react'
import VehicleArt from './VehicleArt.jsx'

const gradients = [
  'from-[#e7ebe5] to-[#d8e0d7]',
  'from-[#ebe8e1] to-[#dcd9ce]',
  'from-[#e2e9e7] to-[#d0ded7]',
  'from-[#e9e3db] to-[#d9d2c7]',
]

export default function VehicleCard({ vehicle, variant, onPurchase, onAdminSelect, busy, admin }) {
  const available = vehicle.quantity > 0
  return <article data-testid={`vehicle-${vehicle.id}`} className="bg-white rounded-[24px] border border-[#e9ede7] overflow-hidden shadow-[0_8px_32px_rgba(28,48,36,.035)] hover:shadow-[0_15px_40px_rgba(28,48,36,.1)] transition">
    <div className={`h-56 bg-gradient-to-br ${gradients[variant % gradients.length]} flex items-center justify-center relative px-5`}>
      <span className="absolute top-5 left-5 bg-white/90 rounded-full px-3 py-1.5 text-xs font-bold text-forest">{vehicle.category}</span>
      <VehicleArt variant={variant} />
    </div>
    <div className="p-6">
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[.13em] font-extrabold text-[#779070]">{vehicle.make}</p><h3 className="font-display font-extrabold text-2xl mt-1">{vehicle.model}</h3></div><p className="font-display font-extrabold text-xl whitespace-nowrap">${Number(vehicle.price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p></div>
      <p className="flex items-center gap-2 mt-5 text-sm text-slate-500"><span className={`h-2 w-2 rounded-full ${available ? 'bg-[#83b783]' : 'bg-red-400'}`} />{available ? `${vehicle.quantity} in stock` : 'Out of stock'}</p>
      <div className="mt-6 pt-5 border-t border-[#eef0ea]"><button disabled={!available || busy} onClick={() => onPurchase(vehicle)} className="button-primary w-full justify-center disabled:opacity-45 disabled:cursor-not-allowed">Purchase <ArrowRight size={16} /></button></div>
      {admin && <div className="flex gap-2 mt-3 text-sm font-bold text-forest"><button className="admin-action" onClick={() => onAdminSelect('edit', vehicle)}>Edit</button><button className="admin-action" onClick={() => onAdminSelect('restock', vehicle)}>Restock</button><button className="admin-action text-red-700" onClick={() => onAdminSelect('delete', vehicle)}>Delete</button></div>}
    </div>
  </article>
}
