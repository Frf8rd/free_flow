import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="font-display text-6xl text-brand">404</h1>
      <p className="mt-3 text-mute">Pagina nu a fost găsită.</p>
      <Link to="/" className="btn-primary mt-6">
        Înapoi acasă
      </Link>
    </div>
  )
}