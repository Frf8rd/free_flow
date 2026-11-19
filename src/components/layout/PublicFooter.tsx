import { Link } from "@tanstack/react-router";

import { Brand } from "./Brand";
import { useI18n } from "@/i18n";

export function PublicFooter() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
        <div className="max-w-xs">
          <Brand />
          <p className="mt-3 text-small text-muted-foreground">
            {t("footer.description")}
          </p>
        </div>
        <FooterCol title={t("footer.product")}>
          <FooterLink to="/browse">{t("nav.browse")}</FooterLink>
        </FooterCol>
        <FooterCol title="Începe">
          <FooterLink to="/register">{t("nav.register")}</FooterLink>
          <FooterLink to="/login">{t("nav.login")}</FooterLink>
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
