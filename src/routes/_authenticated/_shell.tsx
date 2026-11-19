import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppLayout } from "@/components/layout/AppLayout";

export const Route = createFileRoute("/_authenticated/_shell")({
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});
