import { createFileRoute } from "@tanstack/react-router";

import { MatchesPage } from "@/pages/Matches";
import { RoleGate } from "@/components/layout/RoleGate";

export const Route = createFileRoute("/_authenticated/_shell/matches")({
  validateSearch: (s: Record<string, unknown>): { project?: string } =>
    typeof s["project"] === "string" ? { project: s["project"] } : {},
  head: () => ({
    meta: [
      { title: "Potriviri · FairMatch" },
      { name: "description", content: "Potrivirile tale, cu scor și explicație." },
      { property: "og:title", content: "Potriviri · FairMatch" },
      { property: "og:description", content: "Potrivirile tale, cu scor și explicație." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MatchesRoute,
});

function MatchesRoute() {
  const { project } = Route.useSearch();
  return (
    <RoleGate roles={["CLIENT", "FREELANCER", "ADMIN"]}>
      <MatchesPage project={project} />
    </RoleGate>
  );
}
