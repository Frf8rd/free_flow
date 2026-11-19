import type { ReactNode } from "react";

import { PublicNavbar } from "./PublicNavbar";
import { PublicFooter } from "./PublicFooter";

export function PublicLayout({ children, footer = true }: { children: ReactNode; footer?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#continut"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Sari la conținut
      </a>
      <PublicNavbar />
      <main id="continut" className="flex-1">
        {children}
      </main>
      {footer && <PublicFooter />}
    </div>
  );
}
