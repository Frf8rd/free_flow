import { Hammer } from "lucide-react";

/** Honest placeholder for sections built in the next part. */
export function PlaceholderPage({ title, text }: { title: string; text: string }) {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-4xl">{title}</h1>
      <p className="mt-2 text-muted-foreground">{text}</p>
      <div className="surface-card mt-8 flex flex-col items-center px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
          <Hammer className="size-5" aria-hidden />
        </span>
        <p className="mt-4 font-semibold">Secțiune în lucru</p>
        <p className="mt-1 max-w-sm text-small text-muted-foreground">Această pagină va fi construită în etapa următoare.</p>
      </div>
    </div>
  );
}
