import { describe, expect, it, beforeAll } from 'vitest';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from '../App.jsx';
import api from '../services/api.js';
import { installMock } from '../mocks/index.js';
import { queryClient } from '../lib/queryClient.js';
import { ToastProvider } from '../components/feedback/Toast.jsx';
import { SessionProvider } from '../lib/session.jsx';
import { ChatProvider } from '../lib/chat.jsx';
import { useAuth } from '../store/authStore.js';
import * as S from '../services/index.js';

beforeAll(() => installMock(api));

async function show(route) {
  const utils = render(
    <QueryClientProvider client={queryClient}><MemoryRouter initialEntries={[route]}><ToastProvider><SessionProvider><ChatProvider><App /></ChatProvider></SessionProvider></ToastProvider></MemoryRouter></QueryClientProvider>,
  );
  await waitFor(() => expect(utils.container.querySelector('h1, h2')).toBeTruthy(), { timeout: 6000 });
  await waitFor(() => expect(utils.container.querySelector('.fm-skeleton, [aria-label="Se încarcă"]')).toBeNull(), { timeout: 8000 });
  await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
  return utils;
}
const failed = (c) => c.textContent.includes('Nu am putut încărca datele');

const as = async (email, password = 'demo1234') => { useAuth.getState().clear(); await act(async () => { await useAuth.getState().login({ email, password }); }); };

describe('vizitator', () => {
  beforeAll(() => { useAuth.getState().clear(); }); // în aplicație, bootstrap() face această trecere la pornire
  for (const r of ['/', '/login', '/register', '/forgot-password', '/how-it-works', '/terms', '/privacy', '/contact', '/browse', '/browse?tab=projects', '/freelancers/f_ana', '/projects/p_1', '/nu-exista']) {
    it(`randează ${r}`, async () => { const u = await show(r); expect(failed(u.container)).toBe(false); cleanup(); });
  }
  it('rutele private duc la login', async () => { const u = await show('/dashboard'); expect(u.container.textContent).toContain('Bine ai revenit'); cleanup(); });
  it('înregistrarea cere alegerea rolului', async () => {
    const u = await show('/register');
    expect(u.container.textContent).toContain('Client');
    expect(u.container.textContent).toContain('Freelancer');
    expect(u.container.textContent).toContain('Continuă cu Google');
    cleanup();
  });
  it('pagina de login nu mai are modul demonstrativ', async () => { const u = await show('/login'); expect(u.container.textContent).not.toContain('Mod demonstrativ'); cleanup(); });
});

describe('client', () => {
  beforeAll(async () => { await as('client@demo.md'); });
  for (const r of ['/dashboard', '/recommendations', '/recommendations?projectId=p_1', '/projects', '/projects/archive', '/projects/new', '/projects/p_1/edit', '/projects/p_1', '/browse', '/freelancers/f_maria', '/engagements', '/messages', '/notifications', '/settings', '/profile/edit']) {
    it(`randează ${r}`, async () => { const u = await show(r); expect(failed(u.container)).toBe(false); cleanup(); });
  }
  it('nu vede comutatorul de mod în bara laterală', async () => { const u = await show('/dashboard'); expect(u.container.textContent).not.toMatch(/Mod:|Comută pe/); cleanup(); });
  it('nu poate intra în zona de freelancer sau admin', async () => { const u = await show('/admin'); expect(u.container.textContent).not.toContain('Moderare și statistici'); cleanup(); });
  it('setările conțin schimbarea tipului de cont', async () => { const u = await show('/settings?section=account'); expect(u.container.textContent).toContain('freelancer'); cleanup(); });
});

describe('freelancer', () => {
  beforeAll(async () => { await as('freelancer@demo.md'); });
  for (const r of ['/dashboard', '/recommendations', '/recommendations?tab=invited', '/browse', '/projects/p_1', '/profile/edit', '/messages', '/engagements', '/notifications', '/settings']) {
    it(`randează ${r}`, async () => { const u = await show(r); expect(failed(u.container)).toBe(false); cleanup(); });
  }
  it('are potriviri reale pe dashboard', async () => { const u = await show('/recommendations'); expect(u.container.textContent).toMatch(/Sunt interesat|Nimic nou/); cleanup(); });
  it('nu poate deschide formularul de proiecte', async () => { const u = await show('/projects/new'); expect(u.container.textContent).not.toContain('Postează și vezi potrivirile'); expect(u.container.textContent).toContain('Dashboard'); cleanup(); });
});

describe('admin', () => {
  beforeAll(async () => { await as('admin@demo.md'); });
  it('randează /admin', async () => { const u = await show('/admin'); expect(failed(u.container)).toBe(false); expect(u.container.textContent).toContain('Utilizatori'); cleanup(); });
});

describe('flux complet prin servicii (contractul din README)', () => {
  it('înregistrare → profil → proiect → potriviri → invitație → chat → colaborare → recenzii', async () => {
    useAuth.getState().clear();
    // freelancer nou
    await act(async () => {
      await useAuth.getState().register({ name: 'Test Freelancer', email: 'tf@test.md', password: 'parola123', role: 'FREELANCER' });
      await useAuth.getState().login({ email: 'tf@test.md', password: 'parola123' });
    });
    expect(useAuth.getState().user.onboarded).toBe(false);
    const skills = await S.catalog.skills({ q: 'logo' });
    await S.freelancers.saveMine({ title: 'Designer logo', bio: 'Fac logo-uri simple și clare pentru afaceri mici.', level: 'BEGINNER', hourlyRate: 7, availability: 'AVAILABLE', languages: ['Română'], skillIds: skills.map((s) => s.id) });
    await S.freelancers.addPortfolio({ title: 'Logo de test', description: '', imageUrl: '', link: '' });
    const avatar = await S.uploads.uploadImage(new File(['imagine-test'], 'avatar.png', { type: 'image/png' }), { purpose: 'avatar' });
    expect(avatar).toMatch(/^data:image\/png;base64,/);
    await S.auth.updateAccount({ avatarUrl: avatar });
    const fl = await useAuth.getState().reload();
    expect(fl.onboarded).toBe(true);
    expect(fl.avatarUrl).toBe(avatar);

    // client nou
    useAuth.getState().clear();
    await act(async () => {
      await useAuth.getState().register({ name: 'Test Client', email: 'tc@test.md', password: 'parola123', role: 'CLIENT' });
      await useAuth.getState().login({ email: 'tc@test.md', password: 'parola123' });
    });
    await S.clients.saveMine({ type: 'PERSON', companyName: '', industry: '', description: '' });
    expect((await useAuth.getState().reload()).onboarded).toBe(true);
    const cats = await S.catalog.categories();
    const p = await S.projects.create({ title: 'Logo test', description: 'Am nevoie de un logo simplu pentru o brutărie de cartier, în culori calde.', categoryId: cats.find((c) => c.id === 'c_design').id, budgetMax: 150, skillIds: skills.map((s) => s.id) });
    expect(p.isStarter).toBe(true);
    await new Promise((r) => setTimeout(r, 3700)); // calculul de potrivire se termină
    const pm = await S.projects.matches(p.id);
    expect(pm.status).toBe('DONE');
    expect(pm.data.length).toBeGreaterThan(0);
    expect(pm.data.some((m) => m.reasons.exploration)).toBe(true); // loc rezervat talentelor noi
    const target = pm.data.find((m) => m.freelancer.name === 'Test Freelancer') || pm.data[0];
    const inv = await S.matches.invite(target.id);
    expect(inv.conversationId).toBeTruthy();
    await S.conversations.send(inv.conversationId, 'Salut! Te-am invitat la proiect.');
    const eng = await S.engagements.create({ matchId: target.id, agreedPrice: 120 });
    expect(eng.status).toBe('IN_PROGRESS');

    // freelancerul livrează (declarația AI e obligatorie) și clientul finalizează
    useAuth.getState().clear();
    await act(async () => { await useAuth.getState().login({ email: target.freelancer.name === 'Test Freelancer' ? 'tf@test.md' : demoEmail(target.freelancer.name), password: target.freelancer.name === 'Test Freelancer' ? 'parola123' : 'demo1234' }); });
    const freelancerInbox = await S.conversations.list();
    expect(freelancerInbox.some((conversation) => conversation.id === inv.conversationId)).toBe(true);
    expect((await S.conversations.messages(inv.conversationId)).some((message) => message.content === 'Salut! Te-am invitat la proiect.')).toBe(true);
    await S.conversations.send(inv.conversationId, 'Am primit invitația, mulțumesc!');
    await expect(S.engagements.setStatus(eng.id, 'DELIVERED')).rejects.toMatchObject({ status: 400 });
    await S.engagements.setAiDisclosure(eng.id, false);
    expect((await S.engagements.setStatus(eng.id, 'DELIVERED')).status).toBe('DELIVERED');
    useAuth.getState().clear();
    await act(async () => { await useAuth.getState().login({ email: 'tc@test.md', password: 'parola123' }); });
    expect((await S.conversations.messages(inv.conversationId)).some((message) => message.content === 'Am primit invitația, mulțumesc!')).toBe(true);
    expect((await S.engagements.setStatus(eng.id, 'COMPLETED')).status).toBe('COMPLETED');
    await S.engagements.review(eng.id, { rating: 5, comment: 'Foarte bine.' });
    await expect(S.engagements.review(eng.id, { rating: 4 })).rejects.toMatchObject({ status: 409 });
    const done = await S.engagements.byId(eng.id);
    expect(done.reviews).toHaveLength(1);
  });

  it('schimbarea rolului din setări păstrează contul și cere profilul celuilalt rol', async () => {
    await as('tc@test.md', 'parola123');
    await S.auth.updateAccount({ role: 'FREELANCER' });
    const me = await useAuth.getState().reload();
    expect(me.role).toBe('FREELANCER');
  });
});

function demoEmail(name) { return { 'Ana Petrova': 'freelancer@demo.md', 'Maria Cojocaru': 'maria@demo.md', 'Alex Morgan': 'alex@demo.md', 'Dan Lupu': 'dan@demo.md', 'Sofia Rotaru': 'sofia@demo.md', 'Vlad Ciobanu': 'vlad@demo.md' }[name]; }
