import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn("shimmer rounded-[var(--radius-item)]", className)} {...props} />;
}

export { Skeleton };
