// Navigația depinde de rolul ales la înregistrare (se schimbă doar din Setări)
const common = [{ to: '/messages', label: 'Mesaje', icon: 'chat', badge: 'messages' }, { to: '/engagements', label: 'Colaborări', icon: 'handshake' }];

export const NAV = {
  CLIENT: [
    { to: '/dashboard', label: 'Acasă', icon: 'home' },
    { to: '/recommendations', label: 'Freelanceri potriviți', icon: 'sparkle', badge: 'matches' },
    { to: '/projects', label: 'Proiectele mele', icon: 'briefcase' },
    { to: '/browse', label: 'Explorează', icon: 'search' },
    ...common,
  ],
  FREELANCER: [
    { to: '/dashboard', label: 'Acasă', icon: 'home' },
    { to: '/recommendations', label: 'Proiecte potrivite', icon: 'sparkle', badge: 'matches' },
    { to: '/browse', label: 'Explorează proiecte', icon: 'search' },
    ...common,
    { to: '/profile/edit', label: 'Profil și portofoliu', icon: 'user' },
  ],
  ADMIN: [{ to: '/admin', label: 'Administrare', icon: 'shield' }],
};

export const QUICK = {
  CLIENT: { to: '/projects/new', label: 'Postează proiect', icon: 'plus' },
  FREELANCER: { to: '/profile/edit', label: 'Editează profilul', icon: 'edit' },
};
