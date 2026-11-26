import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageShell from '../components/layout/PageShell.jsx';
import Icon from '../components/ui/Icon.jsx';
import Button from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Kit.jsx';
import { Field, Text, Textarea, Select, SkillPicker } from '../components/ui/Fields.jsx';
import { categories, skills } from '../data/mockPages2.js';
import { allProjects, ME_ID } from '../data/mockPages2.js';
import { readDemo, writeDemo } from '../lib/demoStore.js';
import { useSession } from '../lib/session.jsx';

const tips = ['Descrie clar rezultatul dorit, bugetul și termenul.', 'Adaugă abilitățile relevante ca să fie mai ușor de găsit proiectul.', 'Proiectul se salvează în acest browser. Recomandările automate vor fi disponibile după conectarea serviciului.'];

export default function ProjectNew() {
  const navigate = useNavigate();
  const { mode, user } = useSession();
  const [f, setF] = useState({ title: '', description: '', category: categories[0], budgetMin: '', budgetMax: '', deadline: '', skills: [] });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  function submit(e) {
    e.preventDefault();
    const er = {};
    if (f.title.trim().length < 5) er.title = 'Scrie un titlu de cel puțin 5 caractere.';
    if (f.description.trim().length < 30) er.description = 'Descrie proiectul în cel puțin 30 de caractere.';
    if (f.budgetMin && f.budgetMax && +f.budgetMin > +f.budgetMax) er.budget = 'Bugetul minim nu poate depăși maximul.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setLoading(true);
    const id = `local-${Date.now()}`;
    const budget = f.budgetMin && f.budgetMax ? `${f.budgetMin} – ${f.budgetMax} lei` : f.budgetMin ? `De la ${f.budgetMin} lei` : 'Buget flexibil';
    const created = {
      id, ownerId: user.id || ME_ID, author: user.name || 'Tu', title: f.title.trim(), description: f.description.trim(),
      category: f.category, tags: f.skills, budget, budgetMin: f.budgetMin ? Number(f.budgetMin) : null,
      budgetMax: f.budgetMax ? Number(f.budgetMax) : null, deadline: f.deadline || 'Flexibil', status: 'OPEN',
      size: 'De stabilit', level: 'Flexibil', time: 'acum', posted: 1, rating: '—', since: new Date().getFullYear(), views: 0,
    };
    const projects = readDemo('fm-demo-projects', allProjects);
    writeDemo('fm-demo-projects', [created, ...projects]);
    setTimeout(() => navigate(`/recommendations?project=${encodeURIComponent(id)}`), 250);
  }

  if (mode !== 'CLIENT') return (
    <PageShell title="Postează un proiect" subtitle="Publicarea proiectelor este disponibilă în spațiul Client.">
      <Card className="p-5"><p className="text-sm text-fm-slate">Contul tău este unic. Comută pe <b className="text-fm-ink">Client</b> din bara laterală, apoi revino la publicarea proiectului.</p><Link to="/dashboard" className="mt-4 inline-flex bg-fm-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-fm-graphite">Înapoi la dashboard</Link></Card>
    </PageShell>
  );

  return (
    <PageShell title="Postează un proiect" subtitle="Adaugă proiectul în lista ta și completează cerințele pentru freelanceri.">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Card className="p-4 sm:p-6">
          <form onSubmit={submit} className="grid gap-5" noValidate>
            <Field label="Titlu" error={errors.title}><Text value={f.title} onChange={set('title')} placeholder="ex. Website pentru cafenea" /></Field>
            <Field label="Descriere" error={errors.description} hint={`${f.description.length} caractere`}><Textarea rows={7} value={f.description} onChange={set('description')} placeholder="Ce ai nevoie, pentru cine, în cât timp și ce buget ai în minte…" /></Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Categorie"><Select options={categories} value={f.category} onChange={set('category')} /></Field>
              <Field label="Termen"><Text type="date" value={f.deadline} onChange={set('deadline')} /></Field>
              <Field label="Buget minim (lei)" error={errors.budget}><Text type="number" min="0" value={f.budgetMin} onChange={set('budgetMin')} /></Field>
              <Field label="Buget maxim (lei)"><Text type="number" min="0" value={f.budgetMax} onChange={set('budgetMax')} /></Field>
            </div>
            <Field label="Abilități (opțional)"><div className="mt-2"><SkillPicker options={skills} value={f.skills} onChange={(v) => setF({ ...f, skills: v })} /></div></Field>
            <div className="flex justify-end gap-2 border-t border-fm-ink/10 pt-5">
              <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Anulează</Button>
              <Button type="submit" loading={loading}>Postează proiectul</Button>
            </div>
          </form>
        </Card>
        <aside className="fm-dark h-fit rounded-lg bg-fm-ink p-5 text-white">
          <p className="flex items-center gap-2 text-sm font-semibold"><Icon name="sparkle" className="h-4 w-4" /> Cum funcționează</p>
          <ul className="mt-4 space-y-3 text-sm text-white/75">{tips.map((t) => <li key={t} className="flex gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0" />{t}</li>)}</ul>
        </aside>
      </div>
    </PageShell>
  );
}
