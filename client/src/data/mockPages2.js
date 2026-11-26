// Date de test (a doua rundă). Înlocuiește cu: GET /categories, /skills, /freelancers, /projects, /projects/:id,
// /freelancers/:id, /notifications, /admin/* (README, secțiunea 5). `ownerId` decide cine vede recomandările unui proiect.
import { matches, myProjects } from './mockPages.js';

export const categories = ['Web', 'Design', 'Aplicații mobile', 'Video', 'Traduceri', 'Date și AI'];
export const skills = ['React', 'Tailwind CSS', 'Next.js', 'TypeScript', 'Node.js', 'UI/UX', 'Logo', 'Branding', 'Figma', 'Montaj video', 'After Effects', 'Traduceri RO-EN', 'Python', 'SEO'];
export const levels = ['Începător', 'Junior', 'Mid', 'Senior'];
export const availability = ['Disponibil', 'Disponibil limitat', 'Indisponibil'];
export const ME_ID = 'u1';

const extra = [['React', 'Tailwind CSS', 'UI/UX'], ['UI/UX', 'Figma', 'Branding'], ['React', 'Node.js', 'TypeScript'], ['React', 'Tailwind CSS'], ['UI/UX', 'Figma']];
export const freelancersList = matches.map((m, i) => ({ ...m, skills: extra[i], category: ['Web', 'Design', 'Web', 'Web', 'Design'][i], rateNum: parseInt(m.rate), completed: [38, 3, 21, 1, 9][i] }));

// ---- Proiecte (ale mele + ale altora) ----
const mineInfo = {
  1: { category: 'Web', size: 'Mic', level: 'Începător – Junior', views: 48, description: 'Am nevoie de un site simplu și elegant pentru o cafenea locală. Vreau o pagină de prezentare cu meniul, galerie foto, program și locație. Design modern, optimizat pentru mobil, cu încărcare rapidă. Logo-ul există deja; paleta de culori o stabilim împreună.' },
  2: { category: 'Design', size: 'Mic', level: 'Începător', views: 12, description: 'Caut un logo și o identitate vizuală de bază (culori, font, carte de vizită) pentru o frizerie nouă din oraș. Stil modern, masculin, dar cald.' },
  3: { category: 'Web', size: 'Mediu', level: 'Mid', views: 77, description: 'Aplicație web pentru rezervări la un salon de înfrumusețare: calendar, servicii, notificări pe email. Lucrăm pe etape.' },
  4: { category: 'Traduceri', size: 'Mic', level: 'Începător', views: 31, description: 'Traducerea meniului unui restaurant din română în engleză, cu termeni culinari corecți.' },
  5: { category: 'Design', size: 'Mic', level: 'Junior', views: 19, description: 'Trei bannere pentru o campanie de toamnă, în format social media.' },
};
const others = [
  { id: 11, ownerId: 'u7', author: 'TechFlow', verified: true, images: ['/project-previews/fitness-site.svg', '/project-previews/fitness-mobile.svg'], title: 'Landing page pentru aplicație de fitness', tags: ['React', 'Tailwind CSS', 'UI/UX'], budget: '500 – 800 lei', deadline: '10 dec', status: 'OPEN', category: 'Web', size: 'Mic', level: 'Junior', time: 'acum 2 ore', posted: 7, rating: '4.8', since: '2025',
    description: 'Caut un frontend developer pentru o pagină de prezentare rapidă, cu animații discrete și optimizată pentru mobil. Designul în Figma este gata; aștept implementarea.' },
  { id: 12, ownerId: 'u8', author: 'Maria Popa', title: 'Aplicație de management al taskurilor', tags: ['Next.js', 'Supabase', 'TypeScript'], budget: '300 – 600 lei', deadline: '20 dec', status: 'OPEN', category: 'Web', size: 'Mediu', level: 'Mid', time: 'acum 4 ore', posted: 2, rating: '5.0', since: '2026',
    description: 'Caut un developer pentru o aplicație web de tip task tracker, cu funcții de colaborare în timp real și autentificare.' },
  { id: 13, ownerId: 'u9', author: 'Daniel Ionescu', image: '/project-previews/video-editing.svg', title: 'Editare video pentru YouTube', tags: ['Video', 'Montaj', 'After Effects'], budget: 'Negociabil', deadline: '18 dec', status: 'OPEN', category: 'Video', size: 'Mic', level: 'Mid', time: 'acum 6 ore', posted: 5, rating: '4.6', since: '2025',
    description: 'Am nevoie de un editor video cu experiență pentru conținut YouTube (gaming / tech): montaj, subtitrări și miniaturi.' },
  { id: 14, ownerId: 'u10', author: 'Studio Nord', verified: true, images: ['/project-previews/bakery-brand.svg', '/project-previews/bakery-packaging.svg'], title: 'Rebranding pentru o brutărie de familie', tags: ['Logo', 'Branding', 'Figma'], budget: '700 – 1.100 lei', deadline: '22 dec', status: 'OPEN', category: 'Design', size: 'Mediu', level: 'Junior', time: 'ieri', posted: 12, rating: '4.9', since: '2024',
    description: 'Vrem să reînnoim imaginea brutăriei: logo, ambalaje și două postări-șablon pentru rețelele sociale.' },
  { id: 15, ownerId: 'u11', author: 'Elena Marin', title: 'Traducere site din română în engleză', tags: ['Traduceri RO-EN', 'Copywriting'], budget: '250 – 400 lei', deadline: '5 ian', status: 'OPEN', category: 'Traduceri', size: 'Mic', level: 'Junior', time: 'acum o zi', posted: 3, rating: '4.7', since: '2026',
    description: 'Caut un traducător pentru un site de prezentare (aprox. 30 de pagini), cu ton prietenos și termeni de turism.' },
  { id: 16, ownerId: 'u12', author: 'FitLab', title: 'Aplicație mobilă pentru antrenamente', tags: ['React Native', 'TypeScript', 'UI/UX'], budget: '1.500 – 2.500 lei', deadline: '30 ian', status: 'OPEN', category: 'Aplicații mobile', size: 'Mare', level: 'Mid', time: 'acum 2 zile', posted: 1, rating: '5.0', since: '2026',
    description: 'Căutăm un dezvoltator pentru un MVP de aplicație mobilă: planuri de antrenament, progres și notificări.' },
  { id: 17, ownerId: 'u13', author: 'ShopNova', title: 'Analiză de date pentru un magazin online', tags: ['Python', 'Analiză date'], budget: '400 – 700 lei', deadline: '10 ian', status: 'OPEN', category: 'Date și AI', size: 'Mic', level: 'Mid', time: 'acum 3 zile', posted: 4, rating: '4.5', since: '2025',
    description: 'Vrem un raport despre comportamentul clienților (vânzări, abandon de coș) și recomandări concrete.' },
];
export const allProjects = [
  ...myProjects.map((p) => ({ ...p, ownerId: ME_ID, author: 'Tu', ...mineInfo[p.id] })),
  ...others,
];
export const getProject = (id) => allProjects.find((p) => String(p.id) === String(id));
export const projectsList = others;

// ---- Proiecte recomandate freelancerului (direcția freelancer → proiecte, README 9.11) ----
export const projectMatchesForMe = [
  { id: 'pm1', projectId: 11, score: 91, starter: false, reasons: ['Ai 3 lucrări similare în portofoliu (site-uri de prezentare)', 'React și Tailwind CSS verificate', 'Bugetul se potrivește cu tariful tău'] },
  { id: 'pm2', projectId: 14, score: 84, starter: false, reasons: ['Portofoliu de branding pentru afaceri locale', 'Termen realist: 6 săptămâni'] },
  { id: 'pm3', projectId: 12, score: 73, starter: true, reasons: ['Proiect de start: risc mic, garanție pentru client', 'Abilitățile cerute sunt acoperite în mare parte'] },
  { id: 'pm4', projectId: 13, score: 66, starter: false, reasons: ['Abilități apropiate (montaj, animație)', 'Buget negociabil'] },
];

export const activity = [
  { id: 1, icon: 'filePlus', text: 'Proiectul a fost postat', time: 'acum 2 ore' },
  { id: 2, icon: 'sparkle', text: 'Brief-ul a fost analizat: 3 abilități deduse, mărime „mic”', time: 'acum 2 ore' },
  { id: 3, icon: 'user', text: '5 freelanceri potriviți au fost găsiți', time: 'acum 2 ore' },
  { id: 4, icon: 'check', text: 'Ana Petrova și-a arătat interesul', time: 'acum 1 oră' },
  { id: 5, icon: 'chat', text: 'Conversație pornită cu Ana Petrova', time: 'acum 40 min' },
];

export const profile = {
  bio: 'Construiesc site-uri rapide și clare pentru afaceri mici. Îmi place să lucrez în etape, cu livrări scurte și feedback din timp, ca proiectul să iasă exact cum ai nevoie.',
  languages: ['Română', 'Engleză'], completed: 12, onTime: '96%', response: 'sub 2 ore',
  skills: [{ name: 'React', verified: true }, { name: 'Tailwind CSS', verified: true }, { name: 'UI/UX', verified: false }, { name: 'TypeScript', verified: false }],
  portfolio: [
    { id: 'p1', title: 'Site pentru cafenea „Ceaiul”', description: 'Pagină de prezentare cu meniu și rezervări.', link: 'exemplu.md/ceaiul', tone: 'from-fm-ink via-fm-graphite to-fm-steel' },
    { id: 'p2', title: 'Magazin online de ceramică', description: 'Catalog, coș și plată online.', link: 'exemplu.md/ceramica', tone: 'from-fm-graphite via-fm-ink to-fm-graphite' },
    { id: 'p3', title: 'Pagină pentru salon de înfrumusețare', description: 'Programări online și galerie.', link: 'exemplu.md/salon', tone: 'from-fm-steel via-fm-graphite to-fm-ink' },
  ],
  reviews: [
    { id: 'r1', author: 'Ion R.', rating: 5, text: 'Livrat înainte de termen și exact cum ne-am înțeles. Recomand.', date: 'octombrie' },
    { id: 'r2', author: 'Daniela P.', rating: 5, text: 'Comunicare foarte bună, a explicat clar fiecare pas.', date: 'septembrie' },
    { id: 'r3', author: 'Sergiu M.', rating: 4, text: 'Site frumos; am avut nevoie de o rundă extra de ajustări.', date: 'august' },
  ],
};
export const tierProgress = { tier: 'Start', next: 'Verificat', done: 1, need: 3 };

export const notifications = [
  { id: 'n1', kind: 'match', icon: 'sparkle', group: 'Azi', text: 'Ai 5 potriviri noi pentru „Website pentru cafenea modernă”.', time: 'acum 10 min', read: false, to: '/recommendations' },
  { id: 'n2', kind: 'message', icon: 'chat', group: 'Azi', text: 'Ana Petrova ți-a trimis un mesaj.', time: 'acum 25 min', read: false, to: '/messages/c1' },
  { id: 'n3', kind: 'collab', icon: 'handshake', group: 'Azi', text: 'Maria Cojocaru a acceptat invitația la „Logo pentru frizerie”.', time: 'acum 3 ore', read: false, to: '/engagements' },
  { id: 'n4', kind: 'message', icon: 'chat', group: 'Azi', text: 'TechFlow vrea să colaboreze cu tine la „Landing page pentru aplicație de fitness”.', time: 'acum 4 ore', read: false, to: '/messages/c4' },
  { id: 'n5', kind: 'collab', icon: 'check', group: 'Ieri', text: 'Ana Petrova a livrat „Website pentru cafenea modernă”. Confirmă finalizarea.', time: 'ieri', read: true, to: '/engagements' },
  { id: 'n6', kind: 'match', icon: 'trend', group: 'Ieri', text: 'Un proiect nou se potrivește cu profilul tău: „Rebranding pentru o brutărie de familie” (84%).', time: 'ieri', read: true, to: '/projects/14' },
  { id: 'n7', kind: 'collab', icon: 'star', group: 'Mai vechi', text: 'Vlad Rotaru ți-a lăsat o recenzie.', time: 'acum 3 zile', read: true, to: '/engagements' },
];

export const adminUsers = [
  { id: 'u1', name: 'Ion Russu', email: 'ion@exemplu.md', joined: 'nov 2026', blocked: false },
  { id: 'u2', name: 'Ana Petrova', email: 'ana@exemplu.md', joined: 'sept 2026', blocked: false },
  { id: 'u3', name: 'Vlad Rotaru', email: 'vlad@exemplu.md', joined: 'oct 2026', blocked: false },
  { id: 'u4', name: 'Test Spam', email: 'spam@exemplu.md', joined: 'nov 2026', blocked: true },
];
export const adminReports = [
  { id: 'x1', targetType: 'PROJECT', target: 'Câștigă rapid din acasă', reason: 'Anunț înșelător', by: 'Ana Petrova', resolved: false },
  { id: 'x2', targetType: 'USER', target: 'Test Spam', reason: 'Mesaje nesolicitate în chat', by: 'Maria Cojocaru', resolved: false },
  { id: 'x3', targetType: 'MESSAGE', target: 'Mesaj în „Logo pentru frizerie”', reason: 'Limbaj nepotrivit', by: 'Ion Russu', resolved: true },
];
export const adminStats = [
  { icon: 'user', value: '1.248', label: 'Conturi', delta: '+38 săptămâna aceasta' }, { icon: 'folder', value: '312', label: 'Proiecte active', delta: '+12' },
  { icon: 'handshake', value: '87', label: 'Colaborări în lucru', delta: '+5' }, { icon: 'flame', value: '3', label: 'Raportări deschise', delta: '2 noi azi' },
];
export const adminChart = [['L', 24], ['M', 31], ['M', 28], ['J', 44], ['V', 52], ['S', 19], ['D', 14]];
export const adminFeed = ['Proiect nou: „Rebranding pentru o brutărie de familie”', 'Cont nou: Elena Munteanu', 'Colaborare finalizată: „Traducere meniu RO → EN”', 'Raportare nouă pe „Câștigă rapid din acasă”'];
