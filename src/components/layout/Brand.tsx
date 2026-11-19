import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src="/fairmatch-mark.png"
      alt=""
      aria-hidden="true"
      className={cn("size-9 shrink-0 rounded-md object-cover", className)}
    />
  );
}

export function Brand({ to = "/", className, compact }: { to?: "/" | "/dashboard"; className?: string; compact?: boolean }) {
  return (
    <Link
      to={to}
      aria-label="FairMatch — pagina principală"
      className={cn("inline-flex min-h-11 items-center gap-2.5 rounded-full", className)}
    >
      <BrandMark />
      {!compact && <span className="font-sans text-sm font-bold tracking-[0.12em]">FAIRMATCH</span>}
    </Link>
  );
}
