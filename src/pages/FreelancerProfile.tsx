import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, Languages, Pencil, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ImagePreview } from "@/components/common/ImagePreview";
import { UserAvatar } from "@/components/common/UserAvatar";
import { TalentBadge } from "@/components/freelancer/TalentBadge";
import { TierBadge } from "@/components/freelancer/TierBadge";
import { freelancerQuery, myFreelancerProfileQuery, reviewsQuery } from "@/hooks/use-queries";
import { availabilityLabel, formatDate, formatRate } from "@/lib/format";
import { useAuthStore } from "@/store/auth";
import { useI18n } from "@/i18n";

export function FreelancerProfilePage({ id }: { id: string }) {
  const { locale, t } = useI18n();
  const { data: f, isLoading } = useQuery(freelancerQuery(id));
  const reviews = useQuery(reviewsQuery(id));
  const role = useAuthStore((s) => s.user?.role);
  const myProfile = useQuery({
    ...myFreelancerProfileQuery(),
    enabled: role === "FREELANCER",
  });
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
              {f.avatarUrl ? (
                <ImagePreview
                  src={f.avatarUrl}
                  alt={`${f.name} · ${t("profile.avatar")}`}
                  className="size-20 rounded-full"
                  imageClassName="size-20 object-cover"
                />
              ) : (
                <UserAvatar name={f.name} className="size-20 text-2xl" />
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl md:text-4xl">{f.name}</h1>
                <p className="text-muted-foreground">{f.headline}</p>
                <p
                  className="mt-2 flex items-center gap-1 text-sm font-semibold"
                  aria-label={
                    f.rating === null
                      ? t("profile.noReviews")
                      : `${t("profile.averageRating")}: ${f.rating.toFixed(1)}`
                  }
                >
                  <Star
                    className="size-4"
                    aria-hidden
                    fill={f.rating === null ? "none" : "currentColor"}
                  />
                  {f.rating === null
                    ? t("profile.noReviews")
                    : `${f.rating.toFixed(1)} · ${f.reviewsCount} ${t("profile.reviews")}`}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {f.risingTalent && <TalentBadge />}
                  <TierBadge tier={f.tier} />
                </div>
              </div>
              {role === "CLIENT" ? (
                <Button asChild size="lg">
                  <Link to="/matches">Invită la un proiect</Link>
                </Button>
              ) : role === "FREELANCER" && myProfile.data?.id === f.id ? (
                <Button asChild size="lg" variant="outline">
                  <Link to="/settings">
                    <Pencil aria-hidden />
                    {t("profile.edit")}
                  </Link>
                </Button>
              ) : null}
            </div>
            <dl className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2 lg:grid-cols-3">
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
              <div>
                <dt className="text-small text-muted-foreground">
                  {t("profile.projectsCompleted")}
                </dt>
                <dd className="font-semibold">{f.completedProjects}</dd>
              </div>
              {f.location && (
                <div>
                  <dt className="text-small text-muted-foreground">{t("profile.location")}</dt>
                  <dd className="font-semibold">{f.location}</dd>
                </div>
              )}
              {f.experienceYears !== undefined && (
                <div>
                  <dt className="text-small text-muted-foreground">{t("profile.experience")}</dt>
                  <dd className="font-semibold">
                    {f.experienceYears} {t("profile.experienceYears")}
                  </dd>
                </div>
              )}
              {f.website && (
                <div>
                  <dt className="text-small text-muted-foreground">{t("profile.website")}</dt>
                  <dd>
                    <a
                      href={f.website}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all font-semibold text-primary hover:underline"
                    >
                      {f.website}
                    </a>
                  </dd>
                </div>
              )}
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
                  {!!p.imageUrls?.length && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {p.imageUrls.map((url, index) => (
                        <ImagePreview
                          key={`${url}-${index}`}
                          src={url}
                          alt={`${p.title} · imagine ${index + 1}`}
                          className="w-full"
                          imageClassName="aspect-video w-full object-cover"
                        />
                      ))}
                    </div>
                  )}
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
                <p className="text-small text-muted-foreground">{t("profile.noReviews")}</p>
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
