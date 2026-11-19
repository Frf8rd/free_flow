import { createFileRoute } from "@tanstack/react-router";

import { SettingsPage } from "@/pages/Settings";
import { RoleGate } from "@/components/layout/RoleGate";

export const Route = createFileRoute("/_authenticated/_shell/settings")({
  head: () => ({
    meta: [
      { title: "Setări · FairMatch" },
      { name: "description", content: "Profil, cont și preferințe." },
      { property: "og:title", content: "Setări · FairMatch" },
      { property: "og:description", content: "Profil, cont și preferințe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RoleGate roles={["CLIENT", "FREELANCER", "ADMIN"]}>
      <SettingsPage />
    </RoleGate>
  ),
});
