import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Brand } from "./Brand";
import { ThemeSwitch } from "./ThemeSwitch";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useI18n } from "@/i18n";

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const links = [
    { label: t("nav.how"), hash: "cum-functioneaza" },
    { label: t("nav.clients"), hash: "pentru-clienti" },
    { label: t("nav.freelancers"), hash: "pentru-freelanceri" },
  ] as const;

  return (
    <header className="glass sticky top-0 z-40 border-b border-border/70">
      <nav aria-label={t("nav.primary")} className="mx-auto flex h-18 max-w-7xl items-center gap-6 px-5 py-3 md:px-8">
        <Brand />

        <ul className="ml-6 hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <li key={l.hash}>
              <Link
                to="/"
                hash={l.hash}
                className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-selected hover:text-foreground"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <LanguageSwitcher />
          <ThemeSwitch size="sm" />
          <Button variant="ghost" asChild>
            <Link to="/login">{t("nav.login")}</Link>
          </Button>
          <Button asChild>
            <Link to="/register">{t("nav.register")}</Link>
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="ml-auto lg:hidden" aria-label={t("nav.openMenu")}>
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="flex w-[86%] max-w-sm flex-col gap-6 border-border bg-panel">
            <SheetTitle className="sr-only">{t("nav.menu")}</SheetTitle>
            <SheetDescription className="sr-only">{t("nav.publicDescription")}</SheetDescription>
            <Brand />
            <ul className="flex flex-col gap-1">
              {links.map((l) => (
                <li key={l.hash}>
                  <Link
                    to="/"
                    hash={l.hash}
                    onClick={() => setOpen(false)}
                    className="flex min-h-12 items-center rounded-[var(--radius-item)] px-4 font-medium transition-colors hover:bg-selected"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-col gap-3">
              <LanguageSwitcher />
              <ThemeSwitch />
              <Button variant="outline" asChild>
                <Link to="/login" onClick={() => setOpen(false)}>{t("nav.login")}</Link>
              </Button>
              <Button asChild>
                <Link to="/register" onClick={() => setOpen(false)}>{t("nav.register")}</Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
