import { useMemo, useState } from 'react'
import { ArrowRight, CarFront, LogOut, Search, SlidersHorizontal, Sparkles } from 'lucide-react'
import VehicleArt from './VehicleArt.jsx'
import VehicleCard from './VehicleCard.jsx'

const categories = ['All vehicles', 'Sedan', 'SUV', 'Coupe', 'Hatchback', 'Truck', 'Electric']

export default function Inventory({ vehicles, role, onPurchase, busyId, onLogout }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All vehicles')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const visible = useMemo(() => vehicles.filter(vehicle => {
    const text = `${vehicle.make} ${vehicle.model} ${vehicle.category}`.toLowerCase()
    return text.includes(query.trim().toLowerCase()) &&
      (category === 'All vehicles' || vehicle.category.toLowerCase() === category.toLowerCase()) &&
      (!minPrice || vehicle.price >= Number(minPrice)) &&
      (!maxPrice || vehicle.price <= Number(maxPrice))
  }), [vehicles, query, category, minPrice, maxPrice])

  return <div className="min-h-screen bg-canvas text-ink">
    <header className="bg-white border-b border-[#e8ece6]"><div className="max-w-[1440px] mx-auto px-5 md:px-10 h-20 flex items-center justify-between"><div className="flex items-center gap-3"><span className="bg-forest text-sage rounded-xl p-2"><CarFront size={22} /></span><span className="font-display font-extrabold tracking-tight text-xl">motorhouse<span className="text-[#73965e]">.</span></span></div><nav className="hidden md:flex gap-9 text-sm font-bold text-forest"><span className="border-b-2 border-forest py-7">Explore inventory</span></nav><div className="flex items-center gap-3"><span className="hidden sm:inline text-sm text-slate-500">{role === 'admin' ? 'Admin' : 'Member'}</span><span className="w-9 h-9 rounded-full bg-sage grid place-items-center text-forest font-bold text-sm">{role === 'admin' ? 'A' : 'M'}</span><button title="Sign out" aria-label="Sign out" onClick={onLogout} className="p-2 text-slate-500 hover:text-forest"><LogOut size={19} /></button></div></div></header>
    <main className="max-w-[1440px] mx-auto px-5 md:px-10 pb-20">
      <section className="relative mt-8 md:mt-10 rounded-[30px] bg-forest text-white overflow-hidden p-8 md:p-12 lg:p-16"><div className="absolute right-[-90px] top-[-210px] w-[600px] h-[600px] border border-white/10 rounded-full" /><div className="absolute right-[0px] top-[-100px] w-[400px] h-[400px] border border-white/10 rounded-full" /><div className="relative z-10 max-w-xl"><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold tracking-wide text-sage"><Sparkles size={14} /> CURATED FOR THE ROAD AHEAD</span><h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mt-6">Your next chapter<br />starts <span className="text-[#c5dda8]">here.</span></h1><p className="mt-5 text-white/65 max-w-md">Explore exceptional vehicles, handpicked for wherever life takes you next.</p><a href="#inventory" className="inline-flex items-center gap-2 bg-sage text-forest font-bold rounded-xl px-6 py-3.5 mt-8 hover:bg-white transition">Explore collection <ArrowRight size={17} /></a></div><div className="hidden lg:block absolute w-[470px] right-5 bottom-0 opacity-95"><VehicleArt /></div></section>
      <section id="inventory" className="mt-14"><div><span className="text-[#6a8a68] text-xs font-extrabold tracking-[.19em] uppercase">The collection</span><h2 className="font-display text-3xl md:text-4xl font-extrabold mt-2">Find your perfect fit<span className="text-[#82a06b]">.</span></h2><p className="text-slate-500 mt-2">Browse our inventory and find a vehicle that feels like you.</p></div>
        <div className="mt-8 flex flex-wrap items-center gap-3"><div className="relative flex-1 min-w-[230px]"><Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" aria-label="Search vehicles" className="input pl-11" placeholder="Search make, model, or category..." value={query} onChange={event => setQuery(event.target.value)} /></div><button onClick={() => setShowFilters(!showFilters)} className={`button-outline ${showFilters ? 'bg-sage' : ''}`}><SlidersHorizontal size={17} /> Price filters</button></div>
        {showFilters && <div className="flex flex-wrap items-center gap-3 mt-3 p-4 bg-white rounded-2xl border border-[#e7ebe4]"><label className="text-sm font-semibold">Min price<input type="number" min="0" className="input mt-1 w-40" value={minPrice} onChange={event => setMinPrice(event.target.value)} placeholder="Any" /></label><label className="text-sm font-semibold">Max price<input type="number" min="0" className="input mt-1 w-40" value={maxPrice} onChange={event => setMaxPrice(event.target.value)} placeholder="Any" /></label><button className="text-sm font-bold text-forest mt-5" onClick={() => { setMinPrice(''); setMaxPrice('') }}>Clear</button></div>}
        <div className="flex gap-2 mt-7 overflow-x-auto pb-2">{categories.map(item => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold transition ${category === item ? 'bg-forest text-white' : 'bg-white border border-[#e7ebe4] text-slate-600 hover:border-forest'}`}>{item}</button>)}</div>
        <p className="text-sm text-slate-500 mt-8 mb-5"><strong className="text-ink">{visible.length}</strong> vehicles found</p>
        {visible.length ? <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">{visible.map((vehicle, index) => <VehicleCard key={vehicle.id} vehicle={vehicle} variant={index} onPurchase={onPurchase} busy={busyId !== null} />)}</div> : <div className="bg-white rounded-3xl border border-dashed border-[#cbd6c6] py-20 text-center"><CarFront size={42} className="mx-auto text-[#9bb59a]" /><h3 className="font-display font-bold text-xl mt-5">No vehicles found</h3><p className="text-slate-500 mt-2">Try another search or category.</p></div>}
      </section>
    </main><footer className="border-t border-[#e7ebe4] py-8 text-center text-sm text-slate-400">Motorhouse · Made for the journey.</footer>
  </div>
}
