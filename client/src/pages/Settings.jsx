import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/layout/PageShell.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Card } from '../components/ui/Kit.jsx';
import ImageUpload from '../components/forms/ImageUpload.jsx';
import { useSession } from '../lib/session.jsx';
import { useAuth } from '../store/authStore.js';
import { useChangePassword, useDeleteAccount, useUpdateAccount } from '../hooks/queries.js';

const sections = [
  ['account', 'Cont', 'user', 'Date personale și rol'],
  ['appearance', 'Aspect', 'sun', 'Temă și culori'],
  ['dashboard', 'Dashboard', 'dashboard', 'Fundal și widgeturi'],
  ['security', 'Securitate', 'lock', 'Parolă și confidențialitate'],
];
const themes = [['light', 'Deschisă', 'sun'], ['dark', 'Întunecată', 'moon'], ['system', 'Sistem', 'monitor']];
const backgrounds = [
  ['Albastru', 'linear-gradient(135deg, #83b8f2 0%, #c8a8f3 52%, #f4c4ad 100%)'],
  ['Lavandă', 'linear-gradient(135deg, #aaa0ed 0%, #d6a9ee 48%, #f0c2da 100%)'],
  ['Laguna', 'linear-gradient(135deg, #58c7c1 0%, #86d4d4 48%, #b4b9ef 100%)'],
  ['Apus', 'linear-gradient(135deg, #f1a36d 0%, #e989a8 48%, #8e9be7 100%)'],
];
const widgetLabels = {
  attention: 'De urmărit', projects: 'Proiectele tale', activity: 'Colaborări active',
  profile: 'Profil freelancer', matches: 'Potriviri recente',
};
const defaultsFor = (mode) => mode === 'CLIENT'
  ? ['attention', 'projects', 'activity']
  : ['attention', 'profile', 'matches', 'activity'];
const readJson = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };

function SettingBlock({ title, text, children }) {
  return <div className="border-t border-fm-ink/10 pt-5 first:border-t-0 first:pt-0"><h3 className="text-sm font-semibold text-fm-ink">{title}</h3>{text && <p className="mt-1 text-xs text-fm-slate/65">{text}</p>}<div className="mt-4">{children}</div></div>;
}

export default function Settings() {
  const { theme, setTheme, mode } = useSession();
  const user = useAuth((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';
  const navigate = useNavigate();
  const accountMutation = useUpdateAccount();
  const passwordMutation = useChangePassword();
  const deleteMutation = useDeleteAccount();
  const [searchParams] = useSearchParams();
  const [section, setSection] = useState(() => sections.some(([id]) => id === searchParams.get('section')) ? searchParams.get('section') : 'appearance');
  const [msg, setMsg] = useState('');
  const [account, setAccount] = useState({ name: user?.name || '', email: user?.email || '', role: user?.role || mode });
  const [password, setPassword] = useState({ oldPassword: '', newPassword: '' });
  const [deletePassword, setDeletePassword] = useState('');
  const [background, setBackground] = useState(() => {
    const saved = readJson('fm-dashboard-background', null);
    return saved?.kind === 'gradient' ? saved : { kind: 'gradient', value: backgrounds[0][1] };
  });
  const dashboardBackgroundUrl = user?.dashboardBackgroundUrl || '';
  const [widgetState, setWidgetState] = useState(() => readJson(`fm-widgets-${mode === 'CLIENT' ? 'client' : 'freelancer'}`, {}));
  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 2500); };
  const widgetKey = `fm-widgets-${mode === 'CLIENT' ? 'client' : 'freelancer'}`;
  const widgetIds = defaultsFor(mode);
  const widgetOrder = useMemo(() => {
    const saved = (widgetState.order || []).filter((id) => widgetIds.includes(id));
    return [...saved, ...widgetIds.filter((id) => !saved.includes(id))];
  }, [widgetIds.join(','), widgetState.order]);
  const hidden = (widgetState.hidden || []).filter((id) => widgetIds.includes(id));
  const updateWidgets = (next) => {
    setWidgetState(next);
    try { localStorage.setItem(widgetKey, JSON.stringify(next)); } catch { /* setări doar locale */ }
  };
  const saveBackground = async (next) => {
    try { await accountMutation.mutateAsync({ dashboardBackgroundUrl: null }); }
    catch (e) { flash(e.message); return; }
    setBackground(next);
    try { localStorage.setItem('fm-dashboard-background', JSON.stringify(next)); }
    catch { flash('Gradientul se aplică, dar nu s-a putut salva local.'); }
    window.dispatchEvent(new CustomEvent('fm-dashboard-background-change', { detail: next }));
  };
  const saveBackgroundImage = async (url) => {
    try {
      await accountMutation.mutateAsync({ dashboardBackgroundUrl: url || null });
      if (url) {
        setBackground({ kind: 'gradient', value: '' });
        try { localStorage.removeItem('fm-dashboard-background'); } catch { /* imaginea rămâne salvată în cont */ }
      }
      flash(url ? 'Imaginea de fundal a fost salvată în cont.' : 'Imaginea de fundal a fost eliminată.');
    } catch (e) { flash(e.message); }
  };
  useEffect(() => {
    try {
      if (JSON.parse(localStorage.getItem('fm-dashboard-background') || 'null')?.kind === 'image') {
        localStorage.removeItem('fm-dashboard-background');
      }
    } catch { /* ignoră preferințele locale vechi */ }
  }, []);
  useEffect(() => { setWidgetState(readJson(widgetKey, {})); }, [widgetKey]);
  useEffect(() => {
    const requested = searchParams.get('section');
    setSection(sections.some(([id]) => id === requested) ? requested : 'appearance');
  }, [searchParams]);

  const selected = sections.find(([id]) => id === section) || sections[0];
  const saveAccount = async (event) => { event.preventDefault(); try { await accountMutation.mutateAsync({ name: account.name.trim(), email: account.email.trim() }); flash('Datele contului au fost salvate.'); } catch (e) { flash(e.message); } };
  const savePassword = async (event) => { event.preventDefault(); try { await passwordMutation.mutateAsync(password); setPassword({ oldPassword: '', newPassword: '' }); flash('Parola a fost schimbată.'); } catch (e) { flash(e.message); } };
  const deleteAccount = async (event) => { event.preventDefault(); if (!window.confirm('Ștergi definitiv contul și datele asociate?')) return; try { await deleteMutation.deleteAccount(deletePassword); navigate('/', { replace: true }); } catch (e) { flash(e.message); } };

  return (
    <PageShell title="Setări" subtitle="Ajustează FairMatch pentru felul în care lucrezi." action={msg && <span role="status" className="inline-flex items-center gap-2 bg-fm-ink px-3 py-2 text-xs font-semibold text-white"><Icon name="check" className="h-4 w-4" />{msg}</span>}>
      <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-8">
        <nav aria-label="Secțiuni setări" className="flex gap-1 overflow-x-auto border-b border-fm-ink/10 pb-2 lg:flex-col lg:overflow-visible lg:border-0 lg:pb-0">
          {sections.map(([id, label, icon, hint]) => <button key={id} onClick={() => setSection(id)} aria-current={section === id ? 'page' : undefined} className={`flex shrink-0 items-center gap-3 border-l-2 px-3 py-3 text-left transition-colors lg:w-full ${section === id ? 'border-fm-ink bg-fm-mist/45 text-fm-ink' : 'border-transparent text-fm-slate/70 hover:bg-fm-mist/25 hover:text-fm-ink'}`}>
            <Icon name={icon} className="h-[18px] w-[18px] shrink-0" /><span className="min-w-0"><span className="block text-sm font-semibold">{label}</span><span className="hidden text-xs opacity-65 lg:block">{hint}</span></span>
          </button>)}
        </nav>

        <Card className="min-w-0 p-4 sm:p-6 lg:p-7">
          <header className="mb-6 flex items-start gap-3 border-b border-fm-ink/10 pb-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center bg-fm-ink text-white"><Icon name={selected[2]} className="h-5 w-5" /></span>
            <div><h2 className="text-lg font-bold text-fm-ink">{selected[1]}</h2><p className="mt-0.5 text-sm text-fm-slate/65">{selected[3]}</p></div>
          </header>

          {section === 'account' && <div className="grid max-w-3xl gap-7">
            <SettingBlock title="Datele contului" text="Numele și emailul folosite pentru autentificare."><form onSubmit={saveAccount} className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-fm-ink">Nume<input required value={account.name} onChange={(e) => setAccount({ ...account, name: e.target.value })} className="mt-1.5 w-full border border-fm-graphite/15 bg-white px-3 py-3 text-sm" /></label><label className="text-sm font-medium text-fm-ink">Email<input required type="email" value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} className="mt-1.5 w-full border border-fm-graphite/15 bg-white px-3 py-3 text-sm" /></label><div className="sm:col-span-2"><Button type="submit" loading={accountMutation.isPending}>Salvează datele</Button></div></form></SettingBlock>
            {!isAdmin && <SettingBlock title="Spațiul de lucru" text="Contul păstrează datele ambelor profile. Alege rolul folosit acum în FairMatch."><div className="grid gap-2 sm:grid-cols-2">{[['CLIENT', 'Client'], ['FREELANCER', 'Freelancer']].map(([role, label]) => <button key={role} type="button" aria-pressed={account.role === role} onClick={() => setAccount({ ...account, role })} className={`border px-4 py-3 text-sm font-semibold ${account.role === role ? 'border-fm-ink bg-fm-ink text-white' : 'border-fm-graphite/20 text-fm-ink hover:bg-fm-mist/40'}`}>{label}</button>)}</div><button type="button" disabled={accountMutation.isPending || account.role === user?.role} onClick={async () => { try { await accountMutation.mutateAsync({ role: account.role }); flash('Spațiul de lucru a fost schimbat.'); } catch (e) { flash(e.message); } }} className="mt-3 border border-fm-graphite/25 px-4 py-2.5 text-sm font-semibold text-fm-ink disabled:opacity-40">{accountMutation.isPending ? 'Se salvează…' : 'Schimbă spațiul de lucru'}</button></SettingBlock>}
          </div>}
          {section === 'appearance' && <div className="max-w-2xl"><SettingBlock title="Tema aplicației" text="Alege aspectul interfeței sau urmează setarea dispozitivului."><div className="grid gap-2 sm:grid-cols-3">{themes.map(([value, label, icon]) => <button key={value} onClick={() => setTheme(value)} aria-pressed={theme === value} className={`flex items-center justify-center gap-2 border px-3 py-3 text-sm font-semibold transition ${theme === value ? 'border-fm-graphite bg-fm-mist/55 text-fm-ink ring-1 ring-fm-graphite/40' : 'border-fm-ink/15 text-fm-slate/75 hover:bg-fm-mist/25'}`}><Icon name={icon} className="h-4 w-4" />{label}</button>)}</div></SettingBlock></div>}

          {section === 'dashboard' && <div className="grid max-w-3xl gap-7">
            <SettingBlock title="Fundal dashboard" text="Imaginea se verifică, se salvează și se sincronizează prin contul tău. Poți alege și un gradient simplu.">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{backgrounds.map(([label, value]) => { const active = !dashboardBackgroundUrl && background.value === value; return <button key={label} onClick={() => saveBackground({ kind: 'gradient', value })} aria-pressed={active} className={`h-20 border border-fm-ink/15 p-2 text-left text-xs font-semibold text-fm-ink ${active ? 'outline outline-2 outline-fm-graphite' : ''}`} style={{ backgroundImage: value }}>{label}</button>; })}</div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="w-full max-w-md"><ImageUpload value={dashboardBackgroundUrl} onChange={saveBackgroundImage} purpose="portfolio" shape="wide" label="Încarcă imagine de fundal" /></div>
                <button onClick={() => saveBackground({ kind: 'gradient', value: backgrounds[0][1] })} className="px-3 py-2 text-sm font-medium text-fm-slate/70 hover:text-fm-ink">Resetează</button>
              </div>
            </SettingBlock>
            <SettingBlock title="Widgeturi vizibile" text="Alege ce apare în panoul lateral al dashboardului și schimbă ordinea.">
              <ol className="grid gap-1">{widgetOrder.map((id, index) => {
                const isHidden = hidden.includes(id);
                return <li key={id} className="flex min-w-0 items-center gap-2 border border-fm-ink/10 px-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-fm-ink">{widgetLabels[id]}</span>
                  <button onClick={() => { const order = [...widgetOrder]; if (index > 0) [order[index - 1], order[index]] = [order[index], order[index - 1]]; updateWidgets({ ...widgetState, order }); }} disabled={index === 0} aria-label={`Mută ${widgetLabels[id]} mai sus`} className="grid h-8 w-8 shrink-0 place-items-center text-fm-slate/60 hover:bg-fm-mist/40 disabled:opacity-30">↑</button>
                  <button onClick={() => { const order = [...widgetOrder]; if (index < order.length - 1) [order[index + 1], order[index]] = [order[index], order[index + 1]]; updateWidgets({ ...widgetState, order }); }} disabled={index === widgetOrder.length - 1} aria-label={`Mută ${widgetLabels[id]} mai jos`} className="grid h-8 w-8 shrink-0 place-items-center text-fm-slate/60 hover:bg-fm-mist/40 disabled:opacity-30">↓</button>
                  <button onClick={() => updateWidgets({ ...widgetState, hidden: isHidden ? hidden.filter((item) => item !== id) : [...hidden, id] })} aria-pressed={!isHidden} aria-label={isHidden ? `Afișează ${widgetLabels[id]}` : `Ascunde ${widgetLabels[id]}`} className={`shrink-0 border px-2.5 py-1.5 text-xs font-semibold ${isHidden ? 'border-fm-ink/15 text-fm-slate/65' : 'border-fm-ink/20 bg-fm-mist/35 text-fm-ink'}`}>{isHidden ? 'Ascuns' : 'Vizibil'}</button>
                </li>;
              })}</ol>
              <button onClick={() => updateWidgets({})} className="mt-3 text-sm font-semibold text-fm-graphite hover:text-fm-ink">Resetează widgeturile</button>
            </SettingBlock>
          </div>}

          {section === 'security' && <div className="grid max-w-2xl gap-7">
            <SettingBlock title="Parolă" text="Folosește o parolă nouă de cel puțin 8 caractere."><form onSubmit={savePassword} className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-fm-ink">Parola actuală<input required type="password" autoComplete="current-password" value={password.oldPassword} onChange={(e) => setPassword({ ...password, oldPassword: e.target.value })} className="mt-1.5 w-full border border-fm-graphite/15 bg-white px-3 py-3 text-sm" /></label><label className="text-sm font-medium text-fm-ink">Parola nouă<input required minLength={8} type="password" autoComplete="new-password" value={password.newPassword} onChange={(e) => setPassword({ ...password, newPassword: e.target.value })} className="mt-1.5 w-full border border-fm-graphite/15 bg-white px-3 py-3 text-sm" /></label><div className="sm:col-span-2"><Button type="submit" loading={passwordMutation.isPending}>Schimbă parola</Button></div></form></SettingBlock>
            <SettingBlock title="Șterge contul" text="Acțiunea este definitivă și nu poate fi anulată."><form onSubmit={deleteAccount} className="flex flex-wrap items-end gap-3"><label className="min-w-48 flex-1 text-sm font-medium text-fm-ink">Confirmă parola<input required type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className="mt-1.5 w-full border border-fm-graphite/15 bg-white px-3 py-3 text-sm" /></label><button type="submit" disabled={deleteMutation.isPending} className="border border-red-500 px-4 py-3 text-sm font-semibold text-red-600 disabled:opacity-50">Șterge contul</button></form></SettingBlock>
          </div>}
        </Card>
      </div>
    </PageShell>
  );
}
