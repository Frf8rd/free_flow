import { createFileRoute } from "@tanstack/react-router";

import { AdminPage } from "@/pages/Admin";
import { RoleGate } from "@/components/layout/RoleGate";

export const Route = createFileRoute("/_authenticated/_shell/admin")({
  head: () => ({
    meta: [
      { title: "Administrare · FairMatch" },
      { name: "description", content: "Instrumente pentru administratori." },
      { property: "og:title", content: "Administrare · FairMatch" },
      { property: "og:description", content: "Instrumente pentru administratori." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RoleGate roles={["ADMIN"]}>
      <AdminPage />
    </RoleGate>
  ),
});
