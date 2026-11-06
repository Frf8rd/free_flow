import MatchScoreBar from './MatchScoreBar'

export default function MatchCard({ match }) {
  const { name, tier, rising, headline, rate, skills, why, score } = match

  return (
    <article className="flex flex-col gap-5 rounded-lg border border-dashed border-slate-400 bg-slate-100 p-5 md:flex-row">
      <div className="h-16 w-16 shrink-0 rounded-full bg-slate-300" />

      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold">{name}</h3>
          <span className="rounded-full border border-slate-500 px-2.5 py-0.5 text-xs">
            {tier}
          </span>
          {rising && (
            <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs">
              Talent în creștere
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500">{headline} · {rate} €/h</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {skills.map((s) => (
            <span key={s} className="rounded bg-slate-200 px-2 py-0.5 text-xs">
              {s}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm">
          <b>De ce se potrivește:</b>{' '}
          <span className="text-slate-500">{why}</span>
        </p>
      </div>

      <div className="w-full md:w-44">
        <MatchScoreBar score={score} />
        <div className="mt-4 flex gap-2">
          <button className="rounded-md bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-800">
            Invită
          </button>
          <button className="rounded-md border border-slate-700 bg-white px-4 py-2 text-sm hover:bg-slate-100">
            Respinge
          </button>
        </div>
      </div>
    </article>
  )
}