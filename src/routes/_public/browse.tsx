import { createFileRoute } from "@tanstack/react-router";

import { BrowsePage } from "@/pages/Browse";

export const Route = createFileRoute("/_public/browse")({
  head: () => ({
    meta: [
      { title: "Freelanceri · FairMatch" },
      { name: "description", content: "Explorează freelanceri pe FairMatch, fără poziții plătite." },
      { property: "og:title", content: "Freelanceri · FairMatch" },
      { property: "og:description", content: "Explorează freelanceri pe FairMatch, fără poziții plătite." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BrowsePage,
});
