import { createFileRoute } from "@tanstack/react-router";

import { ProjectsPage } from "@/pages/Projects";
import { RoleGate } from "@/components/layout/RoleGate";

export const Route = createFileRoute("/_authenticated/_shell/projects/active")({
  head: () => ({
    meta: [
      { title: "Proiecte active · FairMatch" },
      { name: "description", content: "Proiectele tale în desfășurare." },
      { property: "og:title", content: "Proiecte active · FairMatch" },
      { property: "og:description", content: "Proiectele tale în desfășurare." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RoleGate roles={["CLIENT", "ADMIN"]}>
      <ProjectsPage />
    </RoleGate>
  ),
});
