import { createFileRoute } from "@tanstack/react-router";

import { PortfolioPage } from "@/pages/Portfolio";
import { RoleGate } from "@/components/layout/RoleGate";

export const Route = createFileRoute("/_authenticated/_shell/portfolio")({
  head: () => ({
    meta: [
      { title: "Portofoliu · FairMatch" },
      { name: "description", content: "Lucrările pe care le arăți clienților." },
      { property: "og:title", content: "Portofoliu · FairMatch" },
      { property: "og:description", content: "Lucrările pe care le arăți clienților." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RoleGate roles={["FREELANCER"]}>
      <PortfolioPage />
    </RoleGate>
  ),
});
