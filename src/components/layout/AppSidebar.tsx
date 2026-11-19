import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronDown, ChevronLeft, ChevronRight, LogOut, Plus, Search, Settings, ShieldCheck, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { initials, roleLabel } from "@/lib/format";
import { navLabel, quickActions, visibleNav, type NavItem } from "@/lib/navigation";
import { useAuthStore } from "@/store/auth";
import { useSidebarStore } from "@/store/sidebar";
import { useSidebarCounts } from "@/hooks/use-queries";
import { tierName } from "@/mocks/tiers";
import type { SidebarCounts, User } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BrandMark } from "./Brand";
import { ThemeCycleButton, ThemeSwitch } from "./ThemeSwitch";
import { useI18n } from "@/i18n";

interface SidebarContentProps {
  collapsed?: boolean;
  /** Rendered inside the mobile drawer. */
  mobile?: boolean;
}

/** Shows a tooltip to the right only when the rail is collapsed. */
function RailTip({ show, label, children }: { show: boolean; label: string; children: ReactNode }) {
  if (!show) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={12}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

const itemBase =
  "group relative flex min-h-11 items-center gap-3 rounded-[var(--radius-item)] px-3.5 py-3 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-selected/60 hover:text-foreground data-[status=active]:bg-selected data-[status=active]:text-foreground";
const iconBase = "size-[18px] shrink-0 transition-colors group-data-[status=active]:text-primary";

function quickActionLabel(label: string, t: (key: string) => string) {
  const labels: Record<string, string> = {
    "Completează profilul": t("app.quickProfile"),
    "Adaugă în portofoliu": t("app.quickPortfolio"),
    "Scrie un mesaj": t("app.quickMessage"),
    "Postează proiect": t("app.quickPost"),
    "Invită un freelancer": t("app.quickInvite"),
  };
  return labels[label] ?? label;
}

export function SidebarContent({ collapsed = false, mobile = false }: SidebarContentProps) {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const setCommandOpen = useSidebarStore((s) => s.setCommandOpen);
  const { data: counts } = useSidebarCounts(!!user);

  if (!user) return null;
  const close = () => mobile && setMobileOpen(false);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Brand row */}
      <div className={cn("flex items-center gap-2.5 px-5 pt-5", collapsed && "flex-col px-0")}>
        <Link
          to="/dashboard"
          onClick={close}
          aria-label="FairMatch — Dashboard"
          className={cn("flex min-h-11 items-center gap-2.5 rounded-full", collapsed && "justify-center")}
        >
          <BrandMark />
          {!collapsed && <span className="font-sans text-sm font-bold tracking-[0.12em]">FAIRMATCH</span>}
        </Link>
        {mobile ? (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label={t("app.closeMenu")}
            className="ml-auto flex size-11 cursor-pointer items-center justify-center rounded-[10px] border border-border text-muted-foreground transition-colors hover:bg-selected hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        ) : (
          <RailTip show={collapsed} label={collapsed ? t("app.expandSidebar") : t("app.collapseSidebar")}>
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? t("app.expandSidebar") : t("app.collapseSidebar")}
              aria-expanded={!collapsed}
              className={cn(
                "flex size-8 cursor-pointer items-center justify-center rounded-[10px] border border-border text-muted-foreground transition-colors hover:bg-selected hover:text-foreground",
                !collapsed && "ml-auto",
              )}
            >
              {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            </button>
          </RailTip>
        )}
      </div>

      <div className={cn("flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4 pt-5 [&>*]:shrink-0", collapsed && "items-center px-3")}>
        {/* Search */}
        <RailTip show={collapsed} label={`${t("app.search")} (Ctrl K)`}>
          <button
            type="button"
            onClick={() => {
              close();
              setCommandOpen(true);
            }}
            aria-label={t("app.search")}
            aria-keyshortcuts="Control+K Meta+K"
            className={cn(
              "flex h-11 cursor-pointer items-center gap-2.5 rounded-[var(--radius-input)] border border-border bg-inset text-sm text-muted-foreground transition-colors hover:text-foreground",
              collapsed ? "w-11 justify-center" : "w-full px-3.5",
            )}
          >
            <Search className="size-4 shrink-0" aria-hidden />
            {!collapsed && (
              <>
                <span>{t("app.search")}</span>
                <kbd className="ml-auto rounded-md border border-border bg-panel px-1.5 py-0.5 font-sans text-[11px] font-medium">
                  Ctrl K
                </kbd>
              </>
            )}
          </button>
        </RailTip>

        <ProfileRow user={user} collapsed={collapsed} onNavigate={close} />
        <QuickActions user={user} collapsed={collapsed} onNavigate={close} />

        {/* Navigation */}
        <nav aria-label="Navigare aplicație" className={cn("flex flex-col gap-1", collapsed ? "items-center" : "w-full")}>
          {!collapsed && <p className="section-label px-3.5 pb-1.5">{t("app.overview")}</p>}
          {visibleNav(user.role).map((item) => (
            <NavRow key={item.key} item={item} role={user.role} collapsed={collapsed} counts={counts} onNavigate={close} />
          ))}
        </nav>
      </div>

      {/* Bottom */}
      <div className={cn("flex flex-col gap-3 border-t border-border p-4", collapsed && "items-center px-3")}>
        {user.role === "FREELANCER" && user.tierProgress && <TierCard user={user} collapsed={collapsed} />}
        {collapsed ? <ThemeCycleButton /> : <ThemeSwitch />}
      </div>
    </div>
  );
}

function ProfileRow({ user, collapsed, onNavigate }: { user: User; collapsed: boolean; onNavigate: () => void }) {
  const { t } = useI18n();
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <RailTip show={collapsed} label={`${user.name} · ${roleLabel[user.role]}`}>
        <DropdownMenuTrigger
          aria-label={`Contul tău: ${user.name}, ${roleLabel[user.role]}`}
          className={cn(
            "flex cursor-pointer items-center gap-3 rounded-[var(--radius-item)] text-left transition-colors hover:bg-selected/60",
            collapsed ? "size-11 justify-center rounded-full" : "w-full p-2",
          )}
        >
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-soft-foreground"
          >
            {initials(user.name)}
          </span>
          {!collapsed && (
            <span className="flex min-w-0 flex-col items-start gap-0.5">
              <span className="truncate text-sm font-semibold">{user.name}</span>
              <Badge variant="role">{user.role}</Badge>
            </span>
          )}
          {!collapsed && <ChevronDown className="ml-auto size-4 text-muted-foreground" aria-hidden />}
        </DropdownMenuTrigger>
      </RailTip>
      <DropdownMenuContent side={collapsed ? "right" : "bottom"} align="start" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <span className="block text-sm font-semibold">{user.name}</span>
          <span className="block truncate text-small text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            onNavigate();
            navigate({ to: "/settings" });
          }}
        >
          <Settings /> {t("app.settings")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            logout();
            navigate({ to: "/" });
          }}
        >
          <LogOut /> {t("app.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function QuickActions({ user, collapsed, onNavigate }: { user: User; collapsed: boolean; onNavigate: () => void }) {
  const { t } = useI18n();
  const open = useSidebarStore((s) => s.quickActionsOpen);
  const toggle = useSidebarStore((s) => s.toggleQuickActions);
  const setOpen = useSidebarStore((s) => s.setQuickActionsOpen);
  const navigate = useNavigate();
  const actions = quickActions(user.role);

  if (collapsed) {
    return (
      <DropdownMenu>
        <RailTip show label={t("app.quickActions")}>
          <DropdownMenuTrigger
            aria-label={t("app.quickActions")}
            className="group flex size-11 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="size-5 transition-transform duration-200 group-data-[state=open]:rotate-45" aria-hidden />
          </DropdownMenuTrigger>
        </RailTip>
        <DropdownMenuContent side="right" align="start" className="w-60">
          <DropdownMenuLabel className="section-label">{t("app.quickActions")}</DropdownMenuLabel>
          {actions.map((a) => (
            <DropdownMenuItem key={a.label} onSelect={() => navigate({ to: a.to })}>
              <a.icon /> {quickActionLabel(a.label, t)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div
      className={cn(
        "w-full rounded-[20px] border p-2 transition-colors duration-200",
        open ? "border-primary" : "border-border",
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="quick-actions-list"
        className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-[14px] p-1 text-sm font-semibold"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Plus className={cn("size-5 transition-transform duration-200", open && "rotate-45")} aria-hidden />
        </span>
        {t("app.quickActions")}
        <span className="sr-only">{open ? "(deschis)" : "(închis)"}</span>
      </button>
      <div
        id="quick-actions-list"
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
        inert={!open}
      >
        <ul className="overflow-hidden">
          {actions.map((a) => (
            <li key={a.label} className="first:pt-1.5">
              <Link
                to={a.to}
                onClick={() => {
                  setOpen(false);
                  onNavigate();
                }}
                className="flex min-h-11 items-center gap-3 rounded-[12px] px-3 text-sm text-muted-foreground transition-colors hover:bg-selected hover:text-foreground"
              >
                <a.icon className="size-4" aria-hidden />
                {quickActionLabel(a.label, t)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function NavRow({
  item,
  role,
  collapsed,
  counts,
  onNavigate,
}: {
  item: NavItem;
  role: User["role"];
  collapsed: boolean;
  counts?: SidebarCounts | undefined;
  onNavigate: () => void;
}) {
  const { t } = useI18n();
  const navLabels: Record<string, string> = {
    dashboard: t("app.dashboard"),
    matches: role === "FREELANCER" ? t("app.matchesForMe") : t("app.matches"),
    projects: t("app.projects"),
    messages: t("app.messages"),
    collaborations: t("app.collaborations"),
    portfolio: t("app.portfolio"),
    settings: t("app.settings"),
    admin: t("app.admin"),
  };
  const label = navLabels[item.key] ?? navLabel(item, role);
  const Icon = item.icon;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const projectsOpen = useSidebarStore((s) => s.projectsOpen);
  const toggleProjects = useSidebarStore((s) => s.toggleProjects);

  const badgeCount = item.badge === "matches" ? counts?.unseenMatches : item.badge === "messages" ? counts?.unreadMessages : 0;
  const badge =
    !badgeCount ? null : item.badge === "matches" ? (
      <Badge variant="coral" className="ml-auto" aria-label={`${badgeCount} potriviri nevăzute`}>
        {t("app.new")}
      </Badge>
    ) : (
      <Badge variant="soft" className="ml-auto min-w-6 justify-center" aria-label={`${badgeCount} mesaje necitite`}>
        {badgeCount}
      </Badge>
    );
  const dot = badgeCount ? (
    <span
      aria-hidden
      className={cn(
        "absolute right-2 top-2 size-2 rounded-full ring-2 ring-panel",
        item.badge === "matches" ? "bg-coral" : "bg-primary",
      )}
    />
  ) : null;

  // Expandable group (Proiecte)
  if (item.children) {
    const groupActive = item.children.some((c) => pathname.startsWith(c.to));
    if (collapsed) {
      return (
        <RailTip show label={label}>
          <Link
            to={item.children[0]?.to ?? "/projects/active"}
            aria-label={label}
            data-status={groupActive ? "active" : undefined}
            className={cn(itemBase, "size-11 justify-center p-0")}
          >
            <Icon className={iconBase} aria-hidden />
          </Link>
        </RailTip>
      );
    }
    return (
      <div className="w-full">
        <button
          type="button"
          onClick={toggleProjects}
          aria-expanded={projectsOpen}
          aria-controls={`nav-group-${item.key}`}
          data-status={groupActive && !projectsOpen ? "active" : undefined}
          className={cn(itemBase, "w-full cursor-pointer")}
        >
          <Icon className={cn(iconBase, groupActive && "text-primary")} aria-hidden />
          {label}
          <ChevronDown
            className={cn("ml-auto size-4 transition-transform duration-200", projectsOpen && "rotate-180")}
            aria-hidden
          />
        </button>
        <div
          id={`nav-group-${item.key}`}
          className={cn(
            "grid transition-[grid-template-rows] duration-250 ease-out",
            projectsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
          inert={!projectsOpen}
        >
          <ul className="ml-[25px] overflow-hidden border-l border-border pl-3">
            {item.children.map((c) => (
              <li key={c.to} className="pt-1">
                <Link to={c.to} onClick={onNavigate} className={cn(itemBase, "min-h-10 py-2")}>
                  {c.to === "/projects/active" ? t("app.active") : c.to === "/projects/archive" ? t("app.archive") : c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (!item.to) return null;

  if (collapsed) {
    return (
      <RailTip show label={badgeCount ? `${label} (${badgeCount})` : label}>
        <Link to={item.to} aria-label={label} className={cn(itemBase, "size-11 justify-center p-0")}>
          <Icon className={iconBase} aria-hidden />
          {dot}
        </Link>
      </RailTip>
    );
  }

  return (
    <Link to={item.to} onClick={onNavigate} className={cn(itemBase, "w-full")}>
      <Icon className={iconBase} aria-hidden />
      {label}
      {badge}
    </Link>
  );
}

function TierCard({ user, collapsed }: { user: User; collapsed: boolean }) {
  const progress = user.tierProgress!;
  const current = tierName(progress.tier);
  const next = progress.nextTier ? tierName(progress.nextTier) : null;
  const text = next
    ? `Încă ${progress.projectsToNext} ${progress.projectsToNext === 1 ? "proiect" : "proiecte"} până la „${next}”`
    : "Ai atins treapta maximă";

  if (collapsed) {
    return (
      <RailTip show label={`Treapta: ${current}. ${text}`}>
        <span
          tabIndex={0}
          role="img"
          aria-label={`Treapta: ${current}. ${text}`}
          className="flex size-11 items-center justify-center rounded-full bg-gradient-progress text-on-gradient"
        >
          <ShieldCheck className="size-5" aria-hidden />
        </span>
      </RailTip>
    );
  }

  return (
    <div className="rounded-[20px] bg-gradient-progress p-4 text-on-gradient">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4" aria-hidden />
        <p className="text-sm font-semibold">Treapta: {current}</p>
      </div>
      <p className="mt-1 text-small opacity-90">{text}</p>
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-on-gradient/25"
        role="progressbar"
        aria-label="Progres către treapta următoare"
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-on-gradient transition-[width] duration-500" style={{ width: `${progress.percent}%` }} />
      </div>
    </div>
  );
}
