import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Bell, Handshake, MessageSquare, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, EmptyState, PageHeader, StatCard } from "@/components/common/states";
import { MatchCard, ProjectMatchCard } from "@/components/match/MatchCard";
import { TierBadge } from "@/components/freelancer/TierBadge";
import { matchesQuery, projectMatchesQuery, useSidebarCounts } from "@/hooks/use-queries";
import { quickActions } from "@/lib/navigation";
import { tierName } from "@/mocks/tiers";
import { useAuthStore } from "@/store/auth";

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const counts = useSidebarCounts(!!user);
  const isFreelancer = user?.role === "FREELANCER";
  const clientMatches = useQuery({ ...matchesQuery(), enabled: !!user && !isFreelancer });
  const projectMatches = useQuery({ ...projectMatchesQuery(), enabled: isFreelancer });
  if (!user) return null;
  const c = counts.data;
  const loading = isFreelancer ? projectMatches.isLoading : clientMatches.isLoading;
  const tp = user.tierProgress;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        label="Dashboard"
        title={`Bună, ${user.name.split(" ")[0]}`}
        text={
          isFreelancer
            ? "Iată proiectele care ți se potrivesc și cum avansezi."
            : "Iată freelancerii potriviți pentru proiectele tale."
        }
      />

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Sparkles} label="Potriviri noi" value={c ? c.unseenMatches : "–"} />
        <StatCard icon={MessageSquare} label="Mesaje necitite" value={c ? c.unreadMessages : "–"} />
        <StatCard
          icon={Handshake}
          label="Colaborări active"
          value={c ? c.activeEngagements : "–"}
        />
        <StatCard icon={Bell} label="Notificări" value={c ? c.unreadNotifications : "–"} />
      </div>

      {isFreelancer && tp && (
        <section className="surface-card mt-6 p-6" aria-label="Progres treaptă">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
                <TrendingUp className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-display text-lg">Progresul tău</p>
                <p className="text-small text-muted-foreground">
                  {tp.nextTier
                    ? `Încă ${tp.projectsToNext} proiecte până la treapta ${tierName(tp.nextTier)}.`
                    : "Ai atins treapta maximă."}
                </p>
              </div>
            </div>
            <TierBadge tier={tp.tier} />
          </div>
          <div className="mt-4">
            <Bar
              label={`${tp.completedTowardsNext} din ${tp.requiredForNext} proiecte finalizate`}
              value={tp.percent}
            />
          </div>
        </section>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {quickActions(user.role).map((a) => (
          <Button key={a.label} variant="outline" size="sm" asChild>
            <Link to={a.to}>
              <a.icon aria-hidden /> {a.label}
            </Link>
          </Button>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-between gap-4">
        <h2 className="text-2xl">Potriviri recente</h2>
        <Button variant="ghost" asChild>
          <Link to="/matches">
            Vezi toate <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-[var(--radius-card)]" />
            ))
          : isFreelancer
            ? projectMatches.data?.slice(0, 3).map((m) => <ProjectMatchCard key={m.id} match={m} />)
            : clientMatches.data?.slice(0, 3).map((m) => <MatchCard key={m.id} match={m} />)}
      </div>
      {!loading && !(isFreelancer ? projectMatches.data?.length : clientMatches.data?.length) && (
        <EmptyState title="Nicio potrivire încă" text="Revino în curând — căutăm continuu." />
      )}
    </div>
  );
}
