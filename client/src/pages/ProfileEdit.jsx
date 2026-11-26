import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Async, Card, Empty, SectionCard } from '../components/ui/Kit.jsx';
import { Field, Text, Textarea, Select } from '../components/ui/Fields.jsx';
import ImageUpload from '../components/forms/ImageUpload.jsx';
import SkillSelector from '../components/forms/SkillSelector.jsx';
import { useSession } from '../lib/session.jsx';
import { useMyClient, useMyFreelancer, useSaveClient, useSaveFreelancer, useAddPortfolio, useUpdatePortfolio, useRemovePortfolio, useUpdateAccount } from '../hooks/queries.js';
import { useToast } from '../components/feedback/Toast.jsx';
import { profileCompleteness } from '../lib/profile.js';
import { AVAILABILITY, LEVELS, LANGUAGES } from '../lib/format.js';

const LEVEL_VALUES = Object.keys(LEVELS);
const AVAIL_VALUES = Object.keys(AVAILABILITY);
const blankWork = { title: '', description: '', imageUrl: '', link: '' };

function WorkSamples({ items = [] }) {
  const add = useAddPortfolio();
  const update = useUpdatePortfolio();
  const remove = useRemovePortfolio();
  const [draft, setDraft] = useState(null);
  const { toast, error } = useToast();
  const save = async () => {
    if (!draft?.title?.trim()) return;
    const body = { title: draft.title.trim(), description: draft.description || '', imageUrl: draft.imageUrl || '', link: draft.link || '' };
    try {
      if (draft.id) await update.mutateAsync({ id: draft.id, ...body }); else await add.mutateAsync(body);
      setDraft(null); toast('Lucrarea a fost salvată.');
    } catch (e) { error(e); }
  };
  const del = async (item) => { try { await remove.mutateAsync(item.id); toast('Lucrarea a fost eliminată.'); } catch (e) { error(e); } };
  return <SectionCard title="Portofoliu" subtitle="Adaugă exemple de lucru cu imagini și linkuri relevante." action={!draft && <Button variant="outline" onClick={() => setDraft({ ...blankWork })}><Icon name="plus" className="h-4 w-4" />Adaugă lucrare</Button>}>
    {draft && <div className="mb-5 grid gap-4 border border-fm-ink/10 bg-fm-snow p-4 sm:grid-cols-2">
      <Field label="Titlu"><Text value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} maxLength={120} /></Field>
      <Field label="Link către lucrare" optional><Text type="url" value={draft.link} onChange={(e) => setDraft({ ...draft, link: e.target.value })} placeholder="https://…" /></Field>
      <Field label="Descriere" optional className="sm:col-span-2"><Textarea rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} maxLength={1000} /></Field>
      <Field label="Imagine" optional className="sm:col-span-2"><ImageUpload value={draft.imageUrl} onChange={(imageUrl) => setDraft({ ...draft, imageUrl })} purpose="portfolio" /></Field>
      <div className="flex justify-end gap-2 sm:col-span-2"><Button variant="outline" onClick={() => setDraft(null)}>Renunță</Button><Button onClick={save} loading={add.isPending || update.isPending}>Salvează</Button></div>
    </div>}
    {!items.length ? <Empty icon="images" title="Portofoliul este gol" text="Adaugă prima lucrare pentru a arăta ce poți face." /> : <div className="grid gap-3 sm:grid-cols-2">{items.map((item) => <article key={item.id} className="flex min-w-0 gap-3 border border-fm-ink/10 p-3">{item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="h-20 w-24 shrink-0 object-cover" /> : <div className="grid h-20 w-24 shrink-0 place-items-center bg-fm-mist/60"><Icon name="image" className="h-6 w-6 text-fm-slate/60" /></div>}<div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-fm-ink">{item.title}</p><p className="mt-1 line-clamp-2 text-xs text-fm-slate/65">{item.description}</p>{item.link && <a href={item.link} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-fm-accent">Deschide linkul</a>}</div><div className="flex flex-col gap-2"><button onClick={() => setDraft({ ...blankWork, ...item })} aria-label={`Editează ${item.title}`} className="text-fm-slate/60 hover:text-fm-ink"><Icon name="userPen" className="h-4 w-4" /></button><button onClick={() => del(item)} aria-label={`Șterge ${item.title}`} className="text-fm-slate/60 hover:text-red-600"><Icon name="trash" className="h-4 w-4" /></button></div></article>)}</div>}
  </SectionCard>;
}

function FreelancerForm({ profile, user, onSaved, onError, onAvatarSaved }) {
  const save = useSaveFreelancer();
  const [form, setForm] = useState({ title: '', bio: '', level: 'BEGINNER', hourlyRate: '', availability: 'AVAILABLE', languages: ['Română'], skillIds: [], ...(profile || {}) });
  useEffect(() => { if (profile) { const defaults = { title: '', bio: '', level: 'BEGINNER', hourlyRate: '', availability: 'AVAILABLE', languages: ['Română'], ...profile }; setForm({ ...defaults, hourlyRate: profile.hourlyRate ?? '', skillIds: profile.skillIds || profile.skills?.map((s) => s.id) || [] }); } }, [profile]);
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const submit = async (event) => { event.preventDefault(); try { await save.mutateAsync({ title: form.title.trim(), bio: form.bio.trim(), level: form.level, hourlyRate: form.hourlyRate === '' ? null : Number(form.hourlyRate), availability: form.availability, languages: form.languages, skillIds: form.skillIds }); onSaved(); } catch (e) { onError(e); } };
  return <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
    <Card className="p-4 sm:p-6"><form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
      <Field label="Titlu profesional" className="sm:col-span-2"><Text required minLength={3} value={form.title} onChange={set('title')} placeholder="ex. Designer UI/UX" /></Field>
      <Field label="Despre tine" hint={`${form.bio.length}/2000`} className="sm:col-span-2"><Textarea required minLength={30} maxLength={2000} rows={5} value={form.bio} onChange={set('bio')} placeholder="Descrie experiența, procesul de lucru și tipurile de proiecte pe care le cauți." /></Field>
      <Field label="Nivel declarat"><Select options={LEVEL_VALUES.map((v) => ({ value: v, label: LEVELS[v] }))} value={form.level} onChange={set('level')} /></Field>
      <Field label="Tarif orar" optional><Text type="number" min="0" step="1" inputMode="numeric" value={form.hourlyRate} onChange={set('hourlyRate')} placeholder="La cerere" /></Field>
      <Field label="Disponibilitate"><Select options={AVAIL_VALUES.map((v) => ({ value: v, label: AVAILABILITY[v] }))} value={form.availability} onChange={set('availability')} /></Field>
      <Field label="Limbi" hint="Alege limbile în care poți lucra." className="sm:col-span-2"><div className="flex flex-wrap gap-2">{LANGUAGES.map((language) => <button key={language} type="button" aria-pressed={form.languages.includes(language)} onClick={() => setForm((current) => ({ ...current, languages: current.languages.includes(language) ? current.languages.filter((x) => x !== language) : [...current.languages, language] }))} className={`border px-3 py-2 text-xs font-semibold ${form.languages.includes(language) ? 'border-fm-ink bg-fm-ink text-white' : 'border-fm-graphite/20 text-fm-ink'}`}>{language}</button>)}</div></Field>
      <Field label="Abilități" hint="Caută în catalog. Poți selecta până la 30." className="sm:col-span-2"><SkillSelector value={form.skillIds} onChange={(skillIds) => setForm((current) => ({ ...current, skillIds }))} /></Field>
      <div className="flex justify-end border-t border-fm-ink/10 pt-4 sm:col-span-2"><Button type="submit" loading={save.isPending}>Salvează profilul</Button></div>
    </form></Card>
    <Card className="h-fit p-4"><p className="text-sm font-semibold text-fm-ink">Fotografie de profil</p><p className="mt-1 text-xs text-fm-slate/65">Apare lângă numele tău în profil și în potriviri.</p><div className="mt-4"><ImageUpload value={user.avatarUrl || ''} onChange={onAvatarSaved} purpose="avatar" shape="round" name={user.name} /></div></Card>
    {profile?.portfolio && <div className="lg:col-span-2"><WorkSamples items={profile.portfolio} /></div>}
  </div>;
}

function ClientForm({ profile, user, onSaved, onError, onAvatarSaved }) {
  const save = useSaveClient();
  const [form, setForm] = useState({ type: 'PERSON', companyName: '', industry: '', description: '', ...(profile || {}) });
  useEffect(() => { if (profile) setForm({ type: 'PERSON', companyName: '', industry: '', description: '', ...profile }); }, [profile]);
  const submit = async (event) => { event.preventDefault(); try { await save.mutateAsync({ type: form.type, companyName: form.type === 'COMPANY' ? form.companyName.trim() : '', industry: form.industry.trim(), description: form.description.trim() }); onSaved(); } catch (e) { onError(e); } };
  return <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
    <Card className="p-4 sm:p-6"><form onSubmit={submit} className="grid gap-5 sm:grid-cols-2"><Field label="Tip cont"><Select options={[{ value: 'PERSON', label: 'Persoană' }, { value: 'COMPANY', label: 'Firmă' }]} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} /></Field>{form.type === 'COMPANY' && <Field label="Numele firmei"><Text required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></Field>}<Field label="Domeniu" className="sm:col-span-2"><Text value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="ex. Restaurante, retail, educație" /></Field><Field label="Descriere" className="sm:col-span-2"><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Spune pe scurt despre activitatea ta." /></Field><div className="flex justify-end border-t border-fm-ink/10 pt-4 sm:col-span-2"><Button type="submit" loading={save.isPending}>Salvează profilul de client</Button></div></form></Card>
    <Card className="h-fit p-4"><p className="text-sm font-semibold text-fm-ink">Fotografie de profil</p><p className="mt-1 text-xs text-fm-slate/65">Apare lângă numele tău în proiecte și conversații.</p><div className="mt-4"><ImageUpload value={user.avatarUrl || ''} onChange={onAvatarSaved} purpose="avatar" shape="round" name={user.name} /></div></Card>
  </div>;
}

export default function ProfileEdit() {
  const { mode, user } = useSession();
  const freelancerMode = mode === 'FREELANCER';
  const freelancer = useMyFreelancer(freelancerMode);
  const client = useMyClient(!freelancerMode);
  const updateAccount = useUpdateAccount();
  const { toast, error } = useToast();
  const completeness = profileCompleteness(freelancer.data);
  const onSaved = () => toast('Profilul a fost salvat.');
  const onAvatarSaved = async (avatarUrl) => { try { await updateAccount.mutateAsync({ avatarUrl: avatarUrl || null }); toast(avatarUrl ? 'Fotografia de profil a fost actualizată.' : 'Fotografia de profil a fost eliminată.'); } catch (e) { error(e); } };
  return <PageShell title="Profil și portofoliu" subtitle={freelancerMode ? 'Editează profilul profesional și exemplele de lucru.' : 'Actualizează informațiile folosite când publici proiecte.'} action={freelancerMode && freelancer.data?.id && <Link to={`/freelancers/${freelancer.data.id}`} className="border border-fm-graphite/25 px-4 py-2.5 text-sm font-semibold text-fm-ink">Vezi profilul public</Link>}>
    <div className="grid min-w-0 gap-4">{freelancerMode ? <Async q={freelancer}>{(profile) => <FreelancerForm profile={profile} user={user} onSaved={onSaved} onError={error} onAvatarSaved={onAvatarSaved} />}</Async> : <Async q={client}>{(profile) => <ClientForm profile={profile} user={user} onSaved={onSaved} onError={error} onAvatarSaved={onAvatarSaved} />}</Async>}
      {freelancerMode && <Card className="p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-fm-ink">Profil completat</p><p className="mt-1 text-xs text-fm-slate/65">{completeness.next?.label || 'Profilul conține informațiile esențiale.'}</p></div><span className="text-lg font-bold text-fm-ink">{completeness.percent}%</span></div><div className="mt-3 h-1.5 bg-fm-mist"><div className="h-full bg-fm-accent-solid" style={{ width: `${completeness.percent}%` }} /></div></Card>}
    </div>
  </PageShell>;
}
