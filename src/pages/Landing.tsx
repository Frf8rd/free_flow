import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  FileText,
  Handshake,
  Laptop,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { MatchCard } from "@/components/match/MatchCard";
import { Reveal } from "@/components/layout/Reveal";
import { useI18n } from "@/i18n";
import type { Match } from "@/types";

const heroMatch: Match = {
  id: "exemplu",
  projectId: "exemplu",
  score: 92,
  breakdown: { skills: 95, price: 98, availability: 90, deadline: 85 },
  status: "NEW",
  seen: true,
  reasons: ["abilități comune", "preț în buget", "disponibil în termen"],
  freelancer: {
    id: "exemplu",
    name: "Nume Prenume",
    headline: "Frontend developer",
    skills: ["WordPress", "UI/UX"],
    hourlyRate: 15,
    tier: "START",
    risingTalent: true,
    completedProjects: 1,
    availability: "FULL_TIME",
    categoryId: "web",
    rating: null,
    reviewsCount: 0,
  },
};

export function LandingPage() {
  const { t } = useI18n();
  const steps = [
    { icon: FileText, title: t("overview.step1.title"), text: t("overview.step1.text") },
    { icon: Sparkles, title: t("overview.step2.title"), text: t("overview.step2.text") },
    { icon: Handshake, title: t("overview.step3.title"), text: t("overview.step3.text") },
  ];
  const audiences = [
    {
      id: "clienti",
      icon: BriefcaseBusiness,
      label: t("overview.client.label"),
      title: t("overview.client.title"),
      text: t("overview.client.text"),
      points: [t("overview.client.point1"), t("overview.client.point2"), t("overview.client.point3")],
      action: t("hero.client"),
      role: "client" as const,
    },
    {
      id: "freelanceri",
      icon: Laptop,
      label: t("overview.freelancer.label"),
      title: t("overview.freelancer.title"),
      text: t("overview.freelancer.text"),
      points: [
        t("overview.freelancer.point1"),
        t("overview.freelancer.point2"),
        t("overview.freelancer.point3"),
      ],
      action: t("hero.freelancer"),
      role: "freelancer" as const,
    },
  ];
  const principles = [
    t("overview.principle1"),
    t("overview.principle2"),
    t("overview.principle3"),
  ];

  return (
    <>
      <section className="relative overflow-hidden" aria-labelledby="hero-title">
        <div aria-hidden className="bg-hero-glow pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-14 md:px-8 md:pb-20 md:pt-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="min-w-0 animate-fade-up">
            <p className="section-label">{t("hero.label")}</p>
            <h1 id="hero-title" className="mt-5 max-w-3xl text-[2.6rem] leading-[1.04] sm:text-5xl md:text-6xl">
              {t("hero.titleStart")} <em className="text-primary">{t("hero.titleEnd")}</em>.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">{t("hero.text")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link to="/register" search={{ role: "client" }}>
                  {t("hero.client")} <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/register" search={{ role: "freelancer" }}>
                  {t("hero.freelancer")}
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full min-w-0 max-w-md lg:mx-0 lg:justify-self-end">
            <div className="surface-card mb-4 ml-8 max-w-xs p-4 text-small text-muted-foreground shadow-float">
              <p className="section-label mb-1.5">{t("hero.project")}</p>
              {t("hero.projectText")}
            </div>
            <MatchCard match={heroMatch} className="shadow-float" />
            <p className="mt-4 text-center text-[12px] text-muted-foreground">{t("hero.example")}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
        <Reveal aria-labelledby="how-title" className="py-10 md:py-14">
          <div className="mb-8 max-w-3xl">
            <p className="section-label">{t("overview.howLabel")}</p>
            <h2 id="how-title" className="mt-3 text-3xl md:text-4xl">
              {t("overview.howTitle")}
            </h2>
            <p className="mt-3 max-w-3xl text-muted-foreground">
              {t("overview.summaryText")}
            </p>
          </div>
          <ol className="grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="surface-card flex gap-4 p-5 md:p-6">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
                  <step.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="section-label">{String(index + 1).padStart(2, "0")}</p>
                  <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-1 text-small text-muted-foreground">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>

        <div className="grid gap-4 py-8 md:grid-cols-2">
          {audiences.map((audience) => (
            <Reveal
              key={audience.id}
              aria-labelledby={`${audience.id}-title`}
              className="surface-card flex flex-col p-6 md:p-8"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
                  <audience.icon className="size-5" aria-hidden />
                </span>
                <p className="section-label">{audience.label}</p>
              </div>
              <h2 id={`${audience.id}-title`} className="mt-5 text-2xl md:text-3xl">
                {audience.title}
              </h2>
              <p className="mt-2 text-muted-foreground">{audience.text}</p>
              <ul className="mt-5 flex flex-col gap-3">
                {audience.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    {point}
                  </li>
                ))}
              </ul>
              <Button variant="soft" className="mt-7 self-start" asChild>
                <Link to="/register" search={{ role: audience.role }}>
                  {audience.action} <ArrowRight aria-hidden />
                </Link>
              </Button>
            </Reveal>
          ))}
        </div>

        <Reveal aria-labelledby="principles-title" className="py-8">
          <div className="surface-card flex flex-col gap-6 p-6 md:flex-row md:items-center md:p-8">
            <div className="flex items-center gap-3 md:max-w-xs">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-coral-soft text-coral-soft-foreground">
                <ShieldCheck className="size-5" aria-hidden />
              </span>
              <h2 id="principles-title" className="text-xl font-semibold">
                {t("overview.fairTitle")}
              </h2>
            </div>
            <ul className="grid flex-1 gap-3 sm:grid-cols-3">
              {principles.map((principle) => (
                <li key={principle} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {principle}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </>
  );
}
