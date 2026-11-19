import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[110px] w-full rounded-[var(--radius-input)] border border-border bg-inset px-4 py-3 text-[15px] text-foreground transition-[border-color] duration-200 placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring focus-visible:border-primary aria-[invalid=true]:border-destructive disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
