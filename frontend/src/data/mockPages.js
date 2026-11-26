// Date de test pentru paginile noi. Se înlocuiesc cu: GET /projects/:id/matches, /projects/me,
// /conversations, /engagements/me, PATCH /users/me (vezi README, secțiunea 5)
export const matchProject = { title: 'Website pentru cafenea modernă', status: 'DONE' };
export const clarifications = ['Ai deja un logo sau o identitate vizuală?', 'Ai nevoie de comenzi online sau doar de o pagină de prezentare?'];

export const matches = [
  { id: 'm1', name: 'Ana Petrova', role: 'Frontend Developer', initials: 'AP', tone: 'from-fm-steel to-fm-graphite', score: 94, rating: '4.9', reviews: 203, tier: 'Expert', rate: '14 €/h', avail: 'Disponibilă',
    reasons: ['7 lucrări similare în portofoliu (site-uri pentru HoReCa)', 'Prețul se încadrează în buget', 'React și Tailwind CSS verificate'] },
  { id: 'm2', name: 'Maria Cojocaru', role: 'Web Designer', initials: 'MC', tone: 'from-fm-graphite to-fm-ink', score: 88, growing: true, reviews: 1, tier: 'Verificat', rate: '9 €/h', avail: 'Disponibilă',
    reasons: ['3 lucrări relevante: branding pentru cafenele', 'Abilități UI/UX verificate de platformă', 'Termen realist pentru 1 săptămână'] },
  { id: 'm3', name: 'Alex Morgan', role: 'Full Stack Developer', initials: 'AM', tone: 'from-fm-graphite to-fm-ink', score: 86, rating: '4.8', reviews: 124, tier: 'Încercat', rate: '18 €/h', avail: 'Disponibil limitat',
    reasons: ['Acoperă toate abilitățile esențiale', 'Experiență cu aplicații pentru mobil'], warn: 'Termen strâns: disponibil doar parțial în această săptămână' },
  { id: 'm4', name: 'Vlad Rotaru', role: 'Frontend Developer', initials: 'VR', tone: 'from-fm-steel to-fm-ink', score: 81, growing: true, reviews: 0, tier: 'Start', rate: '7 €/h', avail: 'Disponibil',
    reasons: ['Proiect mic, potrivit pentru începători', '2 lucrări din domeniu apropiat (restaurante)', 'Preț sub bugetul maxim'] },
  { id: 'm5', name: 'Elena Munteanu', role: 'UI/UX Designer', initials: 'EM', tone: 'from-fm-steel to-fm-graphite', score: 77, rating: '4.7', reviews: 41, tier: 'Încercat', rate: '12 €/h', avail: 'Disponibilă',
    reasons: ['Portofoliu solid de design pentru mobil', 'Limba cerută: română'] },
];

export const myProjects = [
  { id: 1, title: 'Website pentru cafenea modernă', tags: ['React', 'Tailwind CSS', 'UI/UX'], budget: '500 – 800 lei', deadline: '5 dec', status: 'OPEN', matches: 5, interested: 2, time: 'acum 2 ore' },
  { id: 2, title: 'Logo și identitate vizuală pentru frizerie', tags: ['Logo', 'Branding'], budget: '300 – 450 lei', deadline: '12 dec', status: 'OPEN', matching: 'RUNNING', matches: 0, interested: 0, time: 'acum 10 min' },
  { id: 3, title: 'Aplicație de rezervări pentru salon', tags: ['Next.js', 'TypeScript'], budget: '900 – 1.400 lei', deadline: '20 dec', status: 'IN_PROGRESS', matches: 5, interested: 3, time: 'acum 6 zile' },
  { id: 4, title: 'Traducere meniu RO → EN', tags: ['Traduceri'], budget: '120 lei', deadline: '2 nov', status: 'COMPLETED', matches: 5, interested: 4, time: 'acum 3 săptămâni' },
  { id: 5, title: 'Banner-e pentru campanie de toamnă', tags: ['Grafică'], budget: '200 lei', deadline: '15 oct', status: 'CLOSED', matches: 3, interested: 0, time: 'acum 6 săptămâni' },
];

// Conversații (același cont: unele pe proiectele mele, altele pe proiecte la care sunt candidat)
export const seedConversations = [
  { id: 'c1', name: 'Ana Petrova', initials: 'AP', tone: 'from-fm-steel to-fm-graphite', headline: 'Frontend Developer', projectId: 1, project: 'Website pentru cafenea modernă', mine: true, unread: 2, time: '14:02', msgs: [
    { id: 'a1', from: 'them', text: 'Bună! Am văzut proiectul tău și mi se pare foarte potrivit pentru ce am lucrat până acum.', time: '13:48', day: 'Azi' },
    { id: 'a2', from: 'me', text: 'Salut, Ana! Mă bucur. Ai putea termina într-o săptămână?', time: '13:55', day: 'Azi' },
    { id: 'a3', from: 'them', text: 'Da, pot livra o primă versiune în 3 zile, apoi ajustăm împreună.', time: '14:01', day: 'Azi' },
    { id: 'a4', from: 'them', text: 'Îți trimit și două exemple de site-uri pentru cafenele.', time: '14:02', day: 'Azi', file: 'exemple-cafenele.pdf' } ] },
  { id: 'c2', name: 'Maria Cojocaru', initials: 'MC', tone: 'from-fm-graphite to-fm-ink', headline: 'Web Designer', projectId: 2, project: 'Logo și identitate vizuală pentru frizerie', mine: true, unread: 1, time: 'Ieri', msgs: [
    { id: 'b1', from: 'them', text: 'Mulțumesc pentru invitație! Pot începe de luni.', time: '18:20', day: 'Ieri' } ] },
  { id: 'c3', name: 'Alex Morgan', initials: 'AM', tone: 'from-fm-graphite to-fm-ink', headline: 'Full Stack Developer', projectId: 3, project: 'Aplicație de rezervări pentru salon', mine: true, unread: 0, time: 'Lun', msgs: [
    { id: 'd1', from: 'me', text: 'Cum stă livrarea pentru prima etapă?', time: '10:12', day: 'Luni' },
    { id: 'd2', from: 'them', text: 'Totul e pe plan, o trimit mâine seară.', time: '10:40', day: 'Luni' } ] },
  { id: 'c4', name: 'TechFlow', initials: 'TF', tone: 'from-fm-ink to-fm-graphite', headline: 'Client · verificat', projectId: 11, project: 'Landing page pentru aplicație de fitness', mine: false, unread: 1, time: '09:15', msgs: [
    { id: 'e1', from: 'them', text: 'Salut! Profilul tău se potrivește bine cu ce căutăm. Poți începe săptămâna aceasta?', time: '09:15', day: 'Azi' } ] },
];

export const engagements = [
  { id: 'e1', title: 'Aplicație de rezervări pentru salon', person: 'Alex Morgan', initials: 'AM', price: '1.200 lei', deadline: '20 dec', status: 'IN_PROGRESS', side: 'client', projectId: 3 },
  { id: 'e2', title: 'Website pentru cafenea modernă', person: 'Ana Petrova', initials: 'AP', price: '700 lei', deadline: '28 nov', status: 'DELIVERED', usedAi: false, side: 'client', projectId: 1 },
  { id: 'e3', title: 'Logo pentru frizerie', person: 'Maria Cojocaru', initials: 'MC', price: '350 lei', deadline: '30 nov', status: 'IN_PROGRESS', side: 'client', projectId: 2 },
  { id: 'e4', title: 'Traducere meniu RO → EN', person: 'Vlad Rotaru', initials: 'VR', price: '120 lei', deadline: '2 nov', status: 'COMPLETED', usedAi: true, side: 'client', projectId: 4 },
  { id: 'e5', title: 'Landing page pentru aplicație de fitness', person: 'TechFlow', initials: 'TF', price: '650 lei', deadline: '10 dec', status: 'IN_PROGRESS', side: 'freelancer', projectId: 11 },
];
