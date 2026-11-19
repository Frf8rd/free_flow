import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, Languages, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TalentBadge } from "@/components/freelancer/TalentBadge";
import { TierBadge } from "@/components/freelancer/TierBadge";
import { freelancerQuery, reviewsQuery } from "@/hooks/use-queries";
import { availabilityLabel, formatDate, formatRate, initials } from "@/lib/format";
import { useAuthStore } from "@/store/auth";
import { useI18n } from "@/i18n";

export function FreelancerProfilePage({ id }: { id: string }) {
  const { locale } = useI18n();
  const { data: f, isLoading } = useQuery(freelancerQuery(id));
  const reviews = useQuery(reviewsQuery(id));
  const role = useAuthStore((s) => s.user?.role);
  return (
    <div className="mx-auto max-w-4xl px-5 py-16 md:px-8">
      {isLoading ? (
        <Skeleton className="h-64 rounded-[var(--radius-card)]" />
      ) : !f ? (
        <div className="surface-card p-10 text-center">
          <h1 className="text-3xl">Profil negăsit</h1>
          <Button asChild className="mt-6">
            <Link to="/browse">Înapoi la freelanceri</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <article className="surface-card p-8">
            <div className="flex flex-wrap items-center gap-5">
              <span
                aria-hidden
                className="flex size-20 items-center justify-center rounded-full bg-primary-soft text-2xl font-semibold text-primary-soft-foreground"
              >
                {initials(f.name)}
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl md:text-4xl">{f.name}</h1>
                <p className="text-muted-foreground">{f.headline}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {f.risingTalent && <TalentBadge />}
                  <TierBadge tier={f.tier} />
                </div>
              </div>
              {role === "CLIENT" && (
                <Button asChild size="lg">
                  <Link to="/matches">Invită la un proiect</Link>
                </Button>
              )}
            </div>
            <dl className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-3">
              <div>
                <dt className="text-small text-muted-foreground">Tarif</dt>
                <dd className="font-semibold">{formatRate(f.hourlyRate)}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-small text-muted-foreground">
                  <Clock className="size-3.5" aria-hidden /> Disponibilitate
                </dt>
                <dd className="font-semibold">{availabilityLabel[f.availability]}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-small text-muted-foreground">
                  <Languages className="size-3.5" aria-hidden /> Limbi
                </dt>
                <dd className="font-semibold">{f.languages.join(", ")}</dd>
              </div>
            </dl>
            <p className="mt-6 text-muted-foreground">{f.about}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {f.skills.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-selected px-3 py-1 text-small font-semibold"
                >
                  {s}
                </span>
              ))}
            </div>
          </article>

          <section aria-labelledby="pf">
            <h2 id="pf" className="text-2xl">
              Portofoliu
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {f.portfolio.map((p) => (
                <article key={p.id} className="surface-card p-5">
                  <h3 className="font-display text-lg">{p.title}</h3>
                  <p className="mt-1 text-small text-muted-foreground">{p.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-border px-2.5 text-[11px] font-semibold leading-5"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="rv">
            <h2 id="rv" className="text-2xl">
              Recenzii
            </h2>
            <div className="mt-4 space-y-3">
              {reviews.isLoading ? (
                <Skeleton className="h-20 rounded-[var(--radius-card)]" />
              ) : !reviews.data?.length ? (
                <p className="text-small text-muted-foreground">
                  Încă fără recenzii — potrivirea se face pe abilități și portofoliu, nu pe
                  recenzii.
                </p>
              ) : (
                reviews.data.map((r) => (
                  <article key={r.id} className="surface-card p-5">
                    <p className="flex items-center gap-1 text-small font-semibold">
                      <Star className="size-4 fill-primary text-primary" aria-hidden /> {r.rating}/5{" "}
                      <span className="font-normal text-muted-foreground">
                        · {r.projectTitle} · {formatDate(r.createdAt, locale)}
                      </span>
                    </p>
                    <p className="mt-2 text-small">{r.comment}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
