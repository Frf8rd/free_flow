import { Link } from "@tanstack/react-router";

import { Brand } from "./Brand";

export function PublicFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8">
        <div className="max-w-xs">
          <Brand />
          <p className="mt-3 text-small text-muted-foreground">
            Platforma de freelancing unde câștigă cel mai potrivit, nu cel mai cunoscut.
          </p>
        </div>
        <FooterCol title="Produs">
          <FooterLink to="/" hash="cum-functioneaza">Cum funcționează</FooterLink>
          <FooterLink to="/" hash="echitate">Echitate prin design</FooterLink>
          <FooterLink to="/" hash="trepte">Treptele de încredere</FooterLink>
          <FooterLink to="/browse">Explorează freelanceri</FooterLink>
        </FooterCol>
        <FooterCol title="Începe">
          <FooterLink to="/" hash="pentru-clienti">Pentru clienți</FooterLink>
          <FooterLink to="/" hash="pentru-freelanceri">Pentru freelanceri</FooterLink>
          <FooterLink to="/register">Creează cont</FooterLink>
          <FooterLink to="/login">Autentificare</FooterLink>
        </FooterCol>
        <FooterCol title="Ajutor">
          <FooterLink to="/" hash="intrebari">Întrebări frecvente</FooterLink>
        </FooterCol>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-small text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
          <p>© {new Date().getFullYear()} FairMatch. Toate drepturile rezervate.</p>
          <p>Banii nu cumpără poziția în rezultate.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="section-label">{title}</p>
      <ul className="mt-4 flex flex-col gap-1">{children}</ul>
    </div>
  );
}

function FooterLink({ to, hash, children }: { to: "/" | "/browse" | "/register" | "/login"; hash?: string; children: React.ReactNode }) {
  return (
    <li>
      <Link to={to} {...(hash ? { hash } : {})} className="inline-flex min-h-9 items-center rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground">
        {children}
      </Link>
    </li>
  );
}
