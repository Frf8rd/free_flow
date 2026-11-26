import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/ui/Logo.jsx';
import Button from '../components/ui/Button.jsx';
import { Field, Text, Textarea, Select } from '../components/ui/Fields.jsx';
import SkillSelector from '../components/forms/SkillSelector.jsx';
import { useSaveClient, useSaveFreelancer } from '../hooks/queries.js';
import { useAuth } from '../store/authStore.js';
import { useToast } from '../components/feedback/Toast.jsx';
import { AVAILABILITY, LEVELS, LANGUAGES } from '../lib/format.js';

export default function Onboarding() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const reload = useAuth((s) => s.reload);
  const isFreelancer = user?.role === 'FREELANCER';
  const saveFreelancer = useSaveFreelancer();
  const saveClient = useSaveClient();
  const { error } = useToast();
  const [form, setForm] = useState(isFreelancer
    ? { title: '', bio: '', level: 'BEGINNER', hourlyRate: '', availability: 'AVAILABLE', languages: ['Română'], skillIds: [] }
    : { type: 'PERSON', companyName: '', industry: '', description: '' });
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const save = async (event) => {
    event.preventDefault();
    try {
      if (isFreelancer) await saveFreelancer.mutateAsync({ ...form, title: form.title.trim(), bio: form.bio.trim(), hourlyRate: form.hourlyRate === '' ? null : Number(form.hourlyRate) });
      else await saveClient.mutateAsync({ ...form, companyName: form.type === 'COMPANY' ? form.companyName.trim() : '' });
      await reload();
      navigate('/dashboard', { replace: true });
    } catch (e) { error(e); }
  };
  const loading = saveFreelancer.isPending || saveClient.isPending;
  return <main className="fm-frame grid min-h-screen place-items-center p-3 sm:p-6"><div className="w-full max-w-2xl border border-fm-ink/10 bg-fm-snow p-5 shadow-card sm:p-8"><Logo /><h1 className="mt-6 text-2xl font-bold tracking-tight text-fm-ink">Completează profilul</h1><p className="mt-1 text-sm text-fm-slate/70">{isFreelancer ? 'Aceste informații îi ajută pe clienți și pe sistemul de potrivire să-ți înțeleagă experiența.' : 'Adaugă câteva detalii despre tine sau organizația ta.'}</p>
    <form onSubmit={save} className="mt-6 grid gap-5 sm:grid-cols-2">
      {isFreelancer ? <>
        <Field label="Titlu profesional" className="sm:col-span-2"><Text required minLength={3} maxLength={80} value={form.title} onChange={set('title')} placeholder="ex. Designer UI/UX" /></Field>
        <Field label="Despre tine" hint="Minimum 30 de caractere." className="sm:col-span-2"><Textarea required minLength={30} maxLength={1500} rows={5} value={form.bio} onChange={set('bio')} placeholder="Descrie ce știi să faci și ce tipuri de proiecte cauți." /></Field>
        <Field label="Nivel declarat"><Select options={Object.entries(LEVELS).map(([value, label]) => ({ value, label }))} value={form.level} onChange={set('level')} /></Field>
        <Field label="Tarif orar" optional><Text type="number" min="0" inputMode="numeric" value={form.hourlyRate} onChange={set('hourlyRate')} placeholder="La cerere" /></Field>
        <Field label="Disponibilitate"><Select options={Object.entries(AVAILABILITY).map(([value, label]) => ({ value, label }))} value={form.availability} onChange={set('availability')} /></Field>
        <Field label="Limbi" className="sm:col-span-2"><div className="flex flex-wrap gap-2">{LANGUAGES.map((language) => <button key={language} type="button" aria-pressed={form.languages.includes(language)} onClick={() => setForm((current) => ({ ...current, languages: current.languages.includes(language) ? current.languages.filter((x) => x !== language) : [...current.languages, language] }))} className={`border px-3 py-2 text-xs font-semibold ${form.languages.includes(language) ? 'border-fm-ink bg-fm-ink text-white' : 'border-fm-graphite/20 text-fm-ink'}`}>{language}</button>)}</div></Field>
        <Field label="Abilități" hint="Caută în catalog și adaugă cel puțin una." className="sm:col-span-2"><SkillSelector value={form.skillIds} onChange={(skillIds) => setForm((current) => ({ ...current, skillIds }))} /></Field>
      </> : <>
        <Field label="Tip cont"><Select options={[{ value: 'PERSON', label: 'Persoană' }, { value: 'COMPANY', label: 'Firmă' }]} value={form.type} onChange={set('type')} /></Field>
        {form.type === 'COMPANY' && <Field label="Numele firmei"><Text required value={form.companyName} onChange={set('companyName')} /></Field>}
        <Field label="Domeniu" className="sm:col-span-2"><Text value={form.industry} onChange={set('industry')} placeholder="ex. Restaurante, retail, educație" /></Field>
        <Field label="Descriere" className="sm:col-span-2"><Textarea rows={4} value={form.description} onChange={set('description')} placeholder="Spune pe scurt despre activitatea ta." /></Field>
      </>}
      <div className="flex justify-end border-t border-fm-ink/10 pt-4 sm:col-span-2"><Button type="submit" loading={loading}>Salvează și continuă</Button></div>
    </form>
  </div></main>;
}
