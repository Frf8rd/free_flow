import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/ui/Logo.jsx';
import Button from '../components/ui/Button.jsx';
import { Field, Text, Textarea, Select } from '../components/ui/Fields.jsx';
import SkillSelector from '../components/forms/SkillSelector.jsx';
import { useMyClient, useMyFreelancer, useSaveClient, useSaveFreelancer } from '../hooks/queries.js';
import { useAuth } from '../store/authStore.js';
import { useSession } from '../lib/session.jsx';
import { useToast } from '../components/feedback/Toast.jsx';
import { AVAILABILITY, LEVELS, LANGUAGES } from '../lib/format.js';

const freelancerDefaults = () => ({ title: '', bio: '', level: 'BEGINNER', hourlyRate: '', availability: 'AVAILABLE', languages: ['Română'], skillIds: [] });
const clientDefaults = () => ({ type: 'PERSON', companyName: '', industry: '', description: '' });

export default function Onboarding() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const reload = useAuth((s) => s.reload);
  const { setMode, previousMode } = useSession();
  const isFreelancer = user?.role === 'FREELANCER';
  const freelancerProfile = useMyFreelancer(isFreelancer);
  const clientProfile = useMyClient(!isFreelancer);
  const saveFreelancer = useSaveFreelancer();
  const saveClient = useSaveClient();
  const { error } = useToast();
  const touched = useRef(false);
  const [formError, setFormError] = useState('');
  const [switchingRole, setSwitchingRole] = useState(false);
  // Câte o stare separată pentru fiecare rol: dacă rolul se schimbă (ex. setMode actualizează user.role
  // înainte să apucăm să resetăm formularul), forma citită nu poate fi niciodată de tipul greșit.
  const roleKey = isFreelancer ? 'FREELANCER' : 'CLIENT';
  const [forms, setForms] = useState(() => ({ FREELANCER: freelancerDefaults(), CLIENT: clientDefaults() }));
  const form = forms[roleKey];
  const setForm = (updater) => setForms((all) => ({ ...all, [roleKey]: typeof updater === 'function' ? updater(all[roleKey]) : updater }));
  const set = (key) => (event) => { touched.current = true; setForm((current) => ({ ...current, [key]: event.target.value })); setFormError(''); };

  useEffect(() => {
    if (touched.current) return;
    const profile = isFreelancer ? freelancerProfile.data : clientProfile.data;
    if (!profile) return;
    setForms((all) => ({ ...all, [roleKey]: isFreelancer
      ? { title: profile.title || '', bio: profile.bio || '', level: profile.level || 'BEGINNER', hourlyRate: profile.hourlyRate ?? '', availability: profile.availability || 'AVAILABLE', languages: profile.languages?.length ? profile.languages : ['Română'], skillIds: profile.skills?.map((skill) => skill.id) || [] }
      : { type: profile.clientProfile?.type || profile.type || 'PERSON', companyName: profile.clientProfile?.companyName || profile.companyName || '', industry: profile.clientProfile?.industry || profile.industry || '', description: profile.clientProfile?.description || profile.description || '' } }));
  }, [isFreelancer, freelancerProfile.data, clientProfile.data]);

  const save = async (event) => {
    event.preventDefault();
    setFormError('');
    try {
      if (isFreelancer && !form.skillIds.length) {
        setFormError('Adaugă cel puțin o abilitate pentru a continua.');
        return;
      }
      if (!isFreelancer && !form.industry.trim()) {
        setFormError('Completează domeniul de activitate pentru a continua.');
        return;
      }
      if (isFreelancer) await saveFreelancer.mutateAsync({ ...form, title: form.title.trim(), bio: form.bio.trim(), hourlyRate: form.hourlyRate === '' ? null : Number(form.hourlyRate) });
      else await saveClient.mutateAsync({ ...form, industry: form.industry.trim(), companyName: form.type === 'COMPANY' ? form.companyName.trim() : '' });
      const updatedUser = await reload();
      if (!updatedUser?.onboarded) {
        setFormError(isFreelancer
          ? 'Profilul a fost salvat. Verifică titlul, descrierea și cel puțin o abilitate înainte de a continua.'
          : 'Profilul a fost salvat. Completează domeniul și datele firmei, dacă ai ales „Firmă”.');
        return;
      }
      navigate('/dashboard', { replace: true });
    } catch (e) { error(e); setFormError(e.message || 'Nu am putut salva profilul. Datele completate au rămas în formular.'); }
  };
  const loading = saveFreelancer.isPending || saveClient.isPending;
  const switchRole = async (role) => {
    if (switchingRole || loading || role === user?.role) return;
    setSwitchingRole(true);
    setFormError('');
    try {
      const updatedUser = await setMode(role);
      touched.current = false;
      setForms((all) => ({ ...all, [role]: role === 'FREELANCER' ? freelancerDefaults() : clientDefaults() }));
      if (updatedUser?.onboarded) navigate('/dashboard', { replace: true });
    } catch (e) {
      setFormError(e.message || 'Nu am putut schimba spațiul de lucru.');
    } finally {
      setSwitchingRole(false);
    }
  };
  return <main className="fm-frame grid min-h-screen place-items-center p-3 sm:p-6"><div className="w-full max-w-2xl border border-fm-ink/10 bg-fm-snow p-5 shadow-card sm:p-8"><Logo /><h1 className="mt-6 text-2xl font-bold tracking-tight text-fm-ink">Completează profilul</h1><p className="mt-1 text-sm text-fm-slate/70">{isFreelancer ? 'Aceste informații îi ajută pe clienți și pe sistemul de potrivire să-ți înțeleagă experiența.' : 'Adaugă câteva detalii despre tine sau organizația ta.'}</p>
    <section className="mt-5 border border-fm-ink/10 p-4" aria-label="Alege spațiul de lucru">
      <p className="text-sm font-semibold text-fm-ink">Spațiul de lucru</p>
      <p className="mt-1 text-xs text-fm-slate/65">Același cont poate folosi ambele roluri. Poți completa profilul celuilalt rol oricând.</p>
      <div role="radiogroup" aria-label="Rol activ" className="mt-3 grid grid-cols-2 gap-2">
        {[['CLIENT', 'Client'], ['FREELANCER', 'Freelancer']].map(([role, label]) => <button key={role} type="button" role="radio" aria-checked={user?.role === role} disabled={switchingRole || loading} onClick={() => switchRole(role)} className={`border px-3 py-2.5 text-sm font-semibold disabled:opacity-50 ${user?.role === role ? 'border-fm-ink bg-fm-ink text-white' : 'border-fm-graphite/20 text-fm-ink hover:bg-fm-mist/40'}`}>{switchingRole && user?.role !== role ? 'Se schimbă…' : label}</button>)}
      </div>
    </section>
    {previousMode && previousMode !== user?.role && <button type="button" disabled={switchingRole || loading} onClick={() => switchRole(previousMode)} className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-fm-graphite hover:text-fm-ink disabled:opacity-50">← Înapoi la Dashboard ({previousMode === 'CLIENT' ? 'Client' : 'Freelancer'})</button>}
    <form onSubmit={save} className="mt-6 grid gap-5 sm:grid-cols-2">
      {isFreelancer ? <>
        <Field label="Titlu profesional" className="sm:col-span-2"><Text required minLength={3} maxLength={80} value={form.title} onChange={set('title')} placeholder="ex. Designer UI/UX" /></Field>
        <Field label="Despre tine" hint="Minimum 30 de caractere." className="sm:col-span-2"><Textarea required minLength={30} maxLength={1500} rows={5} value={form.bio} onChange={set('bio')} placeholder="Descrie ce știi să faci și ce tipuri de proiecte cauți." /></Field>
        <Field label="Nivel declarat"><Select options={Object.entries(LEVELS).map(([value, label]) => ({ value, label }))} value={form.level} onChange={set('level')} /></Field>
        <Field label="Tarif orar" optional><Text type="number" min="0" inputMode="numeric" value={form.hourlyRate} onChange={set('hourlyRate')} placeholder="La cerere" /></Field>
        <Field label="Disponibilitate"><Select options={Object.entries(AVAILABILITY).map(([value, label]) => ({ value, label }))} value={form.availability} onChange={set('availability')} /></Field>
        <Field label="Limbi" className="sm:col-span-2"><div className="flex flex-wrap gap-2">{LANGUAGES.map((language) => <button key={language} type="button" aria-pressed={(form.languages || []).includes(language)} onClick={() => { touched.current = true; setForm((current) => ({ ...current, languages: (current.languages || []).includes(language) ? (current.languages || []).filter((x) => x !== language) : [...(current.languages || []), language] })); }} className={`border px-3 py-2 text-xs font-semibold ${(form.languages || []).includes(language) ? 'border-fm-ink bg-fm-ink text-white' : 'border-fm-graphite/20 text-fm-ink'}`}>{language}</button>)}</div></Field>
        <Field label="Abilități" hint="Caută în catalog și adaugă cel puțin una." className="sm:col-span-2"><SkillSelector value={form.skillIds} onChange={(skillIds) => { touched.current = true; setForm((current) => ({ ...current, skillIds })); setFormError(''); }} /></Field>
      </> : <>
        <Field label="Tip cont"><Select options={[{ value: 'PERSON', label: 'Persoană' }, { value: 'COMPANY', label: 'Firmă' }]} value={form.type} onChange={set('type')} /></Field>
        {form.type === 'COMPANY' && <Field label="Numele firmei"><Text required value={form.companyName} onChange={set('companyName')} /></Field>}
        <Field label="Domeniu" className="sm:col-span-2"><Text required value={form.industry} onChange={set('industry')} placeholder="ex. Restaurante, retail, educație" /></Field>
        <Field label="Descriere" className="sm:col-span-2"><Textarea rows={4} value={form.description} onChange={set('description')} placeholder="Spune pe scurt despre activitatea ta." /></Field>
      </>}
      {formError && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{formError}</p>}
      <div className="flex justify-end border-t border-fm-ink/10 pt-4 sm:col-span-2"><Button type="submit" loading={loading}>Salvează și continuă</Button></div>
    </form>
  </div></main>;
}
