export default function ScoreRing({ score }) {
  return (
    <div
      className="score-ring"
      style={{
        background: `conic-gradient(#5fe3d0 ${score}%, rgba(126, 144, 144, 0.22) 0)`,
      }}
      aria-label={`Scor de potrivire ${score}%`}
    >
      <div className="score-ring-inner">{score}%</div>
    </div>
  )
}