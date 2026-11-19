import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

export function BrandDot({ className }: { className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2.5 rounded-full bg-coral", className)} />;
}

export function Brand({ to = "/", className, compact }: { to?: "/" | "/dashboard"; className?: string; compact?: boolean }) {
  return (
    <Link
      to={to}
      aria-label="FairMatch — pagina principală"
      className={cn("inline-flex min-h-11 items-center gap-2.5 rounded-full", className)}
    >
      <BrandDot />
      {!compact && <span className="font-display text-xl leading-none">FairMatch</span>}
    </Link>
  );
}
