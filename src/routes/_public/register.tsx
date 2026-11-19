import { createFileRoute } from "@tanstack/react-router";

import { RegisterPage } from "@/pages/Register";

type RegisterSearch = { role?: "client" | "freelancer" };

export const Route = createFileRoute("/_public/register")({
  validateSearch: (search: Record<string, unknown>): RegisterSearch =>
    search["role"] === "client" || search["role"] === "freelancer" ? { role: search["role"] } : {},
  head: () => ({
    meta: [
      { title: "Creează cont · FairMatch" },
      { name: "description", content: "Creează un cont FairMatch ca client sau freelancer." },
      { property: "og:title", content: "Creează cont · FairMatch" },
      { property: "og:description", content: "Creează un cont FairMatch ca client sau freelancer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RegisterRoute,
});

function RegisterRoute() {
  const { role } = Route.useSearch();
  return <RegisterPage key={role ?? "none"} initialRole={role} />;
}
