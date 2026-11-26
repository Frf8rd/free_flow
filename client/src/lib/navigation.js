// Un singur cont folosit pentru ambele activități.
export const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', to: '/dashboard' },
  { key: 'matches', label: 'Potriviri', icon: 'sparkle', to: '/recommendations', badge: 'matches' },
  {
    key: 'projects', label: 'Proiectele mele', icon: 'folder',
    children: [{ label: 'Active', to: '/projects/mine' }, { label: 'Arhivă', to: '/projects/archive' }],
  },
  { key: 'browse', label: 'Explorează', icon: 'search', to: '/browse' },
  { key: 'messages', label: 'Mesaje', icon: 'chat', to: '/messages', badge: 'messages' },
  { key: 'collaborations', label: 'Colaborări', icon: 'handshake', to: '/engagements' },
  { key: 'portfolio', label: 'Profil și portofoliu', icon: 'images', to: '/profile/edit' },
  { key: 'admin', label: 'Administrare', icon: 'shield', to: '/admin', admin: true },
  { key: 'settings', label: 'Setări', icon: 'settings', to: '/settings' },
];

export const visibleNav = (mode, isAdmin) => isAdmin
  ? navItems.filter((item) => ['admin', 'settings'].includes(item.key))
  : navItems.filter((i) => !i.admin && !(mode === 'FREELANCER' && i.key === 'projects'));
export const navLabel = (item) => (typeof item.label === 'function' ? item.label('CLIENT') : item.label);

export const quickActions = (mode) => mode === 'CLIENT' ? [
  { label: 'Postează proiect', icon: 'filePlus', to: '/projects/new' },
  { label: 'Explorează freelanceri', icon: 'search', to: '/browse' },
  { label: 'Mesaje', icon: 'chat', to: '/messages' },
] : [
  { label: 'Vezi potriviri', icon: 'sparkle', to: '/recommendations' },
  { label: 'Editează profilul', icon: 'userPen', to: '/profile/edit' },
  { label: 'Mesaje', icon: 'chat', to: '/messages' },
];
