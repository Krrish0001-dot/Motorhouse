const colors = ['#647965', '#a99e8c', '#4e6b65', '#967b68']

export default function VehicleArt({ variant = 0 }) {
  return <svg viewBox="0 0 440 210" className="w-full max-w-[360px] drop-shadow-[0_18px_12px_rgba(25,38,31,.19)]" aria-hidden="true">
    <ellipse cx="220" cy="177" rx="178" ry="15" fill="#617268" opacity=".18" />
    <path d="M48 137c5-21 20-29 46-34l36-7 34-40c10-12 27-17 48-18l89 1c24 1 42 10 58 29l21 30c24 3 36 14 37 32l-4 25H44z" fill={colors[variant % colors.length]} />
    <path d="M144 93l28-33c8-9 20-13 38-13h34v46zm111-46h43c19 0 34 8 46 24l16 22H255z" fill="#d5e2dc" opacity=".87" />
    <path d="M46 141h371v13H44z" fill="#293a32" opacity=".38" />
    <path d="M54 118h24v13H49zm337 0h22v13h-24z" fill="#e8e4cf" />
    <circle cx="121" cy="153" r="29" fill="#22302b" /><circle cx="121" cy="153" r="15" fill="#bfc7bd" />
    <circle cx="343" cy="153" r="29" fill="#22302b" /><circle cx="343" cy="153" r="15" fill="#bfc7bd" />
    <path d="M255 48v45" stroke="#35493f" strokeWidth="3" opacity=".45" />
  </svg>
}
