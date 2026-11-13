import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="4.5" rx="1.5" />
      <rect x="13.5" y="13" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13" width="7" height="4.5" rx="1.5" />
    </svg>
  )
}

function MatchesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M4.5 18.2c.8-2.3 3.1-3.7 6-3.7s5.2 1.4 6 3.7" />
      <path d="M14.5 7.5h5.1M17.1 5v5" />
    </svg>
  )
}

function ProjectIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 4.5h7l4 4V18a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2Z" />
      <path d="M14 4.5V9h4" />
      <path d="M8 13h8M8 16.5h7" />
    </svg>
  )
}

function MessagesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 7.5h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H11l-4.5 3v-3H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z" />
      <path d="M8 11.5h8M8 14.5h5.5" />
    </svg>
  )
}

function TeamIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9.2 10.2a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Zm-4.7 8.3c.4-2.1 2.4-3.6 5-3.6s4.5 1.5 5 3.6" />
      <path d="M15.4 9.1a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4ZM18 18.5c-.3-1.7-1.8-2.9-3.7-2.9" />
    </svg>
  )
}

function PortfolioIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M8 5V3.8A1.8 1.8 0 0 1 9.8 2h4.4A1.8 1.8 0 0 1 16 3.8V5" />
      <path d="M4 11h16" />
      <path d="M10 15h4" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.3" />
      <path d="M19.4 15a1.5 1.5 0 0 0 .3 1.6l.1.1a1.8 1.8 0 1 1-2.5 2.5l-.1-.1A1.5 1.5 0 0 0 15.9 19a1.5 1.5 0 0 0-.9 1.3V20a1.8 1.8 0 1 1-3.6 0v-.1A1.5 1.5 0 0 0 9.5 19a1.5 1.5 0 0 0-1.5.9l-.1.1a1.8 1.8 0 1 1-2.5-2.5l.1-.1A1.5 1.5 0 0 0 5.7 16a1.5 1.5 0 0 0-1.3-.9H4.3a1.8 1.8 0 1 1 0-3.6h.1A1.5 1.5 0 0 0 5.7 9.5a1.5 1.5 0 0 0-.9-1.4l-.1-.1A1.8 1.8 0 1 1 7.2 5.5l.1.1A1.5 1.5 0 0 0 9 5.7a1.5 1.5 0 0 0 .9-1.3V4.3a1.8 1.8 0 1 1 3.6 0v.1A1.5 1.5 0 0 0 14.5 5.7a1.5 1.5 0 0 0 1.4-.9l.1-.1a1.8 1.8 0 1 1 2.5 2.5l-.1.1A1.5 1.5 0 0 0 18.3 9a1.5 1.5 0 0 0 1.3.9h.1a1.8 1.8 0 1 1 0 3.6h-.1a1.5 1.5 0 0 0-1.3.9Z" />
    </svg>
  )
}

const iconMap = {
  dashboard: DashboardIcon,
  matches: MatchesIcon,
  projects: ProjectIcon,
  messages: MessagesIcon,
  team: TeamIcon,
  portfolio: PortfolioIcon,
  settings: SettingsIcon,
}

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/recommendations', label: 'Potriviri', icon: 'matches', badge: 'NOU' },
  { to: '/projects', label: 'Proiecte', icon: 'projects', expandable: true },
  { to: '/login', label: 'Mesaje', icon: 'messages', badge: '2' },
  { to: '/register', label: 'Colaborări', icon: 'team' },
  { to: '/portfolio', label: 'Portofoliu', icon: 'portfolio' },
  { to: '/settings', label: 'Setări', icon: 'settings' },
]

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarExpanded, setSidebarExpanded] = useState(() => window.matchMedia('(hover: none)').matches)
  const [projectsExpanded, setProjectsExpanded] = useState(true)
  const projectsActive = location.pathname.startsWith('/projects/')

  return (
    <aside
      className={`sidebar ${sidebarExpanded ? 'is-expanded' : ''}`}
      aria-label="Sidebar navigation"
      style={{
        width: sidebarExpanded ? 205 : 58,
        minWidth: sidebarExpanded ? 205 : 58,
        flexBasis: sidebarExpanded ? 205 : 58,
      }}
      onMouseEnter={() => setSidebarExpanded(true)}
      onMouseLeave={() => setSidebarExpanded(false)}
    >
      <div className="brand-row">
        <div className="brand-wrap">
          <span className="brand-dot" />
          <span className="brand-name">FairMatch</span>
        </div>
        <button className="collapse-btn" aria-label="Restrânge meniul">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 6-6 6 6 6" /></svg>
        </button>
      </div>

      <div className="search-row" aria-label="Search">
        <span className="search-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3" /><path d="m15.5 15.5 4 4" /></svg></span>
        <span className="search-text">Caută</span>
        <span className="search-tag">Ctrl K</span>
      </div>

      <div className="profile-box">
        <div className="profile-avatar">AN</div>
        <div className="profile-meta">
          <span>Ana Nume</span>
          <strong>FREELANCER</strong>
        </div>
      </div>

      <button className="quick-action" onClick={() => navigate('/projects/new')}><span className="quick-action-icon">+</span>Acțiuni rapide</button>

      <div className="nav-section-title">PRIVIRE GENERALĂ</div>
      <nav className="nav-menu">
        {links.map((link) => {
          if (link.expandable) {
            return (
              <div className="nav-group" key={link.to}>
                <button
                  type="button"
                  className={`nav-item nav-project-toggle ${projectsActive ? 'active' : ''}`}
                  aria-expanded={projectsExpanded}
                  onClick={() => setProjectsExpanded((expanded) => !expanded)}
                >
                  <span className="nav-icon"><ProjectIcon /></span>
                  <span className="nav-text">{link.label}</span>
                  <span className={`nav-chevron ${projectsExpanded ? 'expanded' : ''}`}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
                  </span>
                </button>
                {projectsExpanded ? (
                  <div className="nav-submenu">
                    <NavLink to="/projects/active" className="nav-subitem">Active</NavLink>
                    <NavLink to="/projects/archive" className="nav-subitem">Arhivă</NavLink>
                  </div>
                ) : null}
              </div>
            )
          }

          const Icon = iconMap[link.icon]
          return (
            <div className="nav-group" key={link.to}>
              <NavLink
                to={link.to}
                end
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                title={link.label}
              >
                <span className="nav-icon"><Icon /></span>
                <span className="nav-text">{link.label}</span>
                {link.badge ? <span className={`nav-badge ${link.badge === 'NOU' ? 'new' : ''}`}>{link.badge}</span> : null}
                {link.expandable ? <span className="nav-chevron"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg></span> : null}
              </NavLink>
              {link.expandable ? (
                <div className="nav-submenu">
                  <NavLink to="/projects/new" end className="nav-subitem">Active</NavLink>
                  <NavLink to="/projects/new?status=archived" className="nav-subitem">Arhivă</NavLink>
                </div>
              ) : null}
            </div>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="mini-card">
          <h4>Treapta: Start</h4>
          <p>Încă 3 proiecte până la „Verificat”</p>
          <div className="progress-bar">
            <span></span>
          </div>
        </div>

        <div className="footer-icons">
          <button aria-label="Luminozitate"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6m12 12 1.4 1.4M2.5 12h2m15 0h2M4.6 19.4 6 18m12-12 1.4-1.4" /></svg></button>
          <button className="footer-active" aria-label="Mod întunecat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.2 15.4A7.8 7.8 0 0 1 8.6 4.8 7.8 7.8 0 1 0 19.2 15.4Z" /></svg></button>
          <button aria-label="Ecran"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4.5" width="18" height="12.5" rx="1.7" /><path d="M9 21h6m-3-4v4" /></svg></button>
        </div>
      </div>
    </aside>
  )
}