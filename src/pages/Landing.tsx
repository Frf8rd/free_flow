import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Coins,
  Eye,
  FileText,
  Handshake,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
  Sprout,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MatchCard } from "@/components/match/MatchCard";
import { Reveal } from "@/components/layout/Reveal";
import { tiers } from "@/mocks/tiers";
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
    headline: "Dezvoltator web · site-uri de prezentare",
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

const steps = [
  {
    icon: FileText,
    title: "Descrie proiectul",
    text: "Scrii liber, ca unui prieten: „Vreau un site pentru frizeria mea, buget mic, în două săptămâni.”",
  },
  {
    icon: Sparkles,
    title: "Primești 5 potriviri",
    text: "Platforma alege freelancerii potriviți și îți arată pentru fiecare un scor și de ce se potrivește.",
  },
  {
    icon: Handshake,
    title: "Colaborați",
    text: "Alegi, discutați în aplicație și lucrați împreună. Încrederea se câștigă proiect cu proiect.",
  },
];

const comparison = [
  { problem: "Începătorii nu au șanse", classic: "Fără recenzii, profilul nou rămâne invizibil.", fair: "Expunere garantată pentru talentele noi." },
  { problem: "Clientul caută manual", classic: "Zeci de profiluri de filtrat și comparat.", fair: "Aproximativ 5 potriviri explicate, automat." },
  { problem: "Plată pentru aplicare", classic: "Freelancerii plătesc ca să poată aplica.", fair: "Proiectele potrivite vin la tine, fără costuri de aplicare." },
  { problem: "Concurență haotică", classic: "Sute de oferte pe același proiect.", fair: "Doar cei care se potrivesc sunt propuși." },
  { problem: "Comisioane mari", classic: "Comisioane care scad din câștigul freelancerului.", fair: "Comision transparent, afișat înainte de colaborare." },
];

const faqs = [
  {
    q: "Cum se calculează scorul de potrivire?",
    a: "Comparăm abilitățile cerute cu cele ale freelancerului, bugetul cu tariful, termenul cu disponibilitatea și domeniul proiectului cu experiența. Recenziile contează, dar nu domină. Fiecare scor vine cu explicația lui.",
  },
  {
    q: "Pot plăti ca să apar mai sus în rezultate?",
    a: "Nu. Poziția în potriviri nu se poate cumpăra. Singurul mod de a apărea mai des este să te potrivești mai bine cu proiectele.",
  },
  {
    q: "Sunt la început, fără recenzii. Am vreo șansă?",
    a: "Da. Freelancerii noi primesc expunere garantată și sunt marcați „Talent în creștere”, astfel încât clienții deschiși la talente noi să-i poată găsi.",
  },
  {
    q: "Ce înseamnă treptele Start, Verificat, Încercat și Expert?",
    a: "Treapta arată mărimea maximă a proiectelor pe care le poți prelua, ca limită de risc. Nu îți aduce un bonus în clasament.",
  },
  {
    q: "Trebuie să caut eu freelanceri?",
    a: "Nu e nevoie. Descrii proiectul în cuvintele tale și primești potrivirile. Poți totuși să explorezi profilurile dacă vrei.",
  },
];

export function LandingPage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Audiences />
      <Fairness />
      <Comparison />
      <Tiers />
      <Faq />
      <FinalCta />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden" aria-labelledby="hero-title">
      <div aria-hidden className="bg-hero-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 md:px-8 lg:grid-cols-[1.15fr_1fr] lg:pb-28 lg:pt-24">
        <div className="min-w-0 animate-fade-up">
          <p className="section-label">Freelancing cu potrivire automată</p>
          <h1 id="hero-title" className="mt-5 text-[2.6rem] leading-[1.04] sm:text-5xl md:text-6xl lg:text-7xl">
            Nu cel mai cunoscut. Cel mai <em className="text-primary">potrivit</em>.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Descrii proiectul în cuvintele tale, iar FairMatch îți arată freelancerii care se potrivesc cu adevărat, cu
            explicația fiecărei alegeri.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link to="/register" search={{ role: "client" }}>
                Sunt client <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/register" search={{ role: "freelancer" }}>
                Sunt freelancer
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative mx-auto w-full min-w-0 max-w-md lg:mx-0 lg:justify-self-end">
          <div className="animate-float">
            <div className="surface-card mb-4 ml-8 max-w-xs p-4 text-small text-muted-foreground shadow-float">
              <p className="section-label mb-1.5">Proiect</p>
              „Vreau un site pentru frizeria mea, buget mic, în două săptămâni.”
            </div>
            <MatchCard match={heroMatch} className="shadow-float" />
          </div>
          <p className="mt-4 text-center text-[12px] text-muted-foreground">Exemplu ilustrativ de potrivire</p>
        </div>
      </div>
    </section>
  );
}

function SectionHead({ label, title, text, id }: { label: string; title: string; text?: string; id: string }) {
  return (
    <div className="max-w-2xl">
      <p className="section-label">{label}</p>
      <h2 id={id} className="mt-4 text-4xl md:text-5xl">
        {title}
      </h2>
      {text && <p className="mt-4 text-lg text-muted-foreground">{text}</p>}
    </div>
  );
}

function HowItWorks() {
  return (
    <Reveal id="cum-functioneaza" aria-labelledby="how-title" className="scroll-mt-24 mx-auto max-w-7xl px-5 py-20 md:px-8">
      <SectionHead id="how-title" label="Cum funcționează" title="Trei pași, fără căutări la nesfârșit." />
      <ol className="mt-12 grid gap-5 md:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="surface-card flex flex-col p-7">
            <div className="flex items-center justify-between">
              <span className="font-display text-5xl text-primary">{String(i + 1).padStart(2, "0")}</span>
              <span className="flex size-11 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
                <s.icon className="size-5" aria-hidden />
              </span>
            </div>
            <h3 className="mt-8 text-2xl">{s.title}</h3>
            <p className="mt-2 text-muted-foreground">{s.text}</p>
          </li>
        ))}
      </ol>
    </Reveal>
  );
}

function Audiences() {
  const cols = [
    {
      id: "pentru-clienti",
      label: "Pentru clienți",
      title: "Spui ce ai nevoie. Restul vine la tine.",
      points: [
        "Descriere liberă, fără formulare complicate",
        "Aproximativ 5 freelanceri potriviți, nu sute",
        "Explicație clară pentru fiecare potrivire",
      ],
      cta: "Sunt client",
      role: "client" as const,
    },
    {
      id: "pentru-freelanceri",
      label: "Pentru freelanceri",
      title: "Proiectele potrivite te găsesc pe tine.",
      points: [
        "Primești proiecte potrivite automat",
        "Fără plată pentru a aplica",
        "Expunere garantată chiar și la început",
      ],
      cta: "Sunt freelancer",
      role: "freelancer" as const,
    },
  ];
  return (
    <div className="mx-auto grid max-w-7xl gap-5 px-5 py-8 md:grid-cols-2 md:px-8">
      {cols.map((c) => (
        <Reveal key={c.id} id={c.id} aria-labelledby={`${c.id}-title`} className="surface-card scroll-mt-24 flex flex-col p-8 md:p-10">
          <p className="section-label">{c.label}</p>
          <h2 id={`${c.id}-title`} className="mt-4 text-3xl">
            {c.title}
          </h2>
          <ul className="mt-6 flex flex-col gap-3">
            {c.points.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
                  <Check className="size-3.5" aria-hidden />
                </span>
                {p}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Button variant="soft" asChild>
              <Link to="/register" search={{ role: c.role }}>
                {c.cta} <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

function Fairness() {
  return (
    <Reveal id="echitate" aria-labelledby="fair-title" className="scroll-mt-24 mx-auto max-w-7xl px-5 py-20 md:px-8">
      <SectionHead
        id="fair-title"
        label="Echitate prin design"
        title="Reguli corecte, scrise în produs."
        text="Recenziile contează, dar nu decid totul. Potrivirea decide."
      />
      <div className="mt-12 grid auto-rows-[minmax(200px,auto)] gap-5 md:grid-cols-6">
        <article className="surface-card flex flex-col justify-between p-8 md:col-span-4 md:row-span-2">
          <span className="flex size-12 items-center justify-center rounded-full bg-coral-soft text-coral-soft-foreground">
            <Sprout className="size-5" aria-hidden />
          </span>
          <div className="mt-10">
            <h3 className="text-3xl md:text-4xl">Expunere garantată pentru începători</h3>
            <p className="mt-3 max-w-lg text-muted-foreground">
              Fiecare listă de potriviri lasă loc și pentru freelanceri noi, marcați „Talent în creștere”. Primul
              proiect nu mai depinde de noroc.
            </p>
          </div>
        </article>
        <BentoCard icon={Coins} title="Banii nu cumpără poziția" text="Nu există promovare plătită în rezultate. Niciodată." className="md:col-span-2" />
        <BentoCard icon={Eye} title="Scoruri explicate" text="Vezi exact de ce se potrivește fiecare freelancer." className="md:col-span-2" />
        <BentoCard
          icon={ShieldCheck}
          title="Încredere câștigată prin trepte"
          text="Treptele limitează riscul pe mărimea proiectului, nu ordinea în clasament."
          className="md:col-span-3"
        />
        <BentoCard
          icon={MessagesSquare}
          title="Recenzii cu măsură"
          text="Contează în scor, dar nu pot îngropa un profil nou."
          className="md:col-span-3"
        />
      </div>
    </Reveal>
  );
}

function BentoCard({ icon: Icon, title, text, className }: { icon: typeof Eye; title: string; text: string; className?: string }) {
  return (
    <article className={`surface-card flex flex-col justify-between p-7 ${className ?? ""}`}>
      <span className="flex size-11 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="mt-8">
        <h3 className="text-xl">{title}</h3>
        <p className="mt-1.5 text-muted-foreground">{text}</p>
      </div>
    </article>
  );
}

function Comparison() {
  return (
    <Reveal aria-labelledby="cmp-title" className="mx-auto max-w-7xl px-5 py-20 md:px-8">
      <SectionHead id="cmp-title" label="Comparație" title="Ce schimbă FairMatch." />
      <div className="surface-card relative mt-12 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <caption className="sr-only">FairMatch comparat cu platformele clasice de freelancing</caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="section-label px-6 py-5 font-semibold">Problemă</th>
              <th scope="col" className="section-label px-6 py-5 font-semibold">Upwork / Fiverr</th>
              <th scope="col" className="px-6 py-5">
                <span className="inline-flex items-center gap-2 font-display text-lg">
                  <span aria-hidden className="size-2 rounded-full bg-coral" /> FairMatch
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {comparison.map((row) => (
              <tr key={row.problem} className="border-b border-border last:border-0">
                <th scope="row" className="px-6 py-5 font-semibold">{row.problem}</th>
                <td className="px-6 py-5 text-muted-foreground">
                  <span className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-inset">
                      <X className="size-3.5" aria-hidden />
                    </span>
                    <span>
                      <span className="sr-only">Nu: </span>
                      {row.classic}
                    </span>
                  </span>
                </td>
                <td className="bg-primary-soft/40 px-6 py-5">
                  <span className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3.5" aria-hidden />
                    </span>
                    <span>
                      <span className="sr-only">Da: </span>
                      {row.fair}
                    </span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Reveal>
  );
}

function Tiers() {
  return (
    <Reveal id="trepte" aria-labelledby="tiers-title" className="scroll-mt-24 mx-auto max-w-7xl px-5 py-20 md:px-8">
      <SectionHead
        id="tiers-title"
        label="Trepte de încredere"
        title="Încrederea se câștigă pe platformă."
        text="Treapta este o limită de risc pentru mărimea proiectului, nu un bonus în clasament."
      />
      <ol className="relative mt-14 grid gap-8 md:grid-cols-4 md:gap-5">
        <span aria-hidden className="absolute left-5 top-5 hidden h-px w-[calc(100%-2.5rem)] bg-border md:block" />
        {tiers.map((t, i) => (
          <li key={t.id} className="relative flex gap-4 md:flex-col">
            <span
              className={
                "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border font-display text-base " +
                (i === 0 ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")
              }
            >
              {i + 1}
            </span>
            <div>
              <h3 className="text-xl">{t.name}</h3>
              <p className="mt-1 text-muted-foreground">{t.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </Reveal>
  );
}

function Faq() {
  return (
    <Reveal id="intrebari" aria-labelledby="faq-title" className="scroll-mt-24 mx-auto grid max-w-7xl gap-10 px-5 py-20 md:px-8 lg:grid-cols-[1fr_1.4fr]">
      <SectionHead id="faq-title" label="Întrebări frecvente" title="Ce vor oamenii să știe." />
      <Accordion type="single" collapsible className="surface-card px-6">
        {faqs.map((f, i) => (
          <AccordionItem key={f.q} value={`q-${i}`} className="border-border last:border-0">
            <AccordionTrigger className="min-h-14 py-5 text-left text-base font-semibold hover:no-underline">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="text-[15px] text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Reveal>
  );
}

function FinalCta() {
  return (
    <Reveal aria-labelledby="cta-title" className="mx-auto max-w-7xl px-5 pb-24 pt-8 md:px-8">
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-cta px-8 py-14 text-on-gradient md:px-14 md:py-20">
        <Users aria-hidden className="pointer-events-none absolute -right-6 -top-6 size-56 opacity-10" />
        <h2 id="cta-title" className="max-w-2xl text-4xl md:text-5xl">
          Lasă potrivirea să lucreze pentru tine.
        </h2>
        <p className="mt-4 max-w-xl text-lg opacity-90">Creezi contul în câteva minute și primești primele potriviri.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" variant="onGradient" asChild>
            <Link to="/register" search={{ role: "client" }}>
              Sunt client
            </Link>
          </Button>
          <Button size="lg" variant="onGradientOutline" asChild>
            <Link to="/register" search={{ role: "freelancer" }}>
              Sunt freelancer
            </Link>
          </Button>
        </div>
      </div>
    </Reveal>
  );
}
