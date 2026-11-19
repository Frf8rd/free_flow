import { useEffect } from "react";
import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";

import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth";
import { useStoresHydrated } from "@/store/hydration";

export const Route = createFileRoute("/_authenticated")({
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: AuthGuard,
});

/** Client-side guard: the session lives in localStorage, so it is checked after hydration. */
function AuthGuard() {
  const hydrated = useStoresHydrated();
  const user = useAuthStore((s) => s.user);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const needsOnboarding = !!user && !user.profileComplete && pathname !== "/onboarding";

  useEffect(() => {
    if (!hydrated) return;
    if (!user) navigate({ to: "/login", replace: true });
    else if (needsOnboarding) navigate({ to: "/onboarding", replace: true });
  }, [hydrated, user, needsOnboarding, navigate]);

  if (!hydrated || !user || needsOnboarding) {
    return (
      <div className="flex min-h-screen gap-4 p-4" aria-busy="true" aria-label="Se încarcă">
        <Skeleton className="hidden w-[var(--sidebar-w)] rounded-[var(--radius-sidebar)] lg:block" />
        <div className="flex flex-1 flex-col gap-4 pt-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 rounded-[var(--radius-card)]" />
        </div>
      </div>
    );
  }
  return <Outlet />;
}
