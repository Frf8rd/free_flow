import { createFileRoute } from "@tanstack/react-router";

import { ProjectNewPage } from "@/pages/ProjectNew";
import { RoleGate } from "@/components/layout/RoleGate";

export const Route = createFileRoute("/_authenticated/_shell/projects/new")({
  head: () => ({
    meta: [
      { title: "Postează proiect · FairMatch" },
      { name: "description", content: "Descrie proiectul în cuvintele tale." },
      { property: "og:title", content: "Postează proiect · FairMatch" },
      { property: "og:description", content: "Descrie proiectul în cuvintele tale." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RoleGate roles={["CLIENT", "ADMIN"]}>
      <ProjectNewPage />
    </RoleGate>
  ),
});
