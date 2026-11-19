import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-[var(--radius-input)] border border-border bg-inset px-4 py-2 text-[15px] text-foreground transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground hover:border-muted-foreground/40 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring focus-visible:border-primary aria-[invalid=true]:border-destructive disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
