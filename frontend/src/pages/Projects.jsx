import { Link, NavLink, useLocation } from 'react-router-dom'

const activeProjects = [
  { title: 'Pagină de prezentare', detail: 'Client: [Nume]', status: 'În lucru' },
]

export default function Projects() {
  const isArchived = useLocation().pathname === '/projects/archive'
  const projects = isArchived ? [] : activeProjects

  return (
    <section className="projects-page">
      <header className="projects-header">
        <div>
          <p className="page-label">SPAȚIUL TĂU DE LUCRU</p>
          <h1>{isArchived ? 'Arhivă proiecte' : 'Proiecte active'}</h1>
          <p className="text-mute">
            {isArchived
              ? 'Proiectele arhivate vor apărea aici.'
              : 'Urmărește proiectele la care lucrezi acum.'}
          </p>
        </div>
        <Link to="/projects/new" className="btn-primary">Proiect nou</Link>
      </header>

      <nav className="project-tabs" aria-label="Filtrează proiectele">
        <NavLink to="/projects/active" className={({ isActive }) => `project-tab ${isActive ? 'active' : ''}`}>
          Active
        </NavLink>
        <NavLink to="/projects/archive" className={({ isActive }) => `project-tab ${isActive ? 'active' : ''}`}>
          Arhivă
        </NavLink>
      </nav>

      {projects.length ? (
        <div className="projects-list">
          {projects.map((project) => (
            <article className="card project-row" key={project.title}>
              <div>
                <h2>{project.title}</h2>
                <p>{project.detail}</p>
              </div>
              <span className="chip">{project.status}</span>
            </article>
          ))}
        </div>
      ) : (
        <div className="project-empty">
          <h2>Nu există proiecte arhivate</h2>
          <p>Proiectele mutate în arhivă vor apărea aici.</p>
        </div>
      )}
    </section>
  )
}