import { createFileRoute } from "@tanstack/react-router";

import { FreelancerProfilePage } from "@/pages/FreelancerProfile";

export const Route = createFileRoute("/_public/freelancers/$id")({
  head: () => ({
    meta: [
      { title: "Profil freelancer · FairMatch" },
      { name: "description", content: "Profil public de freelancer pe FairMatch." },
      { property: "og:title", content: "Profil freelancer · FairMatch" },
      { property: "og:description", content: "Profil public de freelancer pe FairMatch." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfileRoute,
});

function ProfileRoute() {
  const { id } = Route.useParams();
  return <FreelancerProfilePage id={id} />;
}
