import { createFileRoute } from "@tanstack/react-router";

import { ProjectsPage } from "@/pages/Projects";
import { RoleGate } from "@/components/layout/RoleGate";

export const Route = createFileRoute("/_authenticated/_shell/projects/archive")({
  head: () => ({
    meta: [
      { title: "Arhivă proiecte · FairMatch" },
      { name: "description", content: "Proiectele încheiate." },
      { property: "og:title", content: "Arhivă proiecte · FairMatch" },
      { property: "og:description", content: "Proiectele încheiate." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RoleGate roles={["CLIENT", "ADMIN"]}>
      <ProjectsPage archive />
    </RoleGate>
  ),
});
