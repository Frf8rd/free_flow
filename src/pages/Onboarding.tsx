import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Controller, useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, ArrowRight, Building2, Check, Loader2, Search, User as UserIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, fieldA11y } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Brand } from "@/components/layout/Brand";
import { ThemeSwitch } from "@/components/layout/ThemeSwitch";
import {
  clientOnboardingSchema,
  freelancerOnboardingSchema,
  type ClientOnboardingValues,
  type FreelancerOnboardingValues,
} from "@/lib/validation";
import { domainsQuery, skillsQuery } from "@/hooks/use-queries";
import { getErrorMessage, onboardingService } from "@/services";
import { useAuthStore } from "@/store/auth";
import type { OnboardingInput, User } from "@/types";

export function OnboardingPage() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
        <Brand />
        <ThemeSwitch size="sm" />
      </header>
      <main id="continut" className="mx-auto max-w-2xl px-5 pb-20 pt-6 animate-fade-up">
        {user.role === "FREELANCER" ? <FreelancerWizard user={user} /> : <ClientWizard user={user} />}
      </main>
    </div>
  );
}

function useFinish(user: User) {
  const navigate = useNavigate();
  const updateUser = useAuthStore((s) => s.updateUser);
  return useMutation({
    mutationFn: (input: OnboardingInput) => onboardingService.complete(user, input),
    onSuccess: (u) => {
      updateUser(u);
      navigate({ to: "/dashboard" });
    },
  });
}

function WizardShell({
  step,
  steps,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  pending,
  error,
}: {
  step: number;
  steps: string[];
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onBack: () => void;
  onNext: () => void;
  pending: boolean;
  error?: string | undefined;
}) {
  const last = step === steps.length - 1;
  const percent = Math.round(((step + 1) / steps.length) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-small text-muted-foreground">
        <span>
          Pasul {step + 1} din {steps.length} · <span className="text-foreground">{steps[step]}</span>
        </span>
        <span>{percent}%</span>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-inset"
        role="progressbar"
        aria-label="Progres configurare profil"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out" style={{ width: `${percent}%` }} />
      </div>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onNext();
        }}
        className="surface-card mt-8 p-7 md:p-9"
      >
        <div key={step} className="animate-fade-up">
          <h1 className="text-3xl md:text-4xl">{title}</h1>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
          <div className="mt-8 flex flex-col gap-6">{children}</div>
        </div>

        {error && (
          <div role="alert" className="mt-6 flex items-start gap-3 rounded-[16px] border border-destructive/40 bg-destructive/10 p-4 text-sm">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
            {error}
          </div>
        )}

        <div className="mt-10 flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" onClick={onBack} disabled={step === 0 || pending} className={cn(step === 0 && "invisible")}>
            <ArrowLeft aria-hidden /> Înapoi
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            {last ? (pending ? "Se salvează…" : "Finalizează") : "Continuă"}
            {!last && <ArrowRight aria-hidden />}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ---------------- Freelancer ---------------- */

const availabilityOptions = [
  { value: "FULL_TIME", label: "Normă întreagă", hint: "40+ ore pe săptămână" },
  { value: "PART_TIME", label: "Part-time", hint: "10–30 ore pe săptămână" },
  { value: "WEEKENDS", label: "Weekenduri", hint: "Doar în weekend" },
  { value: "UNAVAILABLE", label: "Momentan ocupat", hint: "Nu primesc proiecte acum" },
] as const;

function FreelancerWizard({ user }: { user: User }) {
  const [step, setStep] = useState(0);
  const finish = useFinish(user);
  const form = useForm<FreelancerOnboardingValues>({
    resolver: zodResolver(freelancerOnboardingSchema),
    defaultValues: { skills: [], bio: "" },
    mode: "onTouched",
  });
  const { errors } = form.formState;
  const stepFields: FieldPath<FreelancerOnboardingValues>[][] = [["skills"], ["hourlyRate", "availability"], ["bio"]];
  const steps = ["Abilități", "Tarif și disponibilitate", "Despre tine"];
  const bio = form.watch("bio") ?? "";

  const next = async () => {
    const ok = await form.trigger(stepFields[step]);
    if (!ok) return;
    if (step < steps.length - 1) return setStep(step + 1);
    const v = form.getValues();
    finish.mutate({ kind: "FREELANCER", ...v });
  };

  const titles = [
    { t: "Ce știi să faci?", s: "Alege abilitățile după care vrei să primești proiecte." },
    { t: "Tarif și disponibilitate", s: "Le folosim ca să-ți propunem doar proiecte realiste pentru tine." },
    { t: "Câteva cuvinte despre tine", s: "Clienții le văd lângă scorul de potrivire." },
  ];

  return (
    <WizardShell
      step={step}
      steps={steps}
      title={titles[step]?.t ?? ""}
      subtitle={titles[step]?.s ?? ""}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onNext={next}
      pending={finish.isPending}
      error={finish.isError ? getErrorMessage(finish.error) : undefined}
    >
      {step === 0 && (
        <Controller
          control={form.control}
          name="skills"
          render={({ field }) => <SkillPicker value={field.value} onChange={field.onChange} error={errors.skills?.message} />}
        />
      )}

      {step === 1 && (
        <>
          <Field id="hourlyRate" label="Tarif orientativ (lei/oră)" error={errors.hourlyRate?.message} hint="Poți modifica oricând din setări.">
            <div className="relative">
              <Input
                type="number"
                inputMode="numeric"
                min={20}
                max={2000}
                placeholder="ex. 100"
                className="pr-20"
                {...fieldA11y("hourlyRate", errors.hourlyRate?.message, true)}
                {...form.register("hourlyRate")}
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-small text-muted-foreground">lei/oră</span>
            </div>
          </Field>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Disponibilitate</legend>
            <Controller
              control={form.control}
              name="availability"
              render={({ field }) => (
                <div role="radiogroup" aria-label="Disponibilitate" className="grid gap-3 sm:grid-cols-2">
                  {availabilityOptions.map((o) => (
                    <ChoiceCard key={o.value} active={field.value === o.value} onClick={() => field.onChange(o.value)} title={o.label} hint={o.hint} />
                  ))}
                </div>
              )}
            />
            {errors.availability && <ErrorText>{errors.availability.message}</ErrorText>}
          </fieldset>
        </>
      )}

      {step === 2 && (
        <Field id="bio" label="Descriere scurtă" error={errors.bio?.message} hint={`${bio.length}/400 caractere`}>
          <Textarea
            rows={5}
            maxLength={400}
            placeholder="Ex.: Construiesc site-uri de prezentare rapide pentru afaceri locale. Lucrez cu WordPress și pun accent pe SEO."
            {...fieldA11y("bio", errors.bio?.message, true)}
            {...form.register("bio")}
          />
        </Field>
      )}
    </WizardShell>
  );
}

function SkillPicker({ value, onChange, error }: { value: string[]; onChange: (v: string[]) => void; error?: string | undefined }) {
  const { data: skills, isLoading } = useQuery(skillsQuery());
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => (skills ?? []).filter((s) => s.toLocaleLowerCase("ro").includes(q.trim().toLocaleLowerCase("ro"))),
    [skills, q],
  );
  const toggle = (s: string) => onChange(value.includes(s) ? value.filter((x) => x !== s) : [...value, s]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Caută abilități"
          aria-label="Caută abilități"
          className="pl-11"
        />
      </div>

      {value.length > 0 && (
        <div>
          <p className="section-label mb-2">Selectate ({value.length})</p>
          <ul className="flex flex-wrap gap-2">
            {value.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => toggle(s)}
                  aria-label={`Elimină ${s}`}
                  className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {s} <X className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="section-label mb-2">Sugestii</p>
        {isLoading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-small text-muted-foreground">Nicio abilitate găsită pentru „{q}”.</p>
        ) : (
          <ul className="flex flex-wrap gap-2" aria-label="Abilități disponibile">
            {filtered.map((s) => {
              const active = value.includes(s);
              return (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => toggle(s)}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors duration-200",
                      active
                        ? "border-primary bg-primary-soft text-primary-soft-foreground"
                        : "border-border bg-inset text-foreground hover:border-muted-foreground/40",
                    )}
                  >
                    {active && <Check className="size-3.5" aria-hidden />}
                    {s}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}

/* ---------------- Client ---------------- */

function ClientWizard({ user }: { user: User }) {
  const [step, setStep] = useState(0);
  const finish = useFinish(user);
  const { data: domains } = useQuery(domainsQuery());
  const form = useForm<ClientOnboardingValues>({
    resolver: zodResolver(clientOnboardingSchema),
    defaultValues: { domain: "", description: "" },
    mode: "onTouched",
  });
  const { errors } = form.formState;
  const stepFields: FieldPath<ClientOnboardingValues>[][] = [["clientType"], ["domain"], ["description"]];
  const steps = ["Tip de client", "Domeniu", "Descriere"];
  const desc = form.watch("description") ?? "";

  const next = async () => {
    const ok = await form.trigger(stepFields[step]);
    if (!ok) return;
    if (step < steps.length - 1) return setStep(step + 1);
    finish.mutate({ kind: "CLIENT", ...form.getValues() });
  };

  const titles = [
    { t: "Cum lucrezi cu noi?", s: "Ne ajută să-ți arătăm freelanceri obișnuiți cu proiecte ca ale tale." },
    { t: "În ce domeniu activezi?", s: "Domeniul contează la potrivire: experiența similară urcă scorul." },
    { t: "Spune-ne pe scurt despre tine", s: "Freelancerii văd această descriere când le propunem proiectul tău." },
  ];

  return (
    <WizardShell
      step={step}
      steps={steps}
      title={titles[step]?.t ?? ""}
      subtitle={titles[step]?.s ?? ""}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onNext={next}
      pending={finish.isPending}
      error={finish.isError ? getErrorMessage(finish.error) : undefined}
    >
      {step === 0 && (
        <fieldset>
          <legend className="sr-only">Tip de client</legend>
          <Controller
            control={form.control}
            name="clientType"
            render={({ field }) => (
              <div role="radiogroup" aria-label="Tip de client" className="grid gap-3 sm:grid-cols-2">
                <ChoiceCard active={field.value === "PERSOANA"} onClick={() => field.onChange("PERSOANA")} title="Persoană fizică" hint="Proiecte personale sau o afacere mică" icon={UserIcon} />
                <ChoiceCard active={field.value === "FIRMA"} onClick={() => field.onChange("FIRMA")} title="Firmă" hint="Proiecte în numele unei companii" icon={Building2} />
              </div>
            )}
          />
          {errors.clientType && <ErrorText>{errors.clientType.message}</ErrorText>}
        </fieldset>
      )}

      {step === 1 && (
        <fieldset>
          <legend className="sr-only">Domeniu</legend>
          <Controller
            control={form.control}
            name="domain"
            render={({ field }) => (
              <ul role="radiogroup" aria-label="Domeniu" className="flex flex-wrap gap-2">
                {(domains ?? []).map((d) => {
                  const active = field.value === d;
                  return (
                    <li key={d}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => field.onChange(d)}
                        className={cn(
                          "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors duration-200",
                          active ? "border-primary bg-primary-soft text-primary-soft-foreground" : "border-border bg-inset hover:border-muted-foreground/40",
                        )}
                      >
                        {active && <Check className="size-3.5" aria-hidden />}
                        {d}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          />
          {errors.domain && <ErrorText>{errors.domain.message}</ErrorText>}
        </fieldset>
      )}

      {step === 2 && (
        <Field id="description" label="Descriere scurtă" error={errors.description?.message} hint={`${desc.length}/400 caractere`}>
          <Textarea
            rows={5}
            maxLength={400}
            placeholder="Ex.: Am o frizerie în Cluj și vreau să primesc programări online."
            {...fieldA11y("description", errors.description?.message, true)}
            {...form.register("description")}
          />
        </Field>
      )}
    </WizardShell>
  );
}

/* ---------------- Shared bits ---------------- */

function ChoiceCard({
  active,
  onClick,
  title,
  hint,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  hint?: string;
  icon?: typeof UserIcon;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "relative flex min-h-16 cursor-pointer items-center gap-3 rounded-[18px] border p-4 text-left transition-colors duration-200",
        active ? "border-primary bg-primary-soft/50" : "border-border bg-inset hover:border-muted-foreground/40",
      )}
    >
      {Icon && (
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", active ? "bg-primary text-primary-foreground" : "bg-selected")}>
          <Icon className="size-5" aria-hidden />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        {hint && <span className="block text-small text-muted-foreground">{hint}</span>}
      </span>
      <span
        aria-hidden
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
          active ? "border-primary bg-primary text-primary-foreground" : "border-border",
        )}
      >
        {active && <Check className="size-3" />}
      </span>
    </button>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mt-2 flex items-center gap-1.5 text-small text-destructive">
      <AlertCircle className="size-3.5 shrink-0" aria-hidden /> {children}
    </p>
  );
}
