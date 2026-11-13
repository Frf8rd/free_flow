import ScoreRing from './ScoreRing'

export default function MatchCard({ match }) {
  const { name, initials, tier, rising, headline, skills, why, score } = match

  return (
    <article className="match-card">
      <div className="match-main">
        <div className="avatar">{initials}</div>

        <div className="match-content">
          <div className="match-header">
            <h3>{name}</h3>
            <span className="tier-badge">{tier}</span>
            {rising && <span className="rising-badge">Talent în creștere</span>}
          </div>

          <p className="headline">{headline}</p>

          <div className="match-why">
            <span className="why-label">De ce se potrivește:</span> {why}
          </div>

          <div className="skill-row">
            {skills.map((skill) => (
              <span key={skill} className="skill-pill">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="match-actions">
        <ScoreRing score={score} />
        <div className="action-row">
          <button className="invite-btn">Invită</button>
          <button className="reject-btn">Respinge</button>
        </div>
      </div>
    </article>
  )
}