import { Link } from 'react-router-dom';
import Footer from '../components/layout/Footer.jsx';
import Logo from '../components/ui/Logo.jsx';
import Icon from '../components/ui/Icon.jsx';
import ThemeToggle from '../components/ui/ThemeToggle.jsx';

const paths = [
  {
    icon: 'filePlus',
    audience: 'Pentru clienți',
    title: 'Ai nevoie de un freelancer?',
    text: 'Publică proiectul cu cerințe, buget și termen. Compară profilurile recomandate și invită freelancerii cu care vrei să discuți.',
    action: 'Postează un proiect',
    to: '/projects/new',
  },
  {
    icon: 'search',
    audience: 'Pentru freelanceri',
    title: 'Cauți următorul proiect?',
    text: 'Adaugă competențele și exemplele de lucru în profil. În catalog, alege secțiunea Proiecte ca să vezi ce poți prelua.',
    action: 'Deschide catalogul',
    to: '/browse',
  },
];

const steps = [
  { icon: 'briefcase', title: 'Proiect și profil', text: 'Clientul spune ce are nevoie. Freelancerul își adaugă competențele și portofoliul.' },
  { icon: 'sparkle', title: 'Recomandări explicate', text: 'Vezi de ce un profil se potrivește cu proiectul.' },
  { icon: 'chat', title: 'Discuție și colaborare', text: 'După acceptare, discuți și urmărești stadiul colaborării în platformă.' },
];

const factors = [
  { icon: 'check', title: 'Competențe', text: 'Abilitățile din profil în raport cu cerințele proiectului.' },
  { icon: 'folder', title: 'Portofoliu', text: 'Exemple de lucru relevante pentru ce trebuie realizat.' },
  { icon: 'calendar', title: 'Buget, termen și disponibilitate', text: 'Dacă bugetul și termenul se potrivesc cu profilul și dacă freelancerul poate prelua proiectul.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-fm-page text-fm-ink">
      <header className="border-b border-fm-ink/10 bg-white">
        <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2 sm:px-6">
          <Logo className="!gap-1.5 [&>img]:h-7 [&>img]:w-7 sm:!gap-2.5 sm:[&>img]:h-8 sm:[&>img]:w-8" />
          <nav className="ml-auto flex flex-wrap items-center justify-end gap-1 sm:ml-0 sm:gap-2" aria-label="Principal">
            <Link to="/how-it-works" className="hidden px-3 py-2 text-sm font-medium hover:bg-fm-mist/30 md:block">Cum funcționează</Link>
            <ThemeToggle />
            <Link to="/login" className="whitespace-nowrap px-2 py-2.5 text-sm font-semibold hover:bg-fm-mist/30 sm:px-3">Intră<span className="hidden sm:inline"> în cont</span></Link>
            <Link to="/register" className="whitespace-nowrap bg-indigo-700 px-2.5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600 sm:px-4">Creează cont</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-6 sm:space-y-16 sm:px-6 sm:py-10">
        <section aria-labelledby="landing-title" className="relative isolate overflow-hidden border border-white/10 bg-slate-950 text-white">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(79,70,229,0.34),transparent_65%)]" />
          <div className="grid gap-8 p-5 sm:p-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.9fr)] lg:items-center lg:gap-12 lg:p-12">
            <div>
              <h1 id="landing-title" className="max-w-xl text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">Găsește proiecte și oameni potriviți</h1>
              <p className="mt-4 max-w-lg text-base leading-7 text-slate-300 sm:mt-5 sm:text-lg">Cu același cont poți publica un proiect sau lucra ca freelancer. FairMatch îți arată de ce o recomandare se potrivește cu proiectul.</p>
              <div className="mt-6 flex flex-wrap justify-end gap-3 sm:mt-8 sm:justify-start">
                <Link to="/register" className="inline-flex min-h-11 items-center gap-2 bg-indigo-300 px-4 text-sm font-semibold text-slate-950 hover:bg-indigo-200 sm:px-5">Creează cont <Icon name="arrow" className="h-4 w-4" /></Link>
                <Link to="/browse" className="inline-flex min-h-11 items-center border border-white/25 px-4 text-sm font-semibold hover:bg-white/10 sm:px-5">Explorează catalogul</Link>
              </div>
            </div>

            <div className="border border-white/20 bg-slate-950/60 p-4 sm:p-6">
              <h2 className="text-lg font-semibold">Cum ajungi la o colaborare</h2>
              <ol className="mt-3 divide-y divide-white/10">
                {steps.map((step) => (
                  <li key={step.title} className="flex gap-3 py-3 last:pb-0">
                    <span className="grid h-9 w-9 shrink-0 place-items-center bg-indigo-300/10 text-indigo-200">
                      <Icon name={step.icon} className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold">{step.title}</h3>
                      <p className="mt-1 text-sm leading-5 text-slate-300">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section aria-labelledby="landing-paths-title">
          <h2 id="landing-paths-title" className="text-2xl font-bold tracking-tight sm:text-3xl">Ce poți face pe FairMatch</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {paths.map((path) => (
              <article key={path.title} className="flex flex-col items-start border border-fm-ink/10 bg-white p-5 sm:p-7">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center bg-fm-accent/10 text-fm-accent"><Icon name={path.icon} /></span>
                  <p className="text-sm font-semibold text-fm-accent">{path.audience}</p>
                </div>
                <h3 className="mt-4 text-xl font-semibold tracking-tight">{path.title}</h3>
                <p className="mb-5 mt-2 text-sm leading-6 text-fm-slate/80 sm:text-base">{path.text}</p>
                <Link to={path.to} className="group mt-auto inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-fm-accent hover:underline">
                  {path.action} <Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="landing-matching-title" className="grid gap-6 border-t border-fm-ink/10 pt-7 sm:pt-9 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-12">
          <div>
            <h2 id="landing-matching-title" className="text-2xl font-bold tracking-tight sm:text-3xl">Cum sunt alese recomandările</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-fm-slate/80 sm:text-base">Fiecare recomandare explică ce se potrivește. Recenziile sunt doar unul dintre criterii.</p>
            <Link to="/how-it-works" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-fm-accent hover:underline">
              Vezi cum funcționează potrivirea <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
          <dl className="divide-y divide-fm-ink/10 border-y border-fm-ink/10">
            {factors.map((factor) => (
              <div key={factor.title} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 py-3.5">
                <Icon name={factor.icon} className="row-span-2 mt-0.5 h-5 w-5 text-fm-accent" />
                <dt className="text-sm font-semibold">{factor.title}</dt>
                <dd className="text-sm leading-5 text-fm-slate/80">{factor.text}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      <Footer />
    </div>
  );
}
