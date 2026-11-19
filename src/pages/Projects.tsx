import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, FilePlus2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState, PageHeader } from "@/components/common/states";
import { myProjectsQuery } from "@/hooks/use-queries";
import { projectsService } from "@/services";
import { formatBudget, formatDate, statusLabel } from "@/lib/format";
import { useI18n } from "@/i18n";

export function ProjectsPage({ archive = false }: { archive?: boolean }) {
  const { locale } = useI18n();
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery(myProjectsQuery());
  const refresh = () => qc.invalidateQueries({ queryKey: ["projects"] });
  const archiveIt = useMutation({
    mutationFn: (id: string) => projectsService.setStatus(id, "CANCELLED"),
    onSuccess: () => {
      toast.success("Proiect arhivat.");
      void refresh();
    },
  });
  const remove = useMutation({
    mutationFn: projectsService.remove,
    onSuccess: () => {
      toast.success("Proiect șters.");
      void refresh();
    },
  });
  const items =
    data?.filter((p) =>
      archive
        ? p.status === "COMPLETED" || p.status === "CANCELLED"
        : p.status === "OPEN" || p.status === "IN_PROGRESS",
    ) ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        label="Proiecte"
        title={archive ? "Arhivă" : "Proiecte active"}
        text={
          archive
            ? "Proiectele finalizate sau anulate."
            : "Proiectele tale deschise sau în desfășurare."
        }
        action={
          !archive && (
            <Button asChild>
              <Link to="/projects/new">
                <FilePlus2 aria-hidden /> Proiect nou
              </Link>
            </Button>
          )
        }
      />
      <div className="mt-8 space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-[var(--radius-card)]" />
          ))
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : !items.length ? (
          <EmptyState
            icon={archive ? Archive : FilePlus2}
            title={archive ? "Arhiva e goală" : "Niciun proiect activ"}
            text={
              archive
                ? undefined
                : "Postează primul proiect și primești potriviri în câteva secunde."
            }
            action={
              !archive && (
                <Button asChild>
                  <Link to="/projects/new">Postează un proiect</Link>
                </Button>
              )
            }
          />
        ) : (
          items.map((p) => (
            <article key={p.id} className="surface-card flex flex-wrap items-center gap-4 p-5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-lg">{p.title}</h2>
                  <Badge variant="outline">{statusLabel[p.status]}</Badge>
                </div>
                <p className="mt-1 text-small text-muted-foreground">
                  {p.categoryName} · {formatBudget(p.budget, locale)} · termen {formatDate(p.deadline, locale)}
                </p>
              </div>
              <div className="flex gap-2">
                {p.status === "OPEN" && (
                  <Button size="sm" variant="soft" asChild>
                    <Link to="/matches" search={{ project: p.id }}>
                      <Sparkles aria-hidden /> Potriviri
                    </Link>
                  </Button>
                )}
                {!archive && p.status === "OPEN" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => archiveIt.mutate(p.id)}
                    aria-label={`Arhivează ${p.title}`}
                  >
                    <Archive aria-hidden />
                  </Button>
                )}
                {archive && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove.mutate(p.id)}
                    aria-label={`Șterge ${p.title}`}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
