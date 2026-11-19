import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="max-w-md text-center animate-fade-up">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
          <Compass className="size-6" aria-hidden />
        </span>
        <p className="section-label mt-6">Eroare 404</p>
        <h1 className="mt-3 text-4xl">Pagina nu există</h1>
        <p className="mt-3 text-muted-foreground">Linkul poate fi greșit sau pagina a fost mutată.</p>
        <Button asChild className="mt-8">
          <Link to="/">Înapoi la pagina principală</Link>
        </Button>
      </div>
    </div>
  );
}
