import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ThemePreference = "light" | "dark" | "system";

/** Must match the key read by the inline pre-paint script in __root.tsx. */
export const THEME_STORAGE_KEY = "fairmatch-theme";

interface ThemeState {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "dark",
      setTheme: (theme) => set({ theme }),
    }),
    { name: THEME_STORAGE_KEY, storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);
