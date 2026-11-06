import { Link } from 'react-router-dom'

const steps = [
  { title: '1. Descrie proiectul', text: 'Text liber, fără formulare lungi.' },
  { title: '2. Primești 5 potriviri', text: 'Cu scor și explicația „de ce".' },
  { title: '3. Colaborați', text: 'Chat, livrare, recenzii.' },
]

export default function Landing() {
  return (
    <div>
      <section className="py-14 text-center">
        <h1 className="text-4xl font-extrabold sm:text-5xl">
          Nu cel mai cunoscut. Cel mai potrivit.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-500">
          Matching automat între clienți și freelanceri, fără căutare manuală.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            to="/register?role=client"
            className="rounded-md bg-slate-700 px-6 py-3 font-semibold text-white hover:bg-slate-800"
          >
            Sunt client
          </Link>
          <Link
            to="/register?role=freelancer"
            className="rounded-md border border-slate-700 px-6 py-3 font-semibold hover:bg-slate-100"
          >
            Sunt freelancer
          </Link>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {steps.map((s) => (
          <div
            key={s.title}
            className="rounded-lg border border-dashed border-slate-400 bg-slate-100 p-6"
          >
            <h3 className="font-bold">{s.title}</h3>
            <p className="mt-2 text-slate-500">{s.text}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-lg border border-dashed border-slate-400 bg-slate-100 p-5 text-center text-slate-500">
        Echitate pentru începători: eticheta „Talent în creștere"
      </section>
    </div>
  )
}