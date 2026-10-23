import { useState } from 'react'
import { ArrowRight, CarFront, Sparkles } from 'lucide-react'
import VehicleArt from './VehicleArt.jsx'

export default function AuthScreen({ mode, setMode, onSubmit, busy }) {
  const [form, setForm] = useState({ email: '', password: '', admin_code: '' })
  const register = mode === 'register'
  const update = (field, value) => setForm(current => ({ ...current, [field]: value }))

  return <main className="min-h-screen bg-canvas grid lg:grid-cols-2">
    <section className="hidden lg:flex bg-forest text-white p-12 xl:p-20 flex-col justify-between relative overflow-hidden">
      <div className="absolute -right-40 top-1/3 w-[600px] h-[600px] rounded-full border border-white/10" />
      <div className="absolute -right-20 top-1/3 w-[420px] h-[420px] rounded-full border border-white/10" />
      <div className="flex items-center gap-3 relative z-10"><span className="bg-sage text-forest rounded-xl p-2"><CarFront size={24} /></span><span className="font-display font-extrabold tracking-tight text-2xl">motorhouse<span className="text-[#bbd4a4]">.</span></span></div>
      <div className="relative z-10"><span className="uppercase text-xs font-bold tracking-[.25em] text-[#b8d3ae]">THE SMARTER WAY TO DRIVE</span><h1 className="font-display text-5xl xl:text-7xl font-extrabold leading-[1.07] mt-7 tracking-tight">Find your<br />next favorite<br /><span className="text-[#c7dfa8]">drive.</span></h1><p className="mt-7 text-white/65 max-w-md text-lg leading-relaxed">A thoughtfully curated inventory, all in one place. Explore, discover, and take the wheel.</p><div className="mt-14 bg-white/10 rounded-3xl p-8 backdrop-blur-sm"><VehicleArt /></div></div>
      <span className="text-white/40 text-sm relative z-10">© 2026 Motorhouse. Made for the journey.</span>
    </section>
    <section className="flex items-center justify-center px-6 py-12"><div className="w-full max-w-md">
      <div className="lg:hidden flex items-center gap-2 text-forest font-display font-extrabold text-2xl mb-12"><CarFront /> motorhouse.</div>
      <span className="inline-flex items-center gap-2 text-forest bg-sage rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider"><Sparkles size={14} /> Welcome aboard</span>
      <h2 className="font-display text-4xl font-extrabold text-ink mt-7">{register ? 'Start your journey.' : 'Good to see you again.'}</h2>
      <p className="text-slate-500 mt-3">{register ? 'Create your account to explore the collection.' : 'Sign in to explore our collection.'}</p>
      <form onSubmit={event => { event.preventDefault(); onSubmit(form) }} className="mt-10 space-y-5">
        <label className="block text-sm font-bold text-ink">Email address<input className="input mt-2" type="email" required value={form.email} onChange={event => update('email', event.target.value)} placeholder="you@example.com" /></label>
        <label className="block text-sm font-bold text-ink">Password<input className="input mt-2" type="password" required minLength={register ? 8 : undefined} value={form.password} onChange={event => update('password', event.target.value)} placeholder="At least 8 characters" /></label>
        {register && <label className="block text-sm font-bold text-ink">Admin invite code <span className="text-slate-400 font-normal">(optional)</span><input className="input mt-2" value={form.admin_code} onChange={event => update('admin_code', event.target.value)} placeholder="Enter if you have one" /></label>}
        <button className="button-primary w-full justify-center mt-4" disabled={busy}>{busy ? 'One moment...' : register ? 'Create account' : 'Sign in'} <ArrowRight size={18} /></button>
      </form>
      <p className="text-center text-slate-500 mt-8">{register ? 'Already have an account?' : 'New to Motorhouse?'} <button onClick={() => setMode(register ? 'login' : 'register')} className="font-bold text-forest hover:underline">{register ? 'Sign in' : 'Create an account'}</button></p>
    </div></section>
  </main>
}
