import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebar";
import { useCommandShortcut } from "@/hooks/use-command-shortcut";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarContent } from "./AppSidebar";
import { AppTopbar } from "./AppTopbar";
import { CommandPalette } from "./CommandPalette";

export function AppLayout({ children }: { children: ReactNode }) {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const mobileOpen = useSidebarStore((s) => s.mobileOpen);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useCommandShortcut();

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen">
        <aside
          aria-label="Bară laterală"
          className={cn(
            "fixed bottom-4 left-4 top-4 z-30 hidden overflow-hidden rounded-[var(--radius-sidebar)] border border-border bg-panel shadow-soft transition-[width] duration-250 ease-out lg:block",
            collapsed ? "w-[var(--sidebar-rail)]" : "w-[var(--sidebar-w)]",
          )}
        >
          <SidebarContent collapsed={collapsed} />
        </aside>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="w-auto max-w-none border-0 bg-transparent p-3 shadow-none sm:max-w-none [&>button]:hidden"
          >
            <SheetTitle className="sr-only">Meniu</SheetTitle>
            <SheetDescription className="sr-only">Navigare în aplicație</SheetDescription>
            <div className="h-full w-[min(var(--sidebar-w),calc(100vw-2rem))] overflow-hidden rounded-[var(--radius-sidebar)] border border-border bg-panel shadow-float">
              <SidebarContent mobile />
            </div>
          </SheetContent>
        </Sheet>

        <div
          className={cn(
            "transition-[padding] duration-250 ease-out",
            collapsed ? "lg:pl-[calc(var(--sidebar-rail)+2rem)]" : "lg:pl-[calc(var(--sidebar-w)+2rem)]",
          )}
        >
          <AppTopbar />
          <main id="continut" key={pathname} className="animate-fade-up px-5 pb-16 pt-4 md:px-8 lg:pl-0">
            {children}
          </main>
        </div>

        <CommandPalette />
      </div>
    </TooltipProvider>
  );
}
