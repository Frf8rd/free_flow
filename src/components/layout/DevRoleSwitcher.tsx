import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FlaskConical, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { useStoresHydrated } from "@/store/hydration";
import type { Role } from "@/types";

const roles: Role[] = ["CLIENT", "FREELANCER", "ADMIN"];

/** Development-only floating pill to preview each role. Not rendered in production builds. */
export function DevRoleSwitcher() {
  const hydrated = useStoresHydrated();
  const user = useAuthStore((s) => s.user);
  const switchRole = useAuthStore((s) => s.switchRole);
  const updateUser = useAuthStore((s) => s.updateUser);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!import.meta.env.DEV || !hydrated) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-1 rounded-full border border-border bg-popover p-1 text-small shadow-float">
      {open ? (
        <>
          <span className="px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Dev</span>
          {roles.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                switchRole(r);
                navigate({ to: "/dashboard" });
              }}
              aria-pressed={user?.role === r}
              className={cn(
                "h-9 cursor-pointer rounded-full px-3 text-[12px] font-semibold transition-colors hover:bg-selected",
                user?.role === r && "bg-primary text-primary-foreground hover:bg-primary",
              )}
            >
              {r}
            </button>
          ))}
          {user && (
            <button
              type="button"
              onClick={() => {
                updateUser({ ...user, profileComplete: false });
                navigate({ to: "/onboarding" });
              }}
              className="h-9 cursor-pointer rounded-full px-3 text-[12px] font-medium text-muted-foreground hover:bg-selected hover:text-foreground"
            >
              Onboarding
            </button>
          )}
          {user && (
            <button
              type="button"
              onClick={() => {
                logout();
                navigate({ to: "/" });
              }}
              className="h-9 cursor-pointer rounded-full px-3 text-[12px] font-medium text-muted-foreground hover:bg-selected hover:text-foreground"
            >
              Ieșire
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Închide comutatorul de rol"
            className="flex size-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-selected"
          >
            <X className="size-4" />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Deschide comutatorul de rol (doar în dezvoltare)"
          className="flex h-9 cursor-pointer items-center gap-2 rounded-full px-3 font-semibold"
        >
          <FlaskConical className="size-4 text-primary" aria-hidden />
          {user ? user.role : "Rol dev"}
        </button>
      )}
    </div>
  );
}
