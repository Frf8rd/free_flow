// Date de test — se înlocuiesc cu apelurile din README: GET /matches/me, /engagements/me, /notifications, /freelancers/me/tier
export const me = { id: 'u1', name: 'Ion Russu', handle: 'iruss', initials: 'IR', email: 'ion@exemplu.md' };
export const counts = { newMatches: 5, unreadMessages: 3 };

export const stats = [
  { icon: 'folder', value: '3', label: 'Proiecte active', color: 'text-fm-graphite' },
  { icon: 'check', value: '2', label: 'Propuneri primite', color: 'text-fm-graphite' },
  { icon: 'star', value: '98%', label: 'Potrivire medie', color: 'text-amber-500', fill: true },
  { icon: 'flame', value: 'Nivel', label: 'În creștere', color: 'text-fm-ink', up: true },
];

export const trending = [
  { title: 'Dezvoltare web', count: '2.4K proiecte' },
  { title: 'Aplicații mobile', count: '1.8K proiecte' },
  { title: 'Analiză de date', count: '1.2K proiecte' },
  { title: 'Design UI/UX', count: '986 proiecte' },
  { title: 'Inteligență artificială', count: '745 proiecte' },
];

export const freelancers = [
  { name: 'Alex Morgan', role: 'Full Stack Developer', rating: '4.8', reviews: 124, initials: 'AM', tone: 'from-fm-graphite to-fm-ink' },
  { name: 'Ana Petrova', role: 'Frontend Developer', rating: '4.9', reviews: 203, initials: 'AP', tone: 'from-fm-steel to-fm-graphite' },
];

export const projects = [
  {
    category: 'Web', id: 11, author: 'TechFlow', handle: 'techflow', time: '2h', verified: true, logo: 'code',
    title: 'Landing page pentru aplicație de fitness',
    text: 'Caut un frontend developer pentru o pagină de prezentare rapidă, cu animații discrete și optimizată pentru mobil.',
    tags: ['React', 'Tailwind CSS', 'UI/UX'], budget: '500 – 800 lei', duration: '1 săptămână',
    comments: 24, reposts: 47, likes: 210, thumb: 'from-fm-ink via-fm-graphite to-fm-steel', images: ['/project-previews/fitness-site.svg', '/project-previews/fitness-mobile.svg'],
  },
  {
    category: 'Web', id: 12, author: 'Maria Popa', handle: 'mariap', time: '4h', initials: 'M',
    title: 'Aplicație de management al taskurilor',
    text: 'Caut un developer pentru o aplicație web de tip task tracker, cu funcții de colaborare în timp real.',
    tags: ['Next.js', 'Supabase', 'TypeScript'], budget: '300 – 600 lei', duration: '2 săptămâni',
    comments: 17, reposts: 32, likes: 180, thumb: 'from-fm-graphite via-fm-ink to-fm-graphite',
  },
  {
    category: 'Video', id: 13, author: 'Daniel Ionescu', handle: 'daniel_i', time: '6h', initials: 'D',
    title: 'Editare video pentru YouTube',
    text: 'Am nevoie de un editor video cu experiență pentru conținut YouTube (gaming / tech). Buget: negociabil.',
    tags: ['Video', 'Montaj', 'After Effects'], budget: 'Negociabil', duration: '3 zile',
    comments: 9, reposts: 15, likes: 96, thumb: 'from-fm-steel via-fm-graphite to-fm-ink', image: '/project-previews/video-editing.svg',
  },
  {
    category: 'Design', id: 14, author: 'Studio Nord', handle: 'studionord', time: '1z', verified: true, logo: 'code',
    title: 'Rebranding pentru o brutărie de familie',
    text: 'Vrem să reînnoim imaginea brutăriei: logo, ambalaje și două postări-șablon pentru rețelele sociale.',
    tags: ['Logo', 'Branding', 'Figma'], budget: '700 – 1.100 lei', duration: '6 săptămâni',
    comments: 12, reposts: 21, likes: 143, thumb: 'from-fm-graphite via-fm-ink to-fm-steel', images: ['/project-previews/bakery-brand.svg', '/project-previews/bakery-packaging.svg'],
  },
  {
    category: 'Traduceri', id: 15, author: 'Elena Marin', handle: 'elenam', time: '1z', initials: 'E',
    title: 'Traducere site din română în engleză',
    text: 'Caut un traducător pentru un site de prezentare (aprox. 30 de pagini), cu ton prietenos și termeni de turism.',
    tags: ['Traduceri RO-EN', 'Copywriting'], budget: '250 – 400 lei', duration: '2 săptămâni',
    comments: 5, reposts: 8, likes: 61, thumb: 'from-fm-steel via-fm-ink to-fm-graphite',
  },
  {
    category: 'Aplicații mobile', id: 16, author: 'FitLab', handle: 'fitlab', time: '2z', initials: 'F',
    title: 'Aplicație mobilă pentru antrenamente',
    text: 'Căutăm un dezvoltator pentru un MVP de aplicație mobilă: planuri de antrenament, progres și notificări.',
    tags: ['React Native', 'TypeScript', 'UI/UX'], budget: '1.500 – 2.500 lei', duration: '5 săptămâni',
    comments: 14, reposts: 19, likes: 175, thumb: 'from-fm-ink via-fm-graphite to-fm-steel',
  },
  {
    category: 'Date și AI', id: 17, author: 'ShopNova', handle: 'shopnova', time: '3z', initials: 'S',
    title: 'Analiză de date pentru un magazin online',
    text: 'Vrem un raport despre comportamentul clienților (vânzări, abandon de coș) și recomandări concrete.',
    tags: ['Python', 'Analiză date'], budget: '400 – 700 lei', duration: '2 săptămâni',
    comments: 7, reposts: 11, likes: 88, thumb: 'from-fm-graphite via-fm-steel to-fm-ink',
  },
];

/* ---- Panoul din dreapta (date demonstrative; se leagă ulterior la API) ---- */
export const attention = {
  CLIENT: [
    { icon: 'handshake', label: 'Freelanceri interesați', value: 2, to: '/projects/mine' },
    { icon: 'chat', label: 'Mesaje necitite', value: 3, to: '/messages' },
    { icon: 'check', label: 'Livrări de verificat', value: 1, to: '/engagements' },
  ],
  FREELANCER: [
    { icon: 'sparkle', label: 'Potriviri noi pentru tine', value: 5, to: '/recommendations' },
    { icon: 'chat', label: 'Mesaje necitite', value: 3, to: '/messages' },
    { icon: 'clock', label: 'Colaborări active', value: 1, to: '/engagements' },
  ],
};

export const pipelineStages = ['Brief', 'Potriviri', 'Interes', 'Colaborare', 'Livrat'];
export const activeProjects = [
  { title: 'Website pentru cafenea modernă', stage: 2, note: '2 propuneri noi', due: '12 dec' },
  { title: 'Aplicație mobilă de livrări', stage: 3, note: 'Etapa 2 din 4', due: '28 nov' },
  { title: 'Dashboard analiză vânzări', stage: 1, note: '5 potriviri', due: '—' },
];

export const topMatch = {
  name: 'Ana Petrova', role: 'Frontend Developer', initials: 'AP', score: 94, project: 'Website pentru cafenea modernă',
  parts: [['Competențe', 96], ['Buget', 91], ['Disponibilitate', 88], ['Istoric', 97]],
  runnersUp: [
    { name: 'Alex Morgan', role: 'Full Stack Developer', initials: 'AM', score: 89 },
    { name: 'Dan Ceban', role: 'UI/UX Designer', initials: 'DC', score: 85 },
  ],
};

export const market = {
  CLIENT: [
    { name: 'Dezvoltare web', median: '650 lei', note: 'prima propunere ~3h', demand: 80 },
    { name: 'Aplicații mobile', median: '1 400 lei', note: 'prima propunere ~5h', demand: 60 },
    { name: 'Analiză de date', median: '900 lei', note: 'prima propunere ~6h', demand: 45 },
    { name: 'Design UI/UX', median: '500 lei', note: 'prima propunere ~2h', demand: 70 },
  ],
  FREELANCER: [
    { name: 'React', median: '650 lei', note: '+12% cerere', demand: 85 },
    { name: 'Tailwind CSS', median: '500 lei', note: '+8% cerere', demand: 62 },
    { name: 'UI/UX', median: '500 lei', note: '+3% cerere', demand: 55 },
    { name: 'Node.js', median: '900 lei', note: '−2% cerere', demand: 48 },
  ],
};

export const deadlines = [
  { title: 'Livrare etapa 1 — Aplicație livrări', when: 'în 2 zile' },
  { title: 'Call cu TechFlow', when: 'mâine, 14:00' },
];
