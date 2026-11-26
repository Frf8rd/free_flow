import { Link } from 'react-router-dom';
import Logo from '../components/ui/Logo.jsx';
import Icon from '../components/ui/Icon.jsx';
import ThemeToggle from '../components/ui/ThemeToggle.jsx';

const paths = [
  { icon: 'search', title: 'Găsește proiecte', text: 'Explorează proiecte și vezi potrivirile pentru profilul tău.', to: '/browse' },
  { icon: 'filePlus', title: 'Postează un proiect', text: 'Descrie ce ai nevoie și găsește freelancerul potrivit.', to: '/projects/new' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-fm-page text-fm-ink">
      <header className="fm-dark border-b border-white/10 bg-fm-ink text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Logo dark />
          <nav className="flex items-center gap-2 sm:gap-4" aria-label="Principal">
            <ThemeToggle className="text-white hover:!bg-white/10" />
            <Link to="/login" className="px-3 py-2 text-sm font-semibold text-white/80 hover:text-white">Autentificare</Link>
            <Link to="/register" className="bg-fm-mist px-4 py-2.5 text-sm font-semibold text-fm-ink hover:bg-white">Creează cont</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
        <section className="fm-dark relative overflow-hidden bg-fm-ink px-6 py-10 text-white sm:px-10 sm:py-14">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 bg-fm-graphite/30 blur-3xl" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">FairMatch</p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">Nu cel mai cunoscut. Cel mai potrivit.</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70">Un singur cont pentru a găsi proiecte și a colabora cu freelanceri.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/register" className="inline-flex items-center gap-2 bg-fm-mist px-5 py-3 text-sm font-semibold text-fm-ink hover:bg-white">Începe acum <Icon name="arrow" className="h-4 w-4" /></Link>
              <Link to="/login" className="border border-white/25 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Am deja cont</Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-px border border-fm-ink/10 bg-fm-ink/10 md:grid-cols-2" aria-label="Ce poți face">
          {paths.map((path) => (
            <Link key={path.title} to={path.to} className="group flex min-h-36 items-start gap-4 bg-fm-page p-5 transition-colors hover:bg-fm-mist/30 sm:p-7">
              <span className="grid h-10 w-10 shrink-0 place-items-center bg-fm-ink text-white"><Icon name={path.icon} className="h-5 w-5" /></span>
              <span><span className="block text-base font-semibold">{path.title}</span><span className="mt-1 block text-sm leading-relaxed text-fm-slate/70">{path.text}</span></span>
              <Icon name="arrow" className="ml-auto h-4 w-4 shrink-0 text-fm-slate/50 transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
