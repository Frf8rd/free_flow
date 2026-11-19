import { createFileRoute } from "@tanstack/react-router";

import { LandingPage } from "@/pages/Landing";

export const Route = createFileRoute("/_public/")({
  head: () => ({
    meta: [
      { title: "FairMatch — Nu cel mai cunoscut. Cel mai potrivit." },
      { name: "description", content: "Platformă de freelancing cu potrivire automată: descrii proiectul și primești freelancerii care se potrivesc, cu explicații." },
      { property: "og:title", content: "FairMatch — Nu cel mai cunoscut. Cel mai potrivit." },
      { property: "og:description", content: "Freelancing unde câștigă cel mai potrivit, nu cel mai cunoscut." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});
