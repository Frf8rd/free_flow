import { useEffect } from "react";

import { useThemeStore } from "@/store/theme";
import { useStoresHydrated } from "@/store/hydration";

/** Syncs the <html> class with the saved preference and the OS setting when "system" is chosen. */
export function useApplyTheme() {
  const theme = useThemeStore((s) => s.theme);
  const hydrated = useStoresHydrated();

  useEffect(() => {
    if (!hydrated) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && media.matches);
      document.documentElement.classList.toggle("dark", dark);
    };
    apply();
    if (theme !== "system") return;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme, hydrated]);
}
