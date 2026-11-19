import type { ReactNode } from "react";

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="relative flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden px-5 py-14">
      <div aria-hidden className="bg-hero-glow pointer-events-none absolute inset-0" />
      <div className="relative w-full max-w-md animate-fade-up">
        <div className="surface-card p-7 md:p-9">
          <h1 className="text-3xl md:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </div>
  );
}
