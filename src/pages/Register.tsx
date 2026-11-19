import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, Briefcase, Check, Eye, EyeOff, Laptop, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, fieldA11y } from "@/components/ui/field";
import { AuthCard } from "@/components/layout/AuthCard";
import { passwordStrength, registerSchema, type RegisterValues } from "@/lib/validation";
import { authService, getErrorMessage } from "@/services";
import { useAuthStore } from "@/store/auth";

const roleCards = [
  { value: "CLIENT" as const, title: "Client", text: "Am un proiect și caut freelancerul potrivit.", icon: Briefcase },
  { value: "FREELANCER" as const, title: "Freelancer", text: "Vreau să primesc proiecte potrivite pentru mine.", icon: Laptop },
];

export function RegisterPage({ initialRole }: { initialRole?: "client" | "freelancer" | undefined }) {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [showPw, setShowPw] = useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      ...(initialRole ? { role: initialRole === "client" ? ("CLIENT" as const) : ("FREELANCER" as const) } : {}),
      name: "",
      email: "",
      password: "",
    },
  });
  const { errors } = form.formState;
  const pw = form.watch("password");
  const strength = passwordStrength(pw ?? "");

  const mutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (session) => {
      setSession(session);
      navigate({ to: "/onboarding" });
    },
  });

  return (
    <AuthCard
      title="Creează cont"
      subtitle="Durează un minut. Potrivirile vin imediat după."
      footer={
        <>
          Ai deja cont?{" "}
          <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            Autentifică-te
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-5">
        {mutation.isError && (
          <div role="alert" className="flex items-start gap-3 rounded-[16px] border border-destructive/40 bg-destructive/10 p-4 text-sm">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
            <span>{getErrorMessage(mutation.error)}</span>
          </div>
        )}

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Ce tip de cont vrei?</legend>
          <Controller
            control={form.control}
            name="role"
            render={({ field }) => (
              <div role="radiogroup" aria-label="Tip de cont" className="grid grid-cols-2 gap-3">
                {roleCards.map((c) => {
                  const active = field.value === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => field.onChange(c.value)}
                      className={cn(
                        "relative flex cursor-pointer flex-col items-start gap-3 rounded-[20px] border p-4 text-left transition-colors duration-200",
                        active ? "border-primary bg-primary-soft/50" : "border-border bg-inset hover:border-muted-foreground/40",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-10 items-center justify-center rounded-full transition-colors",
                          active ? "bg-primary text-primary-foreground" : "bg-selected text-foreground",
                        )}
                      >
                        <c.icon className="size-5" aria-hidden />
                      </span>
                      <span>
                        <span className="block font-semibold">{c.title}</span>
                        <span className="mt-0.5 block text-small text-muted-foreground">{c.text}</span>
                      </span>
                      {active && (
                        <span className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-3.5" aria-hidden />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          />
          {errors.role && (
            <p role="alert" className="mt-2 flex items-center gap-1.5 text-small text-destructive">
              <AlertCircle className="size-3.5" aria-hidden /> {errors.role.message}
            </p>
          )}
        </fieldset>

        <Field id="name" label="Nume complet" error={errors.name?.message}>
          <Input autoComplete="name" placeholder="Nume Prenume" {...fieldA11y("name", errors.name?.message)} {...form.register("name")} />
        </Field>

        <Field id="email" label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" placeholder="nume@exemplu.ro" {...fieldA11y("email", errors.email?.message)} {...form.register("email")} />
        </Field>

        <Field
          id="password"
          label="Parolă"
          error={errors.password?.message}
          hint={
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-1" aria-hidden>
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors duration-200",
                      pw && i < Math.max(1, strength.score) ? (strength.score >= 3 ? "bg-primary" : "bg-coral") : "bg-inset",
                    )}
                  />
                ))}
              </div>
              <span>
                {pw ? `Putere: ${strength.label}. ` : ""}Minimum 8 caractere, cu litere și cifre.
              </span>
            </div>
          }
        >
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              className="pr-14"
              {...fieldA11y("password", errors.password?.message, true)}
              {...form.register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Ascunde parola" : "Arată parola"}
              className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
            >
              {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>

        <Button type="submit" size="lg" disabled={mutation.isPending} className="mt-2 w-full">
          {mutation.isPending && <Loader2 className="animate-spin" aria-hidden />}
          {mutation.isPending ? "Se creează contul…" : "Creează cont"}
        </Button>
      </form>
    </AuthCard>
  );
}
