import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-5xl font-bold text-primary">404</h1>
      <p className="mt-4 text-slate-600">Pagina nu a fost găsită.</p>
      <Link to="/" className="mt-6 inline-block text-primary hover:underline">
        Înapoi acasă
      </Link>
    </div>
  )
}