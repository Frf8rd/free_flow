import { createFileRoute } from "@tanstack/react-router";

import { MessagesPage } from "@/pages/Messages";
import { RoleGate } from "@/components/layout/RoleGate";

export const Route = createFileRoute("/_authenticated/_shell/messages")({
  head: () => ({
    meta: [
      { title: "Mesaje · FairMatch" },
      { name: "description", content: "Conversațiile tale." },
      { property: "og:title", content: "Mesaje · FairMatch" },
      { property: "og:description", content: "Conversațiile tale." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RoleGate roles={["CLIENT", "FREELANCER", "ADMIN"]}>
      <MessagesPage />
    </RoleGate>
  ),
});
