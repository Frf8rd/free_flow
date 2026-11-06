import MatchCard from '../components/match/MatchCard'

// Date de test. Mai târziu vin de la backend: GET /projects/:id/matches
const matches = [
  {
    id: 1,
    name: 'Nume Prenume',
    tier: 'Start',
    rising: true,
    headline: 'Frontend developer',
    rate: 15,
    skills: ['React', 'UI', 'Figma'],
    why: 'abilități comune, preț în buget, disponibil în termen.',
    score: 92,
  },
  {
    id: 2,
    name: 'Nume Prenume',
    tier: 'Verificat',
    rising: false,
    headline: 'Web designer',
    rate: 20,
    skills: ['Figma', 'CSS', 'Branding'],
    why: 'experiență în proiecte similare, preț ușor peste buget.',
    score: 85,
  },
  {
    id: 3,
    name: 'Nume Prenume',
    tier: 'Încercat',
    rising: false,
    headline: 'Full-stack developer',
    rate: 25,
    skills: ['React', 'Node.js'],
    why: 'abilități tehnice potrivite, disponibil peste două săptămâni.',
    score: 78,
  },
]

export default function Recommendations() {
  return (
    <div>
      <h1 className="text-2xl font-bold">
        Potriviri pentru: „Site pentru frizerie"
      </h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">
        Stare: se caută potriviri… / 3 rezultate
      </p>

      <div className="mb-5 rounded-lg border border-dashed border-slate-400 bg-slate-100 p-4">
        <p>
          <b>Întrebare de clarificare</b>{' '}
          <span className="text-slate-500">(doar dacă brief-ul e vag)</span>
        </p>
        <input
          placeholder="Răspunsul tău"
          className="mt-3 w-full rounded-md border border-slate-400 bg-white px-3 py-2 text-sm focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-4">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>
    </div>
  )
}