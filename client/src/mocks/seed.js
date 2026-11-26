// Date de pornire pentru serverul simulat. Parola pentru toți: demo1234
const now = Date.now();
const ago = (d) => new Date(now - d * 86400000).toISOString();
const ahead = (d) => new Date(now + d * 86400000).toISOString().slice(0, 10);

const categories = [
  { id: 'c_web', name: 'Web și programare' }, { id: 'c_design', name: 'Design grafic' }, { id: 'c_mkt', name: 'Marketing' },
  { id: 'c_write', name: 'Scriere și traduceri' }, { id: 'c_video', name: 'Video și foto' },
];
const S = (id, name, categoryId) => ({ id, name, categoryId });
const skills = [
  S('s_react', 'React', 'c_web'), S('s_js', 'JavaScript', 'c_web'), S('s_node', 'Node.js', 'c_web'), S('s_wp', 'WordPress', 'c_web'), S('s_html', 'HTML/CSS', 'c_web'), S('s_seo', 'SEO', 'c_mkt'),
  S('s_logo', 'Logo', 'c_design'), S('s_brand', 'Branding', 'c_design'), S('s_figma', 'Figma', 'c_design'), S('s_ui', 'UI/UX', 'c_design'),
  S('s_smm', 'Social media', 'c_mkt'), S('s_ads', 'Google Ads', 'c_mkt'),
  S('s_copy', 'Copywriting', 'c_write'), S('s_tr', 'Traduceri RO-EN', 'c_write'),
  S('s_video', 'Montaj video', 'c_video'), S('s_photo', 'Fotografie de produs', 'c_video'),
];

const user = (id, name, email, role, extra = {}) => ({ id, name, email, role, password: 'demo1234', avatarUrl: '', isBlocked: false, createdAt: ago(60), ...extra });
const users = [
  user('u_admin', 'Admin Demo', 'admin@demo.md', 'ADMIN'),
  user('u_ion', 'Ion Rusu', 'client@demo.md', 'CLIENT'),
  user('u_elena', 'Elena Munteanu', 'elena@demo.md', 'CLIENT'),
  user('u_ana', 'Ana Petrova', 'freelancer@demo.md', 'FREELANCER'),
  user('u_maria', 'Maria Cojocaru', 'maria@demo.md', 'FREELANCER'),
  user('u_alex', 'Alex Morgan', 'alex@demo.md', 'FREELANCER'),
  user('u_dan', 'Dan Lupu', 'dan@demo.md', 'FREELANCER'),
  user('u_sofia', 'Sofia Rotaru', 'sofia@demo.md', 'FREELANCER'),
  user('u_vlad', 'Vlad Ciobanu', 'vlad@demo.md', 'FREELANCER'),
];

const F = (id, userId, o) => ({ id, userId, bio: 'Lucrez atent și comunic clar. Îmi place să înțeleg nevoia reală a clientului înainte să încep.', level: 'MID', availability: 'AVAILABLE', languages: ['Română', 'Engleză'], portfolio: [], onboarded: true, completedCount: 0, createdAt: ago(40), ...o });
const P = (id, title, description) => ({ id, title, description, imageUrl: '', link: '' });
const freelancers = [
  F('f_ana', 'u_ana', { title: 'Web developer pentru afaceri mici', level: 'MID', hourlyRate: 14, skillIds: ['s_react', 's_js', 's_html', 's_wp'], completedCount: 6,
    portfolio: [P('pf1', 'Site pentru o cafenea', 'Site de prezentare cu meniu și rezervări.'), P('pf2', 'Magazin online de ceramică', 'Catalog, coș și plată.'), P('pf3', 'Landing page pentru un salon', 'Pagină unică, orientată spre programări.')] }),
  F('f_maria', 'u_maria', { title: 'Designer de identitate vizuală', level: 'SENIOR', hourlyRate: 22, skillIds: ['s_logo', 's_brand', 's_figma', 's_ui'], completedCount: 14, portfolio: [P('pf4', 'Branding pentru cafenele', 'Logo, paletă și ambalaje.')] }),
  F('f_alex', 'u_alex', { title: 'Full-stack developer', level: 'SENIOR', hourlyRate: 28, skillIds: ['s_react', 's_node', 's_js', 's_html'], availability: 'LIMITED', completedCount: 21 }),
  F('f_dan', 'u_dan', { title: 'Specialist social media', level: 'JUNIOR', hourlyRate: 9, skillIds: ['s_smm', 's_copy', 's_ads'], completedCount: 1 }),
  F('f_sofia', 'u_sofia', { title: 'Designer la început de drum', level: 'BEGINNER', hourlyRate: 6, skillIds: ['s_logo', 's_figma', 's_brand'], completedCount: 0, portfolio: [P('pf5', 'Logo pentru o frizerie (proiect de studiu)', 'Trei variante și ghid de utilizare.')] }),
  F('f_vlad', 'u_vlad', { title: 'Traducător și copywriter', level: 'MID', hourlyRate: 11, skillIds: ['s_tr', 's_copy', 's_seo'], completedCount: 3 }),
];
const tierOf = (n) => (n >= 10 ? 'EXPERT' : n >= 3 ? 'PROVEN' : n >= 1 ? 'VERIFIED' : 'START');
freelancers.forEach((f) => { f.tier = tierOf(f.completedCount); });

const J = (id, clientId, o) => ({ id, clientId, status: 'OPEN', isStarter: false, deadline: ahead(30), createdAt: ago(3), matchedAt: ago(3), clarified: true, ...o });
const projects = [
  J('p_1', 'u_ion', { title: 'Website pentru cafeneaua modernă', description: 'Avem o cafenea în centru și vrem un site simplu cu meniu, program, galerie foto și formular de rezervare. Stil cald, minimalist. Trebuie să arate bine pe telefon.', categoryId: 'c_web', budgetMin: 300, budgetMax: 600, skillIds: ['s_react', 's_html'], createdAt: ago(2), matchedAt: ago(2) }),
  J('p_2', 'u_ion', { title: 'Logo și identitate vizuală pentru frizerie', description: 'Frizerie nouă pentru bărbați. Avem nevoie de logo, culori și un set simplu pentru Instagram.', categoryId: 'c_design', budgetMin: 80, budgetMax: 200, skillIds: ['s_logo', 's_brand'], isStarter: true, createdAt: ago(1), matchedAt: ago(1) }),
  J('p_3', 'u_elena', { title: 'Traducerea site-ului din română în engleză', description: 'Site de prezentare cu aproximativ 12 pagini. Ton prietenos, termeni simpli.', categoryId: 'c_write', budgetMin: 100, budgetMax: 180, skillIds: ['s_tr', 's_copy'], createdAt: ago(4), matchedAt: ago(4) }),
  J('p_4', 'u_elena', { title: 'Administrare Instagram pentru o florărie', description: 'Căutăm pe cineva care să posteze de 3 ori pe săptămână și să răspundă la mesaje. Pozele le facem noi.', categoryId: 'c_mkt', budgetMin: 120, budgetMax: 200, skillIds: ['s_smm', 's_copy'], createdAt: ago(5), matchedAt: ago(5) }),
  J('p_5', 'u_elena', { title: 'Magazin online pe WordPress', description: 'Catalog de aproximativ 40 de produse, plată cu cardul, livrare prin curier.', categoryId: 'c_web', budgetMin: 500, budgetMax: 900, skillIds: ['s_wp', 's_html'], createdAt: ago(6), matchedAt: ago(6) }),
];

export function seed() {
  return {
    categories, skills, users, freelancers, projects,
    clientProfiles: [{ userId: 'u_ion', type: 'COMPANY', companyName: 'Cafeneaua Nordic', industry: 'HoReCa', description: 'Cafenea de specialitate în centrul orașului.' }, { userId: 'u_elena', type: 'PERSON', companyName: '', industry: 'Retail', description: '' }],
    matchStates: [], conversations: [], engagements: [], notifications: [], reports: [], exposure: {}, seq: 100,
  };
}
