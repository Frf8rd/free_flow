import {

  FilePlus2,
  FolderKanban,
  Handshake,
  Images,
  LayoutDashboard,
  MessageSquare,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRoundPen,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import type { Role } from "@/types";

export type AppPath =
  | "/dashboard"
  | "/matches"
  | "/projects/active"
  | "/projects/archive"
  | "/projects/new"
  | "/messages"
  | "/collaborations"
  | "/portfolio"
  | "/settings"
  | "/admin"
  | "/browse";

export interface NavItem {
  key: string;
  label: string | ((role: Role) => string);
  icon: LucideIcon;
  to?: AppPath;
  roles?: Role[];
  badge?: "matches" | "messages";
  children?: { label: string; to: AppPath }[];
}

export const navItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  {
    key: "matches",
    label: (role) => (role === "FREELANCER" ? "Potriviri pentru mine" : "Potriviri"),
    icon: Sparkles,
    to: "/matches",
    badge: "matches",
  },
  {
    key: "projects",
    label: "Proiecte",
    icon: FolderKanban,
    roles: ["CLIENT", "ADMIN"],
    children: [
      { label: "Active", to: "/projects/active" },
      { label: "Arhivă", to: "/projects/archive" },
    ],
  },
  { key: "messages", label: "Mesaje", icon: MessageSquare, to: "/messages", badge: "messages" },
  { key: "collaborations", label: "Colaborări", icon: Handshake, to: "/collaborations" },
  { key: "portfolio", label: "Portofoliu", icon: Images, to: "/portfolio", roles: ["FREELANCER"] },
  { key: "settings", label: "Setări", icon: Settings, to: "/settings" },
  { key: "admin", label: "Administrare", icon: ShieldCheck, to: "/admin", roles: ["ADMIN"] },
];

export const navLabel = (item: NavItem, role: Role) =>
  typeof item.label === "function" ? item.label(role) : item.label;

export const visibleNav = (role: Role) => navItems.filter((i) => !i.roles || i.roles.includes(role));

export interface QuickAction {
  label: string;
  icon: LucideIcon;
  to: AppPath;
}

export const quickActions = (role: Role): QuickAction[] =>
  role === "FREELANCER"
    ? [
        { label: "Completează profilul", icon: UserRoundPen, to: "/settings" },
        { label: "Adaugă în portofoliu", icon: Images, to: "/portfolio" },
        { label: "Scrie un mesaj", icon: MessageSquare, to: "/messages" },
      ]
    : [
        { label: "Postează proiect", icon: FilePlus2, to: "/projects/new" },
        { label: "Invită un freelancer", icon: UserPlus, to: "/browse" },
        { label: "Scrie un mesaj", icon: MessageSquare, to: "/messages" },
      ];

/** Breadcrumb title for each logged-in path. */
export const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/matches": "Potriviri",
  "/projects/active": "Proiecte active",
  "/projects/archive": "Arhivă proiecte",
  "/projects/new": "Postează proiect",
  "/messages": "Mesaje",
  "/collaborations": "Colaborări",
  "/portfolio": "Portofoliu",
  "/settings": "Setări",
  "/admin": "Administrare",
};

