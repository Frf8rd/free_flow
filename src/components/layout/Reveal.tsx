import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { useReveal } from "@/hooks/use-reveal";

export function Reveal({
  as: Tag = "section",
  className,
  children,
  id,
  ...rest
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  id?: string;
  "aria-labelledby"?: string;
}) {
  const ref = useReveal<HTMLElement>();
  return (
    <Tag ref={ref} id={id} className={cn("reveal", className)} {...rest}>
      {children}
    </Tag>
  );
}
