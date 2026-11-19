import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Menu } from "lucide-react";

import { pageTitles } from "@/lib/navigation";
import { useSidebarStore } from "@/store/sidebar";
import { BrandMark } from "./Brand";
import { NotificationsButton } from "./NotificationsButton";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useI18n } from "@/i18n";

export function AppTopbar() {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const titles: Record<string, string> = {
    "/dashboard": t("app.dashboard"),
    "/matches": t("app.matches"),
    "/projects/active": `${t("app.projects")} ${t("app.active")}`,
    "/projects/archive": `${t("app.archive")} ${t("app.projects").toLowerCase()}`,
    "/projects/new": t("app.quickPost"),
    "/messages": t("app.messages"),
    "/collaborations": t("app.collaborations"),
    "/portfolio": t("app.portfolio"),
    "/settings": t("app.settings"),
    "/admin": t("app.admin"),
  };
  const title = titles[pathname] ?? pageTitles[pathname] ?? t("app.page");

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
            <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-md text-muted-foreground transition-colors hover:text-foreground">
              <BrandMark className="size-6 rounded-sm" />
              <span className="text-xs font-bold tracking-wider">FAIRMATCH</span>
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
      <div className="ml-auto flex items-center gap-2">
        <LanguageSwitcher compact />
        <NotificationsButton />
      </div>
    </header>
  );
}
