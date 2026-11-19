import { Monitor, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { useThemeStore, type ThemePreference } from "@/store/theme";

const options: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Temă luminoasă", icon: Sun },
  { value: "dark", label: "Temă întunecată", icon: Moon },
  { value: "system", label: "Temă după sistem", icon: Monitor },
];

/** 3-way segmented switch: Light / Dark / System. */
export function ThemeSwitch({ className, size = "md" }: { className?: string; size?: "sm" | "md" }) {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <div
      role="radiogroup"
      aria-label="Temă"
      className={cn("flex items-center gap-1 rounded-full border border-border bg-inset p-1", className)}
    >
      {options.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:text-foreground",
              size === "sm" ? "h-9 w-9" : "h-9 min-w-11",
              active && "bg-selected text-primary shadow-soft",
            )}
          >
            <Icon className="size-4" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}

const fallback = { value: "dark" as ThemePreference, label: "Temă întunecată", icon: Moon };

/** Single button that cycles through the three themes (used in the collapsed sidebar rail). */
export function ThemeCycleButton({ className }: { className?: string }) {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const index = options.findIndex((o) => o.value === theme);
  const current = options[index] ?? fallback;
  const next = options[(index + 1) % options.length] ?? fallback;
  const Icon = current.icon;

  return (
    <button
      type="button"
      onClick={() => setTheme(next.value)}
      aria-label={`${current.label}. Schimbă în: ${next.label.toLowerCase()}`}
      className={cn(
        "flex size-11 cursor-pointer items-center justify-center rounded-full border border-border bg-inset text-primary transition-colors hover:bg-selected",
        className,
      )}
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}
