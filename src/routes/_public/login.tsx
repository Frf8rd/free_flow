import { createFileRoute } from "@tanstack/react-router";

import { LoginPage } from "@/pages/Login";

export const Route = createFileRoute("/_public/login")({
  head: () => ({
    meta: [
      { title: "Autentificare · FairMatch" },
      { name: "description", content: "Intră în contul tău FairMatch." },
      { property: "og:title", content: "Autentificare · FairMatch" },
      { property: "og:description", content: "Intră în contul tău FairMatch." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});
