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
    <div className="card mx-auto mt-6 max-w-md p-8">
      <h1 className="mb-6 font-display text-3xl">Creează cont</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-semibold">
          Rol
          <select defaultValue={role} className="input mt-1.5 font-normal">
            <option value="client">Client</option>
            <option value="freelancer">Freelancer</option>
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Nume
          <input type="text" placeholder="Numele tău" className="input mt-1.5 font-normal" />
        </label>
        <label className="block text-sm font-semibold">
          Email
          <input type="email" placeholder="email@exemplu.ro" className="input mt-1.5 font-normal" />
        </label>
        <label className="block text-sm font-semibold">
          Parolă
          <input type="password" placeholder="Parola ta" className="input mt-1.5 font-normal" />
        </label>
        <button type="submit" className="btn-primary w-full">
          Înregistrează-te
        </button>
      </form>
      <p className="mt-5 text-sm text-mute">
        Ai deja cont?{' '}
        <Link to="/login" className="font-semibold text-brand hover:underline">
          Autentifică-te
        </Link>
      </p>
    </div>
  )
}