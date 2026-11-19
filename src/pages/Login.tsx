import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, fieldA11y } from "@/components/ui/field";
import { AuthCard } from "@/components/layout/AuthCard";
import { loginSchema, type LoginValues } from "@/lib/validation";
import { authService, getErrorMessage } from "@/services";
import { useAuthStore } from "@/store/auth";
import { useI18n } from "@/i18n";
import { GoogleSignInButton } from "@/components/layout/GoogleSignInButton";

export function LoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [showPw, setShowPw] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const { errors } = form.formState;

  const mutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (session) => {
      setSession(session);
      navigate({ to: session.user.profileComplete ? "/dashboard" : "/onboarding" });
    },
  });

  return (
    <AuthCard
      title={t("auth.back")}
      subtitle={t("auth.loginSubtitle")}
      footer={
        <>
          {t("auth.noAccount")}{" "}
          <Link
            to="/register"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            {t("auth.createOne")}
          </Link>
        </>
      }
    >
      <form
        noValidate
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        className="flex flex-col gap-5"
      >
        {mutation.isError && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-[16px] border border-destructive/40 bg-destructive/10 p-4 text-sm"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
            <span>{getErrorMessage(mutation.error)}</span>
          </div>
        )}

        <Field id="email" label={t("auth.email")} error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            placeholder="nume@exemplu.ro"
            {...fieldA11y("email", errors.email?.message)}
            {...form.register("email")}
          />
        </Field>

        <Field id="password" label={t("auth.password")} error={errors.password?.message}>
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              className="pr-14"
              {...fieldA11y("password", errors.password?.message)}
              {...form.register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? t("auth.hidePassword") : t("auth.showPassword")}
              className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
            >
              {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>

        <Button type="submit" size="lg" disabled={mutation.isPending} className="mt-2 w-full">
          {mutation.isPending && <Loader2 className="animate-spin" aria-hidden />}
          {mutation.isPending ? t("auth.checking") : t("auth.login")}
        </Button>

        {authService.demoAdminCredentials && (
          <p className="rounded-[14px] bg-inset p-3 text-[12px] text-muted-foreground">
            {t("auth.adminDemoHint")} <code>{authService.demoAdminCredentials.email}</code>
            {" / "}
            <code>{authService.demoAdminCredentials.password}</code>
          </p>
        )}
      </form>
      <GoogleSignInButton />
    </AuthCard>
  );
}
