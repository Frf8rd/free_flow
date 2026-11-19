import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SidebarState {
  collapsed: boolean;
  mobileOpen: boolean;
  quickActionsOpen: boolean;
  projectsOpen: boolean;
  commandOpen: boolean;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
  toggleQuickActions: () => void;
  setQuickActionsOpen: (open: boolean) => void;
  toggleProjects: () => void;
  setCommandOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      mobileOpen: false,
      quickActionsOpen: false,
      projectsOpen: true,
      commandOpen: false,
      toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed, quickActionsOpen: false })),
      setMobileOpen: (mobileOpen) => set({ mobileOpen }),
      toggleQuickActions: () => set((s) => ({ quickActionsOpen: !s.quickActionsOpen })),
      setQuickActionsOpen: (quickActionsOpen) => set({ quickActionsOpen }),
      toggleProjects: () => set((s) => ({ projectsOpen: !s.projectsOpen })),
      setCommandOpen: (commandOpen) => set({ commandOpen }),
    }),
    {
      name: "fairmatch-sidebar",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ collapsed: s.collapsed, projectsOpen: s.projectsOpen }),
    },
  ),
);
