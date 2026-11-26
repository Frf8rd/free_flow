import PageShell from '../components/layout/PageShell.jsx';
import { Card } from '../components/ui/Kit.jsx';
import Icon from '../components/ui/Icon.jsx';
import { config } from '../config.js';

export default function Contact() {
  const configured = config.contactEmail && !config.contactEmail.endsWith('.example');
  return (
    <PageShell title="Contact" subtitle="Date de contact și raportarea conținutului." >
      <div className="grid gap-8 md:grid-cols-2">
        <section className="border-t-2 border-fm-accent-solid pt-4">
          <h2 className="font-semibold text-fm-ink">Asistență</h2>
          {configured ? <a href={`mailto:${config.contactEmail}`} className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-fm-accent hover:underline"><Icon name="mail" className="h-4 w-4" />{config.contactEmail}</a> : <p className="mt-2 text-sm text-fm-slate/70">Adresa de contact nu este configurată.</p>}
        </section>
        <section className="border-t border-fm-ink/15 pt-4">
          <h2 className="font-semibold text-fm-ink">Raportări</h2>
          <p className="mt-2 text-sm leading-6 text-fm-slate/70">Folosește „Raportează” pe profil, proiect sau mesaj pentru a trimite o sesizare.</p>
        </section>
      </div>
    </PageShell>
  );
}
