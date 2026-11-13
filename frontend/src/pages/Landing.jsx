import { Link } from 'react-router-dom'
import ScoreRing from '../components/match/ScoreRing'

const steps = [
  { n: 1, title: 'Descrie proiectul', text: 'Text liber, fără formulare lungi.' },
  { n: 2, title: 'Primești 5 potriviri', text: 'Cu scor și explicație pentru fiecare.' },
  { n: 3, title: 'Colaborați', text: 'Chat, livrare și recenzii reale.' },
]

export default function Landing() {
  return (
    <div>
      <section className="flex flex-col items-center gap-14 py-12 lg:flex-row">
        <div className="flex-1">
          <span className="chip">Freelancing cu șanse egale</span>
          <h1 className="mt-5 font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl">
            Nu cel mai cunoscut.
            <br />
            Cel mai <span className="italic text-coral">potrivit.</span>
          </h1>
          <p className="mb-8 mt-6 max-w-md text-lg leading-relaxed text-mute">
            Descrie ce ai nevoie și primești 5 freelanceri potriviți, cu
            explicația „de ce”. Fără să cauți printre mii de oferte.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/register?role=client" className="btn-primary">
              Sunt client
            </Link>
            <Link to="/register?role=freelancer" className="btn-outline">
              Sunt freelancer
            </Link>
          </div>
        </div>

        <div className="w-full flex-1">
          <div className="card p-6 shadow-[0_24px_48px_rgba(15,92,92,0.12)]">
            <div className="flex items-center gap-4">
              <ScoreRing score={92} />
              <div>
                <p className="text-lg font-bold">Nume Prenume</p>
                <p className="text-sm text-mute">Frontend developer · 15 €/h</p>
                <span className="chip-rising mt-2">Talent în creștere</span>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-cream p-4 text-sm leading-relaxed">
              <b>De ce se potrivește:</b>{' '}
              <span className="text-mute">
                abilități comune, preț în buget, disponibil în termen.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="card p-7">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mint font-bold text-brand">
              {s.n}
            </div>
            <h3 className="mb-1.5 mt-4 text-xl font-semibold">{s.title}</h3>
            <p className="leading-relaxed text-mute">{s.text}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 flex flex-col items-start justify-between gap-6 rounded-3xl bg-brand p-10 text-white md:flex-row md:items-center">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl">Banii nu cumpără poziția.</h2>
          <p className="mt-2.5 leading-relaxed opacity-90">
            Începătorii primesc expunere garantată, iar recenziile contează,
            dar nu domină potrivirea.
          </p>
        </div>
        <Link
          to="/register"
          className="rounded-full bg-white px-7 py-3.5 font-semibold text-brand transition hover:bg-cream"
        >
          Vezi cum funcționează
        </Link>
      </section>

      <footer className="mt-10 text-sm text-mute">
        © FairMatch · Termeni · Confidențialitate
      </footer>
    </div>
  )
}