import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold cursor-pointer transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-border bg-transparent text-foreground hover:bg-selected",
        secondary: "bg-selected text-foreground hover:bg-selected/70",
        soft: "bg-primary-soft text-primary-soft-foreground hover:bg-primary-soft/80",
        ghost: "text-foreground hover:bg-selected",
        link: "text-primary underline-offset-4 hover:underline rounded-md",
        onGradient:
          "bg-on-gradient text-primary hover:bg-on-gradient/90",
        onGradientOutline:
          "border border-on-gradient/40 text-on-gradient hover:bg-on-gradient/10",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-small",
        lg: "h-12 px-7 text-[15px]",
        icon: "h-11 w-11",
        iconSm: "h-8 w-8 rounded-[10px] [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
