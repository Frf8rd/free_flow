import { Link, useNavigate, useSearchParams } from 'react-router-dom'

export default function Register() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const role = params.get('role') === 'freelancer' ? 'freelancer' : 'client'

  function handleSubmit(e) {
    e.preventDefault()
    navigate('/dashboard')
  }

  return (
    <div className="mx-auto max-w-md rounded-xl bg-white p-8 shadow">
      <h1 className="mb-6 text-2xl font-bold">Creează cont</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select
          defaultValue={role}
          className="w-full rounded-lg border border-slate-300 px-4 py-2"
        >
          <option value="client">Client</option>
          <option value="freelancer">Freelancer</option>
        </select>
        <input
          type="text"
          placeholder="Nume"
          className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-primary focus:outline-none"
        />
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
          Înregistrează-te
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        Ai deja cont?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Autentifică-te
        </Link>
      </p>
    </div>
  )
}