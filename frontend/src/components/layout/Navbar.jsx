import { Link } from 'react-router-dom'

const links = [
  { to: '/', label: 'Acasă' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/recommendations', label: 'Potriviri' },
  { to: '/login', label: 'Login' },
]

export default function Navbar() {
  return (
    <header className="border-b border-slate-300 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-xl font-bold">
          FairMatch
        </Link>
        <div className="flex items-center gap-5 text-sm text-slate-500">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-slate-900">
              {l.label}
            </Link>
          ))}
          <Link
            to="/register"
            className="rounded-md bg-slate-700 px-4 py-2 font-medium text-white hover:bg-slate-800"
          >
            Creează cont
          </Link>
        </div>
      </nav>
    </header>
  )
}