export default function MatchScoreBar({ score }) {
  return (
    <div>
      <p className="text-sm text-slate-500">Scor potrivire</p>
      <p className="text-2xl font-bold">{score}%</p>
      <div className="mt-1 h-2 rounded-full bg-slate-300">
        <div
          className="h-2 rounded-full bg-slate-700"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}