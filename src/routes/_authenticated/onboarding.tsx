import { createFileRoute } from "@tanstack/react-router";

import { OnboardingPage } from "@/pages/Onboarding";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Configurează profilul · FairMatch" },
      { name: "description", content: "Completează profilul ca să primești potriviri." },
      { property: "og:title", content: "Configurează profilul · FairMatch" },
      { property: "og:description", content: "Completează profilul ca să primești potriviri." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OnboardingPage,
});
