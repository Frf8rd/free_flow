import { useEffect } from "react";

import { useSidebarStore } from "@/store/sidebar";

/** Ctrl/Cmd + K toggles the command palette. */
export function useCommandShortcut() {
  const setOpen = useSidebarStore((s) => s.setCommandOpen);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!useSidebarStore.getState().commandOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);
}
