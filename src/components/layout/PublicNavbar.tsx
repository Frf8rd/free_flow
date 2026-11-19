import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Brand } from "./Brand";
import { ThemeSwitch } from "./ThemeSwitch";

const links = [
  { label: "Cum funcționează", hash: "cum-functioneaza" },
  { label: "Pentru clienți", hash: "pentru-clienti" },
  { label: "Pentru freelanceri", hash: "pentru-freelanceri" },
] as const;

export function PublicNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="glass sticky top-0 z-40 border-b border-border/70">
      <nav aria-label="Navigare principală" className="mx-auto flex h-18 max-w-7xl items-center gap-6 px-5 py-3 md:px-8">
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
          <ThemeSwitch size="sm" />
          <Button variant="ghost" asChild>
            <Link to="/login">Autentificare</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Creează cont</Link>
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="ml-auto lg:hidden" aria-label="Deschide meniul">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="flex w-[86%] max-w-sm flex-col gap-6 border-border bg-panel">
            <SheetTitle className="sr-only">Meniu</SheetTitle>
            <SheetDescription className="sr-only">Navigare FairMatch</SheetDescription>
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
              <ThemeSwitch />
              <Button variant="outline" asChild>
                <Link to="/login" onClick={() => setOpen(false)}>Autentificare</Link>
              </Button>
              <Button asChild>
                <Link to="/register" onClick={() => setOpen(false)}>Creează cont</Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
