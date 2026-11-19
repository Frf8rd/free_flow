import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Menu } from "lucide-react";

import { pageTitles } from "@/lib/navigation";
import { useSidebarStore } from "@/store/sidebar";
import { NotificationsButton } from "./NotificationsButton";

export function AppTopbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const title = pageTitles[pathname] ?? "Pagină";

  return (
    <header className="flex h-[76px] items-center gap-3 px-5 pt-4 md:px-8 lg:pl-0">
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Deschide meniul"
        className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-border bg-panel text-foreground transition-colors hover:bg-selected lg:hidden"
      >
        <Menu className="size-[18px]" />
      </button>
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-sm">
          <li>
            <Link to="/dashboard" className="rounded-md text-muted-foreground transition-colors hover:text-foreground">
              FairMatch
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="size-3.5 text-muted-foreground" />
          </li>
          <li aria-current="page" className="font-semibold">
            {title}
          </li>
        </ol>
      </nav>
      <div className="ml-auto">
        <NotificationsButton />
      </div>
    </header>
  );
}
