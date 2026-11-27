import { seed } from './seed.js';

const KEY = 'fm-mock-db-v1';
let db;
let mockRefreshToken = null;
try { db = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { db = null; }
if (!db) db = seed();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignorat */ } };
const uid = (p) => `${p}_${++db.seq}`;
const nowIso = () => new Date().toISOString();

export class HttpError extends Error { constructor(status, message, details, code) { super(message); this.status = status; this.details = details; this.code = code; } }
const bad = (m, d) => new HttpError(400, m, d, 'VALIDATION');
const notFound = (m = 'Nu am găsit resursa.') => new HttpError(404, m, null, 'NOT_FOUND');
const forbidden = (m = 'Nu ai permisiunea pentru această acțiune.') => new HttpError(403, m, null, 'FORBIDDEN');

/* ---------- ajutoare de model ---------- */
const U = (id) => db.users.find((u) => u.id === id);
const FP = (id) => db.freelancers.find((f) => f.id === id);
const FPofUser = (uid_) => db.freelancers.find((f) => f.userId === uid_);
const CP = (uid_) => db.clientProfiles.find((c) => c.userId === uid_);
const PR = (id) => db.projects.find((p) => p.id === id);
const skillById = (id) => db.skills.find((s) => s.id === id);
const catById = (id) => db.categories.find((c) => c.id === id);

const onboarded = (u) => (u.role === 'FREELANCER' ? !!FPofUser(u.id)?.onboarded : u.role === 'CLIENT' ? !!CP(u.id) : true);
const userDto = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, avatarUrl: u.avatarUrl, dashboardBackgroundUrl: u.dashboardBackgroundUrl || null, isBlocked: u.isBlocked, onboarded: onboarded(u), createdAt: u.createdAt });

const reviewsOf = (f) => db.engagements.flatMap((e) => (e.reviews || []).filter((r) => r.targetUserId === f.userId).map((r) => ({ ...r, author: { name: U(r.authorId)?.name || 'Client' }, projectTitle: PR(e.projectId)?.title })));
const rating = (f) => { const r = reviewsOf(f); return { ratingAvg: r.length ? +(r.reduce((s, x) => s + x.rating, 0) / r.length).toFixed(1) : null, reviewsCount: r.length }; };
const tierOf = (n) => (n >= 10 ? 'EXPERT' : n >= 3 ? 'PROVEN' : n >= 1 ? 'VERIFIED' : 'START');

const freelancerDto = (f, full = false) => {
  const u = U(f.userId);
  const base = { id: f.id, userId: f.userId, name: u.name, avatarUrl: u.avatarUrl, title: f.title, level: f.level, hourlyRate: f.hourlyRate ?? null, availability: f.availability, languages: f.languages || [],
    skills: (f.skillIds || []).map((id) => skillById(id)).filter(Boolean).map((s) => ({ id: s.id, name: s.name })), skillIds: f.skillIds || [], tier: tierOf(f.completedCount), completedCount: f.completedCount, ...rating(f) };
  return full ? { ...base, bio: f.bio, portfolio: f.portfolio || [], onboarded: !!f.onboarded, onTimeRate: f.completedCount ? 96 : null, createdAt: f.createdAt } : base;
};

const projectDto = (p, me) => {
  const owner = U(p.clientId);
  const states = db.matchStates.filter((m) => m.projectId === p.id && m.status !== 'DISMISSED');
  const mine = me?.role === 'FREELANCER' ? FPofUser(me.id) : null;
  return { id: p.id, clientId: p.clientId, title: p.title, description: p.description, categoryId: p.categoryId, category: catById(p.categoryId) || null, budgetMin: p.budgetMin ?? null, budgetMax: p.budgetMax ?? null, deadline: p.deadline || null, status: p.status, isStarter: !!p.isStarter,
    skills: (p.skillIds || []).map((id) => skillById(id)).filter(Boolean).map((s) => ({ id: s.id, name: s.name, source: 'USER' })), matchingStatus: matchingStatus(p), createdAt: p.createdAt,
    client: { userId: owner.id, name: owner.name, avatarUrl: owner.avatarUrl, companyName: CP(owner.id)?.companyName || '' },
    matchesCount: matchingStatus(p) === 'DONE' ? computeFor(p).length : 0, interestedCount: states.filter((s) => ['FREELANCER_INTERESTED', 'ACCEPTED'].includes(s.status)).length,
    myMatch: mine && scorePair(p, mine).hit.length ? matchDto(getState(p.id, mine.id), 'FREELANCER') : undefined };
};

/* ---------- potrivire ---------- */
function matchingStatus(p) {
  const t = Date.now() - new Date(p.matchedAt || p.createdAt).getTime();
  return t < 1500 ? 'PENDING' : t < 3500 ? 'RUNNING' : 'DONE';
}
function scorePair(p, f) {
  const need = p.skillIds || [], have = f.skillIds || [];
  const hit = need.filter((s) => have.includes(s));
  const skills = need.length ? hit.length / need.length : 0.5;
  const budgetOk = p.budgetMax == null || f.hourlyRate == null ? 0.7 : f.hourlyRate * 25 <= p.budgetMax * 1.4 ? 1 : 0.4;
  const availability = { AVAILABLE: 1, LIMITED: 0.6, UNAVAILABLE: 0 }[f.availability];
  const level = f.level === 'BEGINNER' && !p.isStarter ? 0.6 : 0.9;
  const evidence = Math.min(1, (f.portfolio?.length || 0) / 3);
  const rate = rating(f);
  const reviews = rate.ratingAvg ? rate.ratingAvg / 5 : 0.5;
  const components = { skills, evidence, budget: budgetOk, availability, level, reviews };
  const score = Math.round((skills * 0.45 + evidence * 0.15 + budgetOk * 0.15 + availability * 0.1 + level * 0.05 + reviews * 0.1) * 100);
  return { score, hit, components };
}
function computeFor(p) {
  const scored = db.freelancers.filter((f) => f.onboarded && f.availability !== 'UNAVAILABLE' && f.userId !== p.clientId)
    .map((f) => ({ f, ...scorePair(p, f) })).filter((x) => x.hit.length > 0).sort((a, b) => b.score - a.score);
  const top = scored.filter((x) => tierOf(x.f.completedCount) !== 'START').slice(0, 3);
  const growing = scored.filter((x) => tierOf(x.f.completedCount) === 'START' && !top.includes(x)).slice(0, 2);
  const picked = [...top, ...growing].sort((a, b) => b.score - a.score).slice(0, 5);
  return picked.map((x, i) => ({ ...x, rank: i + 1, exploration: growing.includes(x) }));
}
function getState(projectId, freelancerId) {
  let s = db.matchStates.find((m) => m.projectId === projectId && m.freelancerId === freelancerId);
  if (!s) { s = { id: uid('m'), projectId, freelancerId, status: 'SUGGESTED', createdAt: nowIso() }; db.matchStates.push(s); }
  return s;
}
const nameList = (ids) => ids.map((i) => skillById(i)?.name).filter(Boolean);
function reasonsFor(p, f, calc, exploration) {
  const hit = nameList(calc.hit);
  const forClient = [];
  if (hit.length) forClient.push(`Are abilitățile cerute: ${hit.join(', ')}`);
  if (f.portfolio?.length) forClient.push(`${f.portfolio.length} lucrări în portofoliu`);
  if (f.availability === 'AVAILABLE') forClient.push('Disponibil acum');
  if (f.hourlyRate != null && calc.components.budget === 1) forClient.push('Tarif în linie cu bugetul');
  const forFreelancer = [];
  if (hit.length) forFreelancer.push(`Se potrivește cu: ${hit.join(', ')}`);
  if (p.isStarter) forFreelancer.push('Proiect de start, potrivit pentru primele colaborări');
  if (calc.components.budget === 1) forFreelancer.push('Bugetul acoperă tariful tău');
  return { forClient, forFreelancer, components: calc.components, exploration: !!exploration, stretch: f.level === 'BEGINNER' && !p.isStarter, warnings: [] };
}
function matchDto(state, side) {
  const p = PR(state.projectId), f = FP(state.freelancerId);
  const calc = scorePair(p, f);
  const exploration = tierOf(f.completedCount) === 'START' && computeFor(p).some((x) => x.f.id === f.id && x.exploration);
  const conv = db.conversations.find((c) => c.matchId === state.id);
  return { id: state.id, projectId: p.id, freelancerId: f.id, score: calc.score, status: state.status, reasons: reasonsFor(p, f, calc, exploration), createdAt: state.createdAt, conversationId: conv?.id || null,
    engagementId: db.engagements.find((e) => e.matchId === state.id)?.id || null,
    project: { id: p.id, title: p.title, description: p.description, budgetMin: p.budgetMin ?? null, budgetMax: p.budgetMax ?? null, deadline: p.deadline, isStarter: !!p.isStarter, category: catById(p.categoryId), skills: nameList(p.skillIds).map((name, i) => ({ id: p.skillIds[i], name })), client: { name: U(p.clientId).name, avatarUrl: U(p.clientId).avatarUrl } },
    freelancer: freelancerDto(f), side };
}
const analysisFor = (p) => {
  const short = p.description.length < 80;
  return { source: 'llm', needsInfo: short, assumptions: [`Categoria: ${catById(p.categoryId)?.name || '—'}`, p.budgetMax ? `Buget până la ${p.budgetMax}` : 'Buget deschis'],
    questions: short ? ['Ce rezultat final aștepți (ex. număr de pagini, tipuri de materiale)?', 'Ai exemple de stil care îți plac?'] : [] };
};

/* ---------- notificări / conversații ---------- */
function notify(userId, type, title, body, link) { db.notifications.unshift({ id: uid('n'), userId, type, data: { title, body, link }, isRead: false, createdAt: nowIso() }); }
function ensureConversation(match, clientUserId, freelancerUserId) {
  let c = db.conversations.find((x) => x.matchId === match.id);
  if (!c) { c = { id: uid('cv'), projectId: match.projectId, matchId: match.id, userIds: [clientUserId, freelancerUserId], messages: [], reads: {}, updatedAt: nowIso() }; db.conversations.push(c); }
  return c;
}
const convDto = (c, me) => {
  const otherId = c.userIds.find((i) => i !== me.id), o = U(otherId), last = c.messages[c.messages.length - 1];
  const readAt = c.reads[me.id] || 0;
  const project = PR(c.projectId);
  const engagement = db.engagements.find((e) => e.matchId === c.matchId);
  const match = db.matchStates.find((m) => m.id === c.matchId);
  return { id: c.id, projectId: c.projectId, project: { id: c.projectId, title: project?.title }, matchId: c.matchId, engagementId: engagement?.id || null,
    clientId: project?.clientId, freelancerId: c.userIds.find((id) => id !== project?.clientId), engagementStatus: engagement?.status ?? null, matchStatus: match?.status ?? null,
    other: { id: o.id, name: o.name, avatarUrl: o.avatarUrl, role: o.role, profileId: FPofUser(o.id)?.id || null }, lastMessage: last ? { content: last.content, createdAt: last.createdAt, senderId: last.senderId } : null,
    unreadCount: c.messages.filter((m) => m.senderId !== me.id && new Date(m.createdAt).getTime() > readAt).length, updatedAt: c.updatedAt };
};

const engDto = (e) => {
  const p = PR(e.projectId), f = FP(e.freelancerId), c = U(p.clientId);
  const conv = db.conversations.find((x) => x.matchId === e.matchId);
  return { id: e.id, matchId: e.matchId, agreedPrice: e.agreedPrice, deadline: e.deadline || null, status: e.status, usedAi: e.usedAi ?? null, createdAt: e.createdAt, completedAt: e.completedAt || null,
    project: { id: p.id, title: p.title }, client: { userId: c.id, name: c.name, avatarUrl: c.avatarUrl }, freelancer: { userId: f.userId, profileId: f.id, name: U(f.userId).name, avatarUrl: U(f.userId).avatarUrl, title: f.title },
    reviews: e.reviews || [], conversationId: conv?.id || null };
};

const paginate = (arr, q) => { const page = Math.max(1, +q.page || 1), limit = Math.min(100, +q.limit || 20); return { data: arr.slice((page - 1) * limit, page * limit), page, limit, total: arr.length }; };
const csv = (v) => (v ? String(v).split(',').filter(Boolean) : []);
const need = (me, ...roles) => { if (!me) throw new HttpError(401, 'Neautentificat.', null, 'UNAUTHORIZED'); if (roles.length && !roles.includes(me.role)) throw forbidden(); return me; };
const strip = (o) => o;

/* ---------- rute ---------- */
const routes = [];
const r = (method, path, fn) => routes.push([method, new RegExp(`^${path.replace(/:(\w+)/g, '(?<$1>[^/]+)')}$`), fn]);

// auth
r('POST', '/auth/register', ({ body }) => {
  const errs = {};
  if (!body.name || body.name.trim().length < 2) errs.name = 'Introdu numele tău.';
  if (!/^\S+@\S+\.\S+$/.test(body.email || '')) errs.email = 'Email invalid.';
  if (!body.password || body.password.length < 8) errs.password = 'Minim 8 caractere.';
  if (!['CLIENT', 'FREELANCER'].includes(body.role)) errs.role = 'Alege rolul.';
  if (Object.keys(errs).length) throw bad('Datele introduse nu sunt valide.', errs);
  if (db.users.some((u) => u.email.toLowerCase() === body.email.toLowerCase())) throw new HttpError(409, 'Există deja un cont cu acest email.', { email: 'Email deja folosit.' }, 'EMAIL_TAKEN');
  const u = { id: uid('u'), name: body.name.trim(), email: body.email.trim(), role: body.role, password: body.password, avatarUrl: '', isBlocked: false, createdAt: nowIso() };
  db.users.push(u);
  mockRefreshToken = `mockr.${u.id}`;
  return [201, { user: userDto(u), accessToken: `mock.${u.id}`, refreshToken: `mockr.${u.id}` }];
});
r('POST', '/auth/login', ({ body }) => {
  const u = db.users.find((x) => x.email.toLowerCase() === (body.email || '').toLowerCase());
  if (!u || u.password !== body.password) throw new HttpError(401, 'Email sau parolă incorectă.', null, 'INVALID_CREDENTIALS');
  if (u.isBlocked) throw forbidden('Contul a fost blocat. Scrie-ne dacă crezi că e o greșeală.');
  mockRefreshToken = `mockr.${u.id}`;
  return { user: userDto(u), accessToken: `mock.${u.id}`, refreshToken: `mockr.${u.id}` };
});
r('POST', '/auth/refresh', ({ body }) => {
  const token = body.refreshToken || mockRefreshToken;
  const id = (token || '').replace('mockr.', ''); const u = U(id);
  if (!u || u.isBlocked) throw new HttpError(401, 'Sesiune invalidă.', null, 'INVALID_TOKEN');
  mockRefreshToken = `mockr.${u.id}`;
  return { accessToken: `mock.${u.id}`, refreshToken: mockRefreshToken };
});
r('POST', '/auth/logout', () => { mockRefreshToken = null; return { ok: true }; });
r('POST', '/auth/oauth/google/challenge', () => ({ nonce: 'mock-google-nonce' }));
r('GET', '/auth/me', ({ me }) => ({ user: { ...userDto(need(me)), freelancerProfile: FPofUser(me.id) ? freelancerDto(FPofUser(me.id), true) : undefined, clientProfile: CP(me.id) } }));
r('POST', '/auth/change-password', ({ me, body }) => { need(me); if (me.password !== body.oldPassword) throw bad('Parola curentă este incorectă.', { oldPassword: 'Parola curentă este incorectă.' }); me.password = body.newPassword; return { ok: true }; });
r('POST', '/auth/forgot-password', () => ({ ok: true }));
r('POST', '/auth/reset-password', ({ body }) => { if (!body.token) throw bad('Link invalid sau expirat.'); return { ok: true }; });
r('PATCH', '/users/me', ({ me, body }) => {
  need(me);
  if (body.email && db.users.some((u) => u.id !== me.id && u.email.toLowerCase() === body.email.toLowerCase())) throw new HttpError(409, 'Emailul este deja folosit.', { email: 'Email deja folosit.' });
  if (body.role) {
    if (!['CLIENT', 'FREELANCER'].includes(body.role) || me.role === 'ADMIN') throw forbidden();
    me.role = body.role;
    if (me.role === 'FREELANCER' && !FPofUser(me.id)) db.freelancers.push({ id: uid('f'), userId: me.id, title: '', bio: '', level: 'BEGINNER', availability: 'AVAILABLE', languages: [], skillIds: [], portfolio: [], onboarded: false, completedCount: 0, createdAt: nowIso() });
  }
  ['name', 'email', 'avatarUrl', 'dashboardBackgroundUrl'].forEach((k) => { if (body[k] !== undefined) me[k] = body[k]; });
  return { user: userDto(me) };
});
r('DELETE', '/users/me', ({ me, body }) => {
  need(me); if (me.password !== body?.password) throw bad('Parola este incorectă.', { password: 'Parola este incorectă.' });
  db.users = db.users.filter((u) => u.id !== me.id); db.freelancers = db.freelancers.filter((f) => f.userId !== me.id); db.projects = db.projects.filter((p) => p.clientId !== me.id);
  return [204, null];
});

// catalog
r('GET', '/categories', () => db.categories);
r('GET', '/skills', ({ query }) => db.skills.filter((s) => (!query.categoryId || s.categoryId === query.categoryId) && (!query.q || s.name.toLowerCase().includes(String(query.q).toLowerCase()))));

// freelancers
r('GET', '/freelancers', ({ query }) => {
  const q = (query.q || '').toLowerCase(), skillIds = csv(query.skillIds);
  let list = db.freelancers.filter((f) => f.onboarded && U(f.userId) && !U(f.userId).isBlocked);
  if (q) list = list.filter((f) => `${U(f.userId).name} ${f.title} ${nameList(f.skillIds).join(' ')}`.toLowerCase().includes(q));
  if (query.categoryId) list = list.filter((f) => f.skillIds.some((s) => skillById(s)?.categoryId === query.categoryId));
  if (skillIds.length) list = list.filter((f) => skillIds.every((s) => f.skillIds.includes(s)));
  if (query.minRate) list = list.filter((f) => (f.hourlyRate ?? 0) >= +query.minRate);
  if (query.maxRate) list = list.filter((f) => (f.hourlyRate ?? 0) <= +query.maxRate);
  if (query.availability) list = list.filter((f) => f.availability === query.availability);
  // fără sortare după popularitate: ordine rotită zilnic (README, echitate)
  const day = Math.floor(Date.now() / 86400000);
  list = [...list].sort((a, b) => ((a.id.length * 7 + day) % 5) - ((b.id.length * 7 + day) % 5) || a.id.localeCompare(b.id));
  const p = paginate(list, query); return { ...p, data: p.data.map((f) => freelancerDto(f)) };
});
r('GET', '/freelancers/me', ({ me }) => { need(me, 'FREELANCER'); const f = FPofUser(me.id); if (!f) throw notFound('Profilul nu există încă.'); return freelancerDto(f, true); });
r('PUT', '/freelancers/me', ({ me, body }) => {
  need(me, 'FREELANCER');
  const errs = {};
  if (!body.title || body.title.trim().length < 3) errs.title = 'Scrie un titlu de cel puțin 3 caractere.';
  if (!Array.isArray(body.skillIds) || !body.skillIds.length) errs.skillIds = 'Alege cel puțin o abilitate.';
  if (Object.keys(errs).length) throw bad('Datele introduse nu sunt valide.', errs);
  let f = FPofUser(me.id);
  if (!f) { f = { id: uid('f'), userId: me.id, portfolio: [], completedCount: 0, createdAt: nowIso() }; db.freelancers.push(f); }
  Object.assign(f, { title: body.title, bio: body.bio ?? f.bio, level: body.level || 'BEGINNER', hourlyRate: body.hourlyRate ?? null, availability: body.availability || 'AVAILABLE', languages: body.languages || [], skillIds: body.skillIds, onboarded: true });
  return freelancerDto(f, true);
});
r('GET', '/freelancers/me/tier', ({ me }) => {
  need(me, 'FREELANCER'); const f = FPofUser(me.id); const n = f?.completedCount || 0; const steps = [['START', 0], ['VERIFIED', 1], ['PROVEN', 3], ['EXPERT', 10]];
  const idx = steps.findLastIndex(([, at]) => n >= at); const next = steps[idx + 1];
  return { tier: steps[idx][0], completed: n, nextTier: next?.[0] || null, nextAt: next?.[1] || null };
});
r('GET', '/freelancers/me/exposure', ({ me }) => { need(me, 'FREELANCER'); const f = FPofUser(me.id); const st = db.matchStates.filter((m) => m.freelancerId === f?.id); return { impressions7d: db.exposure[f?.id] || 0, interests7d: st.filter((s) => s.status === 'FREELANCER_INTERESTED' || s.status === 'ACCEPTED').length, invites7d: st.filter((s) => s.status === 'CLIENT_INVITED' || s.status === 'ACCEPTED').length }; });
r('POST', '/freelancers/me/portfolio', ({ me, body }) => {
  need(me, 'FREELANCER'); const f = FPofUser(me.id); if (!f) throw notFound();
  if (!body.title || body.title.length < 3) throw bad('Datele introduse nu sunt valide.', { title: 'Scrie un titlu.' });
  const item = { id: uid('pf'), title: body.title, description: body.description || '', imageUrl: body.imageUrl || '', link: body.link || '' }; f.portfolio.push(item); return [201, item];
});
r('PATCH', '/freelancers/me/portfolio/:id', ({ me, params, body }) => { const f = FPofUser(me.id); const it = f?.portfolio.find((x) => x.id === params.id); if (!it) throw notFound(); Object.assign(it, body); return it; });
r('DELETE', '/freelancers/me/portfolio/:id', ({ me, params }) => { const f = FPofUser(me.id); if (!f) throw notFound(); f.portfolio = f.portfolio.filter((x) => x.id !== params.id); return [204, null]; });
r('GET', '/freelancers/:id/reviews', ({ params, query }) => { const f = FP(params.id); if (!f) throw notFound(); return paginate(reviewsOf(f), query); });
r('GET', '/freelancers/:id', ({ params }) => { const f = FP(params.id); if (!f || !f.onboarded) throw notFound('Profilul nu există sau nu mai este public.'); return freelancerDto(f, true); });

// clients
r('GET', '/clients/me', ({ me }) => { need(me, 'CLIENT'); const c = CP(me.id); if (!c) throw notFound('Profilul nu există încă.'); return c; });
r('PUT', '/clients/me', ({ me, body }) => {
  need(me, 'CLIENT'); if (body.type === 'COMPANY' && !body.companyName) throw bad('Datele introduse nu sunt valide.', { companyName: 'Introdu numele firmei.' });
  const c = CP(me.id); if (c) Object.assign(c, body); else db.clientProfiles.push({ userId: me.id, ...body }); return CP(me.id);
});

// projects
r('GET', '/projects', ({ me, query }) => {
  const q = (query.q || '').toLowerCase(), skillIds = csv(query.skillIds);
  let list = db.projects.filter((p) => (!query.status || p.status === query.status));
  if (q) list = list.filter((p) => `${p.title} ${p.description}`.toLowerCase().includes(q));
  if (query.categoryId) list = list.filter((p) => p.categoryId === query.categoryId);
  if (skillIds.length) list = list.filter((p) => skillIds.some((s) => p.skillIds.includes(s)));
  if (query.minBudget) list = list.filter((p) => (p.budgetMax ?? Infinity) >= +query.minBudget);
  if (query.maxBudget) list = list.filter((p) => (p.budgetMin ?? 0) <= +query.maxBudget);
  list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const p = paginate(list, query); return { ...p, data: p.data.map((x) => projectDto(x, me)) };
});
r('GET', '/projects/me', ({ me }) => { need(me, 'CLIENT'); return db.projects.filter((p) => p.clientId === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((p) => projectDto(p, me)); });
r('POST', '/projects', ({ me, body }) => {
  need(me, 'CLIENT');
  const errs = {};
  if (!body.description || body.description.trim().length < 30) errs.description = 'Descrie proiectul în cel puțin 30 de caractere.';
  if (!body.categoryId || !catById(body.categoryId)) errs.categoryId = 'Alege o categorie.';
  if (Object.keys(errs).length) throw bad('Datele introduse nu sunt valide.', errs);
  const p = { id: uid('p'), clientId: me.id, status: 'OPEN', isStarter: (body.budgetMax ?? 999) <= 200, skillIds: body.skillIds || [], createdAt: nowIso(), matchedAt: nowIso(), ...body, title: body.title?.trim() || body.description.trim().slice(0, 60) };
  db.projects.push(p); return [201, projectDto(p, me)];
});
r('GET', '/projects/:id/matches', ({ me, params }) => {
  need(me); const p = PR(params.id); if (!p) throw notFound(); if (p.clientId !== me.id && me.role !== 'ADMIN') throw forbidden();
  const st = matchingStatus(p);
  const data = st === 'DONE' ? computeFor(p).map((x) => getState(p.id, x.f.id)).filter((s) => s.status !== 'DISMISSED').map((s) => matchDto(s, 'CLIENT')) : [];
  return { status: st, data, analysis: analysisFor(p) };
});
r('GET', '/projects/:id', ({ me, params }) => { const p = PR(params.id); if (!p) throw notFound('Proiectul nu există sau a fost șters.'); return projectDto(p, me); });
r('PATCH', '/projects/:id', ({ me, params, body }) => {
  need(me); const p = PR(params.id); if (!p) throw notFound(); if (p.clientId !== me.id) throw forbidden('Doar proprietarul poate modifica proiectul.');
  if (body.description !== undefined && body.description.trim().length < 30) throw bad('Datele introduse nu sunt valide.', { description: 'Descrie proiectul în cel puțin 30 de caractere.' });
  const retrigger = ['description', 'categoryId', 'budgetMin', 'budgetMax', 'skillIds'].some((k) => body[k] !== undefined);
  Object.assign(p, body); if (retrigger) p.matchedAt = nowIso(); return projectDto(p, me);
});
r('DELETE', '/projects/:id', ({ me, params }) => { need(me); const p = PR(params.id); if (!p) throw notFound(); if (p.clientId !== me.id) throw forbidden(); db.projects = db.projects.filter((x) => x.id !== p.id); return [204, null]; });

// matches
r('GET', '/matches/me', ({ me, query }) => {
  need(me, 'CLIENT', 'FREELANCER');
  const statuses = { new: 'SUGGESTED', invited: 'CLIENT_INVITED' };
  const wanted = statuses[query.status] ?? query.status;
  let items;
  if (me.role === 'FREELANCER') {
    const f = FPofUser(me.id); if (!f?.onboarded) return paginate([], query);
    items = wanted === 'CLIENT_INVITED'
      ? db.matchStates.filter((s) => s.freelancerId === f.id && PR(s.projectId)?.status === 'OPEN')
      : db.projects.filter((p) => p.status === 'OPEN' && p.clientId !== me.id).map((p) => ({ p, ...scorePair(p, f) })).filter((x) => x.hit.length).sort((a, b) => b.score - a.score).slice(0, 12).map((x) => getState(x.p.id, f.id));
  } else {
    const mine = db.projects.filter((p) => p.clientId === me.id && (!query.projectId || p.id === query.projectId) && matchingStatus(p) === 'DONE');
    items = mine.flatMap((p) => computeFor(p).map((x) => getState(p.id, x.f.id)));
  }
  items = items.filter((s) => (wanted ? s.status === wanted : s.status !== 'DISMISSED'));
  const pg = paginate(items, query); return { ...pg, data: pg.data.map((s) => matchDto(s, me.role)) };
});
r('POST', '/matches/impressions', ({ me, body }) => { need(me, 'CLIENT'); (body.matchIds || []).forEach((id) => { const s = db.matchStates.find((m) => m.id === id); if (s) db.exposure[s.freelancerId] = (db.exposure[s.freelancerId] || 0) + 1; }); return [204, null]; });
r('POST', '/matches/refresh', ({ me, body }) => {
  need(me, 'CLIENT', 'FREELANCER'); const p = PR(body.projectId); if (!p || p.clientId !== me.id) throw forbidden();
  if (p.lastRefresh && Date.now() - p.lastRefresh < 20000) throw new HttpError(429, 'Ai cerut recalcularea de curând. Încearcă din nou peste puțin timp.', null, 'RATE_LIMITED');
  p.lastRefresh = Date.now(); p.matchedAt = nowIso(); return [202, { ok: true }];
});
r('POST', '/matches/invite', ({ me, body }) => {
  need(me, 'CLIENT'); const p = PR(body.projectId), f = FP(body.freelancerId); if (!p || !f || p.clientId !== me.id) throw forbidden();
  const s = getState(p.id, f.id); return inviteFlow(s, p, f, me);
});
function inviteFlow(s, p, f, me) {
  if (s.status === 'DISMISSED') throw new HttpError(409, 'Recomandarea a fost ascunsă.', null, 'CONFLICT');
  if (s.status === 'FREELANCER_INTERESTED') s.status = 'ACCEPTED'; else if (s.status === 'SUGGESTED') s.status = 'CLIENT_INVITED';
  const c = ensureConversation(s, me.id, f.userId);
  if (!c.messages.length) notify(f.userId, 'INVITED', 'Ai primit o invitație', `${me.name} te-a invitat la „${p.title}".`, `/messages?c=${c.id}`);
  return { match: matchDto(s, 'CLIENT'), conversationId: c.id };
}
r('POST', '/matches/:id/invite', ({ me, params }) => { need(me, 'CLIENT'); const s = db.matchStates.find((m) => m.id === params.id); if (!s) throw notFound(); const p = PR(s.projectId); if (p.clientId !== me.id) throw forbidden(); return inviteFlow(s, p, FP(s.freelancerId), me); });
r('POST', '/matches/:id/interest', ({ me, params }) => {
  need(me, 'FREELANCER'); const s = db.matchStates.find((m) => m.id === params.id); const f = FPofUser(me.id); if (!s || s.freelancerId !== f?.id) throw notFound();
  if (s.status === 'DISMISSED') throw new HttpError(409, 'Recomandarea a fost ascunsă.', null, 'CONFLICT');
  if (s.status === 'CLIENT_INVITED') s.status = 'ACCEPTED'; else if (s.status === 'SUGGESTED') s.status = 'FREELANCER_INTERESTED';
  const p = PR(s.projectId); const c = ensureConversation(s, p.clientId, me.id);
  notify(p.clientId, 'FREELANCER_INTERESTED', 'Un freelancer este interesat', `${me.name} vrea să lucreze la „${p.title}".`, `/messages?c=${c.id}`);
  return { match: matchDto(s, 'FREELANCER'), conversationId: c.id };
});
r('POST', '/matches/:id/dismiss', ({ me, params }) => { need(me); const s = db.matchStates.find((m) => m.id === params.id); if (!s) throw notFound(); if (s.status !== 'SUGGESTED') throw new HttpError(409, 'Poți ascunde doar recomandări noi.', null, 'CONFLICT'); s.status = 'DISMISSED'; return { ok: true }; });

// engagements
r('POST', '/engagements', ({ me, body }) => {
  need(me, 'CLIENT'); const s = db.matchStates.find((m) => m.id === body.matchId); if (!s) throw notFound();
  const p = PR(s.projectId); if (p.clientId !== me.id) throw forbidden();
  if (!['CLIENT_INVITED', 'ACCEPTED', 'FREELANCER_INTERESTED'].includes(s.status)) throw new HttpError(409, 'Colaborarea se poate crea doar după invitație sau interes.', null, 'CONFLICT');
  if (db.engagements.some((e) => e.matchId === s.id && e.status !== 'CANCELLED')) throw new HttpError(409, 'Există deja o colaborare pentru această potrivire.', null, 'CONFLICT');
  if (!(body.agreedPrice > 0)) throw bad('Datele introduse nu sunt valide.', { agreedPrice: 'Prețul trebuie să fie pozitiv.' });
  s.status = 'ACCEPTED'; p.status = 'IN_PROGRESS';
  const e = { id: uid('e'), matchId: s.id, projectId: p.id, freelancerId: s.freelancerId, agreedPrice: body.agreedPrice, deadline: body.deadline || null, status: 'IN_PROGRESS', reviews: [], createdAt: nowIso() };
  db.engagements.push(e); notify(FP(s.freelancerId).userId, 'ENGAGEMENT_STARTED', 'Colaborare începută', `Ai o colaborare nouă la „${p.title}".`, `/engagements/${e.id}`); return [201, engDto(e)];
});
const myEng = (me) => db.engagements.filter((e) => PR(e.projectId)?.clientId === me.id || FP(e.freelancerId)?.userId === me.id);
r('GET', '/engagements/me', ({ me, query }) => { need(me); return myEng(me).filter((e) => !query.status || e.status === query.status).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(engDto); });
r('GET', '/engagements/:id', ({ me, params }) => { need(me); const e = myEng(me).find((x) => x.id === params.id); if (!e) throw notFound('Colaborarea nu există sau nu ai acces.'); return engDto(e); });
r('PATCH', '/engagements/:id/status', ({ me, params, body }) => {
  need(me); const e = myEng(me).find((x) => x.id === params.id); if (!e) throw notFound(); const p = PR(e.projectId), f = FP(e.freelancerId);
  const isClient = p.clientId === me.id, to = body.status;
  const ok = (to === 'DELIVERED' && !isClient && e.status === 'IN_PROGRESS') || (to === 'COMPLETED' && isClient && e.status === 'DELIVERED') || (to === 'CANCELLED' && ['IN_PROGRESS', 'DELIVERED'].includes(e.status));
  if (!ok) throw new HttpError(409, 'Această schimbare de stare nu este permisă.', null, 'CONFLICT');
  if (to === 'DELIVERED' && e.usedAi == null) throw bad('Înainte de livrare, declară dacă ai folosit AI.', { usedAi: 'Declarația este obligatorie.' });
  e.status = to; const other = isClient ? f.userId : p.clientId;
  if (to === 'COMPLETED') { e.completedAt = nowIso(); f.completedCount += 1; p.status = 'COMPLETED'; }
  if (to === 'CANCELLED') p.status = 'OPEN';
  notify(other, `ENGAGEMENT_${to}`, { DELIVERED: 'Lucrarea a fost livrată', COMPLETED: 'Colaborarea a fost finalizată', CANCELLED: 'Colaborarea a fost anulată' }[to], `„${p.title}"`, `/engagements/${e.id}`);
  return engDto(e);
});
r('PATCH', '/engagements/:id/ai-disclosure', ({ me, params, body }) => { need(me, 'FREELANCER'); const e = myEng(me).find((x) => x.id === params.id); if (!e) throw notFound(); e.usedAi = !!body.usedAi; return engDto(e); });
r('POST', '/engagements/:id/reviews', ({ me, params, body }) => {
  need(me); const e = myEng(me).find((x) => x.id === params.id); if (!e) throw notFound(); if (e.status !== 'COMPLETED') throw new HttpError(409, 'Recenziile se pot lăsa doar după finalizare.', null, 'CONFLICT');
  if (e.reviews.some((x) => x.authorId === me.id)) throw new HttpError(409, 'Ai lăsat deja o recenzie.', null, 'CONFLICT');
  if (!(body.rating >= 1 && body.rating <= 5)) throw bad('Datele introduse nu sunt valide.', { rating: 'Alege o notă.' });
  const p = PR(e.projectId), f = FP(e.freelancerId); const target = p.clientId === me.id ? f.userId : p.clientId;
  const rv = { id: uid('r'), authorId: me.id, targetUserId: target, rating: body.rating, comment: body.comment || '', createdAt: nowIso() }; e.reviews.push(rv);
  notify(target, 'REVIEW_RECEIVED', 'Ai primit o recenzie', `${body.rating}/5 pentru „${p.title}"`, `/engagements/${e.id}`); return [201, rv];
});

// conversations
const myConvs = (me) => db.conversations.filter((c) => c.userIds.includes(me.id));
r('GET', '/conversations', ({ me }) => { need(me); return myConvs(me).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((c) => convDto(c, me)); });
r('POST', '/conversations', ({ me, body }) => { need(me); const c = myConvs(me).find((x) => x.projectId === body.projectId && x.userIds.includes(body.otherUserId)); if (!c) throw forbidden('Conversația se poate porni doar după interes sau invitație.'); return convDto(c, me); });
r('GET', '/conversations/:id/messages', ({ me, params }) => { need(me); const c = myConvs(me).find((x) => x.id === params.id); if (!c) throw notFound(); return c.messages; });
r('POST', '/conversations/:id/messages', ({ me, params, body }) => {
  need(me); const c = myConvs(me).find((x) => x.id === params.id); if (!c) throw notFound();
  const content = (body.content || '').trim(); if (!content) throw bad('Scrie un mesaj.'); if (content.length > 4000) throw bad('Mesajul este prea lung.');
  const m = { id: uid('msg'), conversationId: c.id, senderId: me.id, content, createdAt: nowIso() }; c.messages.push(m); c.updatedAt = m.createdAt; c.reads[me.id] = Date.now();
  notify(c.userIds.find((i) => i !== me.id), 'NEW_MESSAGE', `Mesaj nou de la ${me.name}`, content.slice(0, 80), `/messages?c=${c.id}`); return [201, m];
});
r('PATCH', '/conversations/:id/read', ({ me, params }) => { need(me); const c = myConvs(me).find((x) => x.id === params.id); if (!c) throw notFound(); c.reads[me.id] = Date.now() + 1; return { ok: true }; });

// notifications
r('GET', '/notifications', ({ me, query }) => { need(me); let l = db.notifications.filter((n) => n.userId === me.id); if (query.unread === 'true' || query.unread === true) l = l.filter((n) => !n.isRead); return paginate(l.map(({ userId, ...n }) => n), query); });
r('PATCH', '/notifications/read-all', ({ me }) => { need(me); db.notifications.forEach((n) => { if (n.userId === me.id) n.isRead = true; }); return { ok: true }; });
r('PATCH', '/notifications/:id/read', ({ me, params }) => { need(me); const n = db.notifications.find((x) => x.id === params.id && x.userId === me.id); if (!n) throw notFound(); n.isRead = true; return { ok: true }; });

// reports + uploads
r('POST', '/reports', ({ me, body }) => {
  need(me); if (!['USER', 'PROJECT', 'MESSAGE'].includes(body.targetType)) throw bad('Tip de raportare invalid.'); if (!body.reason || body.reason.length < 10) throw bad('Datele introduse nu sunt valide.', { reason: 'Descrie problema în cel puțin 10 caractere.' });
  db.reports.unshift({ id: uid('rp'), reporterId: me.id, targetType: body.targetType, targetId: body.targetId, reason: body.reason, status: 'OPEN', createdAt: nowIso() }); return [201, { ok: true }];
});
r('POST', '/uploads', async ({ me, body }) => {
  need(me); const file = body?.get?.('file'); if (!file) throw bad('Nu am primit niciun fișier.');
  const url = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => res(''); fr.readAsDataURL(file); });
  return [201, { url }];
});

// admin
r('GET', '/admin/stats', ({ me }) => { need(me, 'ADMIN'); const by = (arr, k) => arr.reduce((o, x) => ({ ...o, [x[k]]: (o[x[k]] || 0) + 1 }), {}); return { totals: { users: db.users.length, projects: db.projects.length, reports: db.reports.length, engagements: db.engagements.length }, usersByRole: by(db.users, 'role'), projectsByStatus: by(db.projects, 'status'), reportsByStatus: by(db.reports, 'status') }; });
r('GET', '/admin/users', ({ me, query }) => { need(me, 'ADMIN'); const q = (query.search || '').toLowerCase(); return paginate(db.users.filter((u) => (!q || `${u.name} ${u.email}`.toLowerCase().includes(q)) && (!query.role || u.role === query.role) && (!query.blocked || String(!!u.isBlocked) === query.blocked)).map(userDto), query); });
r('PATCH', '/admin/users/:id', ({ me, params, body }) => { need(me, 'ADMIN'); const u = U(params.id); if (!u) throw notFound(); if (u.id === me.id) throw forbidden('Nu îți poți modifica propriul cont de aici.'); if (body.isBlocked !== undefined) u.isBlocked = !!body.isBlocked; if (body.role) u.role = body.role; return { data: userDto(u) }; });
r('GET', '/admin/projects', ({ me, query }) => { need(me, 'ADMIN'); const q = (query.search || '').toLowerCase(); return paginate(db.projects.filter((p) => (!q || `${p.title} ${p.description || ''}`.toLowerCase().includes(q)) && (!query.status || p.status === query.status)).map((p) => projectDto(p, me)), query); });
r('PATCH', '/admin/projects/:id', ({ me, params, body }) => { need(me, 'ADMIN'); const p = db.projects.find((x) => x.id === params.id); if (!p) throw notFound(); if (body.status) p.status = body.status; return { data: projectDto(p, me) }; });
r('DELETE', '/admin/projects/:id', ({ me, params }) => { need(me, 'ADMIN'); db.projects = db.projects.filter((p) => p.id !== params.id); return [204, null]; });
r('GET', '/admin/reports', ({ me, query }) => { need(me, 'ADMIN'); return paginate(db.reports.filter((x) => !query.status || (x.status || 'OPEN') === query.status).map((x) => ({ ...x, status: x.status || 'OPEN', reporter: { name: U(x.reporterId)?.name || '—' }, target: { id: x.targetId, exists: true, label: x.targetType === 'USER' ? (U(x.targetId)?.name || x.targetId) : (db.projects.find((p) => p.id === x.targetId)?.title || x.targetId) } })), query); });
r('PATCH', '/admin/reports/:id', ({ me, params, body }) => { need(me, 'ADMIN'); const x = db.reports.find((q) => q.id === params.id); if (!x) throw notFound(); x.status = body.status; x.resolution = body.resolution || null; return { data: x }; });

export async function handle(config) {
  const method = (config.method || 'get').toUpperCase();
  const path = (config.url || '').split('?')[0];
  const auth = config.headers?.Authorization || config.headers?.get?.('Authorization') || '';
  const me = auth.startsWith('Bearer mock.') ? U(auth.slice(12)) : null;
  let body = config.data;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const query = { ...(config.params || {}) };
  for (const [m, re, fn] of routes) {
    if (m !== method) continue;
    const match = re.exec(path); if (!match) continue;
    if (me?.isBlocked) throw new HttpError(403, 'Contul a fost blocat.');
    const out = await fn({ me, params: match.groups || {}, query, body: body ?? {} });
    save();
    return Array.isArray(out) && typeof out[0] === 'number' ? { status: out[0], data: out[1] } : { status: 200, data: strip(out) };
  }
  throw notFound('Ruta nu există în serverul simulat.');
}
