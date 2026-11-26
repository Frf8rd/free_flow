import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell.jsx';
import Icon from '../components/ui/Icon.jsx';

const steps = [
  { n: '01', title: 'Descrii proiectul', text: 'Adaugi cerințele, bugetul și termenul. Abilitățile pot fi alese din catalog sau deduse din descriere.' },
  { n: '02', title: 'Primești potriviri explicate', text: 'Vezi o selecție scurtă de profiluri relevante și motivele potrivirii. Recenziile au o pondere limitată.' },
  { n: '03', title: 'Discutați și colaborați', text: 'Clientul poate invita, iar freelancerul își poate arăta interesul. După acceptare, conversația și starea colaborării rămân în platformă.' },
];

const factors = [
  ['Competențe', 'Potrivirea abilităților profilului cu cerințele proiectului.'],
  ['Portofoliu', 'Exemple de lucru relevante pentru cerere.'],
  ['Buget și termen', 'Compatibilitatea bugetului și a termenului cu profilul.'],
  ['Disponibilitate și nivel', 'Dacă freelancerul poate prelua proiectul și dacă nivelul corespunde.'],
];

export default function HowItWorks() {
  return <PageShell title="Cum funcționează" subtitle="FairMatch pune în legătură proiectele cu freelancerii potriviți și explică recomandările." >
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.8fr)] xl:gap-12">
      <section aria-labelledby="steps-title">
        <h2 id="steps-title" className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-fm-slate/60">De la cerere la colaborare</h2>
        <ol className="divide-y divide-fm-ink/10 border-y border-fm-ink/10">
          {steps.map((step) => <li key={step.n} className="grid gap-2 py-5 sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-4 sm:py-6">
            <span className="text-sm font-semibold tabular-nums text-fm-accent">{step.n}</span>
            <div><h3 className="font-semibold text-fm-ink">{step.title}</h3><p className="mt-1.5 max-w-2xl text-sm leading-6 text-fm-slate/75">{step.text}</p></div>
          </li>)}
        </ol>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/register" className="inline-flex min-h-11 items-center gap-2 bg-fm-ink px-5 text-sm font-semibold text-white hover:bg-fm-graphite">Creează un cont <Icon name="arrow" className="h-4 w-4" /></Link>
          <Link to="/browse" className="inline-flex min-h-11 items-center border border-fm-graphite/20 px-5 text-sm font-semibold text-fm-ink hover:bg-fm-mist/60">Explorează</Link>
        </div>
      </section>

      <aside className="h-fit border-t-2 border-fm-accent-solid pt-4 xl:border-l xl:border-t-0 xl:border-fm-ink/10 xl:pl-7 xl:pt-0">
        <h2 className="text-lg font-semibold text-fm-ink">Ce intră în potrivire</h2>
        <p className="mt-1 text-sm leading-6 text-fm-slate/70">Scorul este însoțit de motive concrete; istoricul de recenzii nu decide singur ordinea.</p>
        <dl className="mt-4 divide-y divide-fm-ink/10 border-y border-fm-ink/10">
          {factors.map(([title, text]) => <div key={title} className="py-3"><dt className="text-sm font-semibold text-fm-ink">{title}</dt><dd className="mt-1 text-sm leading-5 text-fm-slate/70">{text}</dd></div>)}
        </dl>
        <p className="mt-4 text-xs leading-5 text-fm-slate/60">FairMatch facilitează descoperirea, comunicarea și urmărirea colaborării. Plata prin platformă nu este disponibilă în această versiune.</p>
      </aside>
    </div>
  </PageShell>;
}
