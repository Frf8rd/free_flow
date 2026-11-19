import { createFileRoute } from "@tanstack/react-router";

import { CollaborationsPage } from "@/pages/Collaborations";
import { RoleGate } from "@/components/layout/RoleGate";

export const Route = createFileRoute("/_authenticated/_shell/collaborations")({
  head: () => ({
    meta: [
      { title: "Colaborări · FairMatch" },
      { name: "description", content: "Colaborările tale curente și trecute." },
      { property: "og:title", content: "Colaborări · FairMatch" },
      { property: "og:description", content: "Colaborările tale curente și trecute." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RoleGate roles={["CLIENT", "FREELANCER", "ADMIN"]}>
      <CollaborationsPage />
    </RoleGate>
  ),
});
