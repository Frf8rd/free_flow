import { Link, useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    navigate('/dashboard')
  }

  return (
    <div className="card mx-auto mt-6 max-w-md p-8">
      <h1 className="mb-6 font-display text-3xl">Autentificare</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-semibold">
          Email
          <input type="email" placeholder="email@exemplu.ro" className="input mt-1.5 font-normal" />
        </label>
        <label className="block text-sm font-semibold">
          Parolă
          <input type="password" placeholder="Parola ta" className="input mt-1.5 font-normal" />
        </label>
        <button type="submit" className="btn-primary w-full">
          Intră în cont
        </button>
      </form>
      <p className="mt-5 text-sm text-mute">
        Nu ai cont?{' '}
        <Link to="/register" className="font-semibold text-brand hover:underline">
          Înregistrează-te
        </Link>
      </p>
    </div>
  )
}