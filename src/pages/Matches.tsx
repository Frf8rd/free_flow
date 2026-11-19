import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { HelpCircle, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ImagePreview } from "@/components/common/ImagePreview";
import { EmptyState, ErrorState, PageHeader } from "@/components/common/states";
import { MatchCard, ProjectMatchCard } from "@/components/match/MatchCard";
import { matchRunQuery, myProjectsQuery, projectMatchesQuery } from "@/hooks/use-queries";
import { matchesService } from "@/services";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

const grid = "mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3";
const Skeletons = () => (
  <div className={grid}>
    {Array.from({ length: 3 }).map((_, i) => (
      <Skeleton key={i} className="h-72 rounded-[var(--radius-card)]" />
    ))}
  </div>
);

function FreelancerMatches() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery(projectMatchesQuery());
  if (isLoading) return <Skeletons />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  const visible = data?.filter((m) => m.status !== "DISMISSED") ?? [];
  if (!visible.length)
    return (
      <EmptyState
        icon={Sparkles}
        title="Nicio potrivire încă"
        text="Completează profilul și portofoliul ca să primești proiecte potrivite."
        action={
          <Button asChild>
            <Link to="/portfolio">Mergi la portofoliu</Link>
          </Button>
        }
      />
    );
  return (
    <div className={grid}>
      {visible.map((m) => (
        <ProjectMatchCard
          key={m.id}
          match={m}
          onChange={() => void qc.invalidateQueries({ queryKey: ["matches"] })}
        />
      ))}
    </div>
  );
}

function ClientMatches({ initialProject }: { initialProject?: string | undefined }) {
  const qc = useQueryClient();
  const projects = useQuery(myProjectsQuery());
  const open = projects.data?.filter((p) => p.status === "OPEN") ?? [];
  const [selected, setSelected] = useState<string | undefined>(initialProject);
  useEffect(() => {
    if (!selected && open[0]) setSelected(open[0].id);
  }, [selected, open]);
  const run = useQuery({ ...matchRunQuery(selected ?? ""), enabled: !!selected });
  const [refreshing, setRefreshing] = useState(false);
  const selectedProject = open.find((p) => p.id === selected);

  if (projects.isLoading) return <Skeletons />;
  if (projects.isError) return <ErrorState onRetry={() => void projects.refetch()} />;
  if (!open.length)
    return (
      <EmptyState
        icon={Sparkles}
        title="Nu ai proiecte deschise"
        text="Descrie ce ai nevoie și îți propunem freelanceri potriviți în câteva secunde."
        action={
          <Button asChild>
            <Link to="/projects/new">Postează un proiect</Link>
          </Button>
        }
      />
    );

  const status = run.data?.status;
  const searching = !run.data || status === "PENDING" || status === "RUNNING";
  const refresh = async () => {
    if (!selected) return;
    setRefreshing(true);
    await matchesService.refresh(selected);
    await qc.invalidateQueries({ queryKey: ["matches", "run", selected] });
    setRefreshing(false);
  };

  return (
    <>
      <div
        className="mt-6 flex flex-wrap items-center gap-2"
        role="tablist"
        aria-label="Proiectele tale"
      >
        {open.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={p.id === selected}
            onClick={() => setSelected(p.id)}
            className={cn(
              "max-w-[16rem] truncate rounded-full border px-4 py-1.5 text-small font-semibold transition-colors",
              p.id === selected
                ? "border-primary bg-primary-soft text-primary-soft-foreground"
                : "border-border hover:bg-selected",
            )}
          >
            {p.title}
          </button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          disabled={searching || refreshing}
          onClick={() => void refresh()}
        >
          <RefreshCw className={cn(refreshing && "animate-spin")} aria-hidden /> Reîmprospătează
        </Button>
      </div>

      {!!selectedProject?.imageUrls?.length && (
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {selectedProject.imageUrls.map((url, index) => (
            <ImagePreview
              key={`${url}-${index}`}
              src={url}
              alt={`${selectedProject.title} · imagine ${index + 1}`}
              className="size-20 shrink-0"
              imageClassName="size-20 object-cover"
            />
          ))}
        </div>
      )}

      {run.data?.clarification && !searching && (
        <aside className="mt-5 flex gap-3 rounded-[var(--radius-card)] border border-primary/30 bg-primary-soft p-5 text-primary-soft-foreground">
          <HelpCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">O întrebare ca să ajustăm potrivirile</p>
            <p className="mt-1 text-small">{run.data.clarification.question}</p>
          </div>
        </aside>
      )}

      {run.isError || status === "FAILED" ? (
        <div className="mt-6">
          <ErrorState text="Potrivirea a eșuat. Încearcă din nou." onRetry={() => void refresh()} />
        </div>
      ) : searching ? (
        <>
          <p
            role="status"
            className="mt-6 flex items-center gap-2 text-small font-semibold text-muted-foreground"
          >
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {status === "RUNNING"
              ? "Analizăm proiectul și comparăm profilurile…"
              : "Căutăm potriviri…"}
          </p>
          <Skeletons />
        </>
      ) : run.data!.matches.length ? (
        <div className={grid}>
          {run
            .data!.matches.filter((m) => m.status !== "DISMISSED")
            .map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                onChange={() =>
                  void qc.invalidateQueries({ queryKey: ["matches", "run", selected] })
                }
              />
            ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            title="Încă nu avem potriviri"
            text="Încearcă să adaugi mai multe detalii sau abilități în proiect."
          />
        </div>
      )}
    </>
  );
}

export function MatchesPage({ project }: { project?: string | undefined }) {
  const role = useAuthStore((s) => s.user?.role);
  const isFreelancer = role === "FREELANCER";
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        label="Potriviri"
        title={isFreelancer ? "Potriviri pentru mine" : "Freelanceri potriviți"}
        text={
          isFreelancer
            ? "Proiecte alese pentru tine după abilități, preț și disponibilitate — nu după număr de recenzii."
            : "Cei mai potriviți freelanceri pentru proiectul tău, fiecare cu explicația scorului."
        }
      />
      {isFreelancer ? <FreelancerMatches /> : <ClientMatches initialProject={project} />}
    </div>
  );
}
