import { createFileRoute } from "@tanstack/react-router";

import { DashboardPage } from "@/pages/Dashboard";

export const Route = createFileRoute("/_authenticated/_shell/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · FairMatch" },
      { name: "description", content: "Potrivirile tale recente pe FairMatch." },
      { property: "og:title", content: "Dashboard · FairMatch" },
      { property: "og:description", content: "Potrivirile tale recente pe FairMatch." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});
