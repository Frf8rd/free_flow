import { Link, useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    navigate('/dashboard')
  }

  return (
    <div className="mx-auto max-w-md rounded-xl bg-white p-8 shadow">
      <h1 className="mb-6 text-2xl font-bold">Autentificare</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-primary focus:outline-none"
        />
        <input
          type="password"
          placeholder="Parolă"
          className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-primary py-2 font-semibold text-white hover:bg-primary-dark"
        >
          Intră în cont
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        Nu ai cont?{' '}
        <Link to="/register" className="text-primary hover:underline">
          Înregistrează-te
        </Link>
      </p>
    </div>
  )
}