import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageHeader({
  label,
  title,
  text,
  action,
}: {
  label?: string;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {label && <p className="section-label">{label}</p>}
        <h1 className="mt-3 text-4xl md:text-5xl">{title}</h1>
        {text && <p className="mt-2 max-w-2xl text-muted-foreground">{text}</p>}
      </div>
      {action}
    </header>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  text,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  text?: string | undefined;
  action?: ReactNode;
}) {
  return (
    <div className="surface-card flex flex-col items-center px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="mt-4 font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-small text-muted-foreground">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  onRetry,
  text = "Nu am putut încărca datele. Verifică conexiunea și încearcă din nou.",
}: {
  onRetry?: () => void;
  text?: string;
}) {
  return (
    <div role="alert" className="surface-card flex flex-col items-center px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" aria-hidden />
      </span>
      <p className="mt-4 font-semibold">Ceva n-a mers bine</p>
      <p className="mt-1 max-w-sm text-small text-muted-foreground">{text}</p>
      {onRetry && (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          Reîncearcă
        </Button>
      )}
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("surface-card p-5", className)}>
      <div className="flex items-center justify-between">
        <p className="text-small text-muted-foreground">{label}</p>
        <span className="flex size-9 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl leading-none">{value}</p>
      {hint && <p className="mt-2 text-small text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Bar({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="flex justify-between text-small">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <div
        className="mt-1 h-2 overflow-hidden rounded-full bg-inset"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-gradient-progress transition-[width] duration-700"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
