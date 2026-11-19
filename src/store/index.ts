import { useAuthStore } from "./auth";
import { useThemeStore } from "./theme";
import { useSidebarStore } from "./sidebar";
import { useHydrationStore } from "./hydration";

export { useAuthStore, useThemeStore, useSidebarStore };
export { useStoresHydrated } from "./hydration";

/** Call once on the client after mount. */
export async function rehydrateStores() {
  await Promise.all([
    useAuthStore.persist.rehydrate(),
    useThemeStore.persist.rehydrate(),
    useSidebarStore.persist.rehydrate(),
  ]);
  useHydrationStore.getState().setHydrated();
}
