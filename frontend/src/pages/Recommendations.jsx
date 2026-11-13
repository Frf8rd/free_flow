import MatchCard from '../components/match/MatchCard'

const matches = [
  {
    id: 1,
    name: 'Nume Prenume',
    initials: 'AN',
    tier: 'Start',
    rising: true,
    headline: 'Frontend developer · 15 €/h · disponibil acum',
    skills: ['React', 'Figma', 'CSS'],
    why: 'abilități comune, preț în buget, disponibil în termen.',
    score: 92,
  },
  {
    id: 2,
    name: 'Nume Prenume',
    initials: 'MB',
    tier: 'Verificat',
    rising: false,
    headline: 'Web designer · 20 €/h · disponibil în 3 zile',
    skills: ['Figma', 'CSS', 'Branding'],
    why: 'experiență în proiecte similare, preț ușor peste buget.',
    score: 85,
  },
  {
    id: 3,
    name: 'Nume Prenume',
    initials: 'CD',
    tier: 'Încercat',
    rising: false,
    headline: 'Full-stack developer · 25 €/h · disponibil în 2 săptămâni',
    skills: ['React', 'Node.js'],
    why: 'abilități tehnice potrivite, termen mai lung.',
    score: 78,
  },
]

export default function Recommendations() {
  return (
    <div className="recommendations-page">
      <div className="page-header">
        <div>
          <p className="page-label">Proiectul tău</p>
          <h1>Site pentru frizerie</h1>
        </div>
        <span className="result-pill">{matches.length} potriviri găsite</span>
      </div>

      <div className="filters-row" aria-label="Filter options">
        <button className="filter-chip active">Toate</button>
        <button className="filter-chip">Talent în creștere</button>
        <button className="filter-chip">Sub buget</button>
        <button className="filter-chip">Disponibil acum</button>
      </div>

      <div className="matches-list">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  )
}