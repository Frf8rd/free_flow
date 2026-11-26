import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import Dropdown, { MenuItem } from '../ui/Dropdown.jsx';
import { LogoMark } from '../ui/Logo.jsx';
import { useSession } from '../../lib/session.jsx';
import { useChat } from '../../lib/chat.jsx';
import { useAuth } from '../../store/authStore.js';
import { useCounts } from '../../hooks/queries.js';
import { visibleNav, navLabel, quickActions } from '../../lib/navigation.js';

const itemBase = 'group relative flex min-h-10 items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white';
const itemActive = 'bg-white/10 text-white ring-1 ring-white/10';
const sectionLabel = 'px-3.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45';

/* ---- Profil (avatar + nume + rol, cu meniu) ---- */
function ProfileRow({ collapsed, mobile, onNavigate }) {
  const navigate = useNavigate();
  const { user: me, mode } = useSession();
  const logout = useAuth((s) => s.logout);
  return (
    <Dropdown side={mobile ? 'top' : 'right-up'} className="w-full" trigger={({ open, toggle }) => (
      <button
        onClick={toggle}
        title={collapsed ? me.name : undefined}
        aria-label={`Contul tău: ${me.name}`}
        className={`flex items-center gap-3 rounded-md text-left transition-colors hover:bg-white/5 ${collapsed ? 'mx-auto h-11 w-11 justify-center' : 'w-full p-2'}`}
      >
        {me.avatar ? <img src={me.avatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" /> : <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-fm-mist text-sm font-semibold text-fm-ink">{me.initials}</span>}
        {!collapsed && (
          <>
            <span className="flex min-w-0 flex-col items-start gap-1">
              <span className="truncate text-sm font-semibold">{me.name}</span>
            </span>
            <Icon name="chevron" className={`ml-auto h-4 w-4 text-white/60 transition-transform duration-200 ${mobile ? (open ? '' : 'rotate-180') : '-rotate-90'}`} />
          </>
        )}
      </button>
    )}>
      <div className="px-3 py-2">
        <p className="text-sm font-semibold">{me.name}</p>
        <p className="truncate text-xs text-fm-slate/70">{me.email}</p>
      </div>
      <div className="my-1 h-px bg-fm-graphite/10" />
      <MenuItem onClick={() => { onNavigate?.(); navigate('/settings'); }}><Icon name="settings" className="h-4 w-4" /> Setări</MenuItem>
      <MenuItem onClick={async () => { onNavigate?.(); try { await logout(); navigate('/login', { replace: true }); } catch { navigate('/login', { replace: true }); } }}><Icon name="logout" className="h-4 w-4" /> Deconectare</MenuItem>
    </Dropdown>
  );
}

/* ---- Acțiuni rapide ---- */
function QuickActions({ collapsed, onNavigate }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { mode } = useSession();
  const actions = quickActions(mode);

  if (collapsed) {
    return (
      <Dropdown side="right" className="mx-auto" trigger={({ open: o, toggle }) => (
        <button onClick={toggle} title="Acțiuni rapide" aria-label="Acțiuni rapide" className="grid h-11 w-11 place-items-center rounded-full bg-fm-mist text-fm-ink transition hover:bg-white">
          <Icon name="plus" className={`h-5 w-5 transition-transform duration-200 ${o ? 'rotate-45' : ''}`} />
        </button>
      )}>
        <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-fm-slate/60">Acțiuni rapide</p>
        {actions.map((a) => (
          <MenuItem key={a.label} onClick={() => { onNavigate?.(); navigate(a.to); }}><Icon name={a.icon} className="h-4 w-4" /> {a.label}</MenuItem>
        ))}
      </Dropdown>
    );
  }

  return (
    <div className={`w-full rounded-lg border p-2 transition-colors duration-200 ${open ? 'border-fm-mist/70' : 'border-white/15'}`}>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="quick-actions-list" className="flex min-h-11 w-full items-center gap-3 rounded-md p-1 text-sm font-semibold">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-fm-mist text-fm-ink">
          <Icon name="plus" className={`h-5 w-5 transition-transform duration-200 ${open ? 'rotate-45' : ''}`} />
        </span>
        Acțiuni rapide
      </button>
      <div id="quick-actions-list" className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <ul className="overflow-hidden">
          {actions.map((a) => (
            <li key={a.label} className="first:pt-1.5">
              <Link to={a.to} onClick={onNavigate} tabIndex={open ? 0 : -1} className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                <Icon name={a.icon} className="h-4 w-4" /> {a.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---- Un rând de navigare (simplu sau grup extensibil) ---- */
function NavRow({ item, collapsed, onNavigate }) {
  const { pathname } = useLocation();
  const [groupOpen, setGroupOpen] = useState(true);
  const { mode } = useSession();
  const { unreadTotal } = useChat();
  const counts = useCounts();
  const label = navLabel(item, mode);
  const count = item.badge === 'matches' ? (counts.data?.matches || 0) : item.badge === 'messages' ? unreadTotal : 0;

  const badge = !count ? null : item.badge === 'matches'
    ? <span className="ml-auto rounded-md bg-fm-mist px-2 py-0.5 text-[11px] font-semibold text-fm-ink">Nou</span>
    : <span className="ml-auto grid min-w-6 place-items-center rounded-md bg-red-500 px-1.5 py-0.5 text-[11px] font-semibold text-white">{count}</span>;
  const dot = count ? <span className={`absolute right-2 top-2 h-2 w-2 rounded-full ring-2 ring-fm-ink ${item.badge === 'matches' ? 'bg-fm-mist' : 'bg-red-500'}`} /> : null;

  if (item.children) {
    const groupActive = item.children.some((c) => pathname.startsWith(c.to));
    if (collapsed) {
      return (
        <Link to={item.children[0].to} title={label} aria-label={label} className={`${itemBase} mx-auto h-11 w-11 justify-center p-0 ${groupActive ? itemActive : ''}`}>
          <Icon name={item.icon} className="h-[18px] w-[18px]" />
        </Link>
      );
    }
    return (
      <div className="w-full">
        <button onClick={() => setGroupOpen((o) => !o)} aria-expanded={groupOpen} className={`${itemBase} w-full ${groupActive && !groupOpen ? itemActive : ''}`}>
          <Icon name={item.icon} className={`h-[18px] w-[18px] ${groupActive ? 'text-fm-mist' : ''}`} />
          {label}
          <Icon name="chevron" className={`ml-auto h-4 w-4 transition-transform duration-200 ${groupOpen ? 'rotate-180' : ''}`} />
        </button>
        <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${groupOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <ul className={`ml-[25px] min-h-0 overflow-hidden ${groupOpen ? 'border-l border-white/10 pl-3' : ''}`}>
            {item.children.map((c) => (
              <li key={c.to} className="pt-1">
                <NavLink to={c.to} onClick={onNavigate} tabIndex={groupOpen ? 0 : -1} className={({ isActive }) => `${itemBase} min-h-9 py-2 ${isActive ? itemActive : ''}`}>{c.label}</NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      title={collapsed ? (count ? `${label} (${count})` : label) : undefined}
      aria-label={collapsed ? label : undefined}
      className={({ isActive }) => `${itemBase} ${collapsed ? 'mx-auto h-11 w-11 justify-center p-0' : 'w-full'} ${isActive ? itemActive : ''}`}
    >
      {({ isActive }) => (
        <>
          <Icon name={item.icon} className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-fm-mist' : ''}`} />
          {!collapsed && label}
          {collapsed ? dot : badge}
        </>
      )}
    </NavLink>
  );
}

/* ---- Conținutul sidebar-ului (desktop + mobil) ---- */
export default function SidebarContent({ collapsed = false, mobile = false, onToggle, onClose }) {
  const { mode, user } = useSession();

  return (
    <div className="flex h-full min-h-0 flex-col text-white">
      {/* Rând brand */}
      <div className={`flex shrink-0 items-center gap-2.5 px-5 pt-5 ${collapsed ? 'flex-col px-0' : ''}`}>
        <Link to="/dashboard" onClick={onClose} aria-label="FairMatch — Dashboard" className={`flex min-h-11 items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
          <LogoMark className="h-8 w-8" />
          {!collapsed && <span className="text-lg font-semibold tracking-tight">FairMatch</span>}
        </Link>
        {mobile ? (
          <button onClick={onClose} aria-label="Închide meniul" className="ml-auto grid h-11 w-11 place-items-center rounded-md border border-white/15 text-white/70 hover:bg-white/10"><Icon name="close" className="h-4 w-4" /></button>
        ) : (
          <button onClick={onToggle} aria-label={collapsed ? 'Extinde bara laterală' : 'Restrânge bara laterală'} aria-expanded={!collapsed}
            title={collapsed ? 'Extinde' : 'Restrânge'}
            className={`grid h-8 w-8 place-items-center rounded-md border border-white/15 text-white/70 transition-colors hover:bg-white/10 hover:text-white ${collapsed ? '' : 'ml-auto'}`}>
            <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Zona de mijloc — fără bară de derulare */}
      <div className={`flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto no-scrollbar px-4 pb-3 pt-4 [&>*]:shrink-0 ${collapsed ? 'items-center px-3' : ''}`}>
        <QuickActions collapsed={collapsed} onNavigate={onClose} />

        <nav aria-label="Navigare aplicație" className={`flex flex-col gap-1 ${collapsed ? 'items-center' : 'w-full'}`}>
          {!collapsed && <p className={sectionLabel}>Prezentare generală</p>}
          {visibleNav(mode, user.isAdmin).map((item) => <NavRow key={item.key} item={item} collapsed={collapsed} onNavigate={onClose} />)}
        </nav>
      </div>

      {/* Jos: butonul cu profilul — mereu vizibil, în afara zonei care derulează */}
      <div className={`shrink-0 border-t border-white/10 ${collapsed ? 'p-3' : 'p-4'}`}>
        <ProfileRow collapsed={collapsed} mobile={mobile} onNavigate={onClose} />
      </div>
    </div>
  );
}
