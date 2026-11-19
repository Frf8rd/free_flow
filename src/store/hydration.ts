import { create } from "zustand";

/** Persisted stores skip auto-hydration (SSR safety); this flag flips once they've read localStorage. */
export const useHydrationStore = create<{ hydrated: boolean; setHydrated: () => void }>((set) => ({
  hydrated: false,
  setHydrated: () => set({ hydrated: true }),
}));

export const useStoresHydrated = () => useHydrationStore((s) => s.hydrated);
