import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Handshake, Package, Star } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, ErrorState, PageHeader } from "@/components/common/states";
import { engagementsQuery } from "@/hooks/use-queries";
import { engagementsService } from "@/services";
import { useAuthStore } from "@/store/auth";
import { formatBudget, formatDate, statusLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Engagement } from "@/types";

function ReviewForm({ e, onDone }: { e: Engagement; onDone: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const send = useMutation({
    mutationFn: () => engagementsService.review(e.id, { rating, comment }),
    onSuccess: () => {
      toast.success("Mulțumim pentru recenzie!");
      onDone();
    },
  });
  return (
    <div className="mt-4 rounded-[18px] bg-inset p-4">
      <p className="text-small font-semibold">Lasă o recenzie</p>
      <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Notă">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} stele`}
            onClick={() => setRating(n)}
          >
            <Star
              className={cn(
                "size-6",
                n <= rating ? "fill-primary text-primary" : "text-muted-foreground",
              )}
            />
          </button>
        ))}
      </div>
      <Textarea
        className="mt-3"
        rows={3}
        value={comment}
        onChange={(ev) => setComment(ev.target.value)}
        placeholder="Cum a fost colaborarea?"
      />
      <Button
        size="sm"
        className="mt-3"
        disabled={send.isPending || comment.trim().length < 5}
        onClick={() => send.mutate()}
      >
        Trimite recenzia
      </Button>
    </div>
  );
}

function EngagementCard({
  e,
  isClient,
  onChange,
}: {
  e: Engagement;
  isClient: boolean;
  onChange: () => void;
}) {
  const [ai, setAi] = useState(e.aiUsed);
  const move = useMutation({
    mutationFn: (s: "DELIVERED" | "COMPLETED") =>
      engagementsService.setStatus(e.id, s, s === "DELIVERED" ? ai : undefined),
    onSuccess: () => {
      toast.success("Stare actualizată.");
      onChange();
    },
  });
  const steps = ["IN_PROGRESS", "DELIVERED", "COMPLETED"] as const;
  const idx = steps.indexOf(e.status);
  return (
    <article className="surface-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg">{e.projectTitle}</h2>
          <p className="mt-1 text-small text-muted-foreground">
            {isClient ? `Freelancer: ${e.freelancer.name}` : `Client: ${e.client.name}`} ·{" "}
            {formatBudget(e.budget)} · început {formatDate(e.startedAt)}
          </p>
        </div>
        <Badge variant="outline">{statusLabel[e.status]}</Badge>
      </div>
      <ol className="mt-5 flex items-center gap-2" aria-label="Etape">
        {steps.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                i <= idx ? "bg-primary text-primary-foreground" : "bg-inset text-muted-foreground",
              )}
            >
              {i < idx ? <Check className="size-4" aria-hidden /> : i + 1}
            </span>
            <span className={cn("hidden text-small sm:inline", i === idx && "font-semibold")}>
              {statusLabel[s]}
            </span>
            {i < 2 && (
              <span className={cn("h-0.5 flex-1 rounded", i < idx ? "bg-primary" : "bg-inset")} />
            )}
          </li>
        ))}
      </ol>
      {!isClient && e.status === "IN_PROGRESS" && (
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-small">
            <input
              type="checkbox"
              checked={ai}
              onChange={(ev) => setAi(ev.target.checked)}
              className="size-4 accent-[var(--primary)]"
            />{" "}
            Am folosit instrumente AI
          </label>
          <Button size="sm" disabled={move.isPending} onClick={() => move.mutate("DELIVERED")}>
            <Package aria-hidden /> Marchează ca livrat
          </Button>
        </div>
      )}
      {isClient && e.status === "DELIVERED" && (
        <Button
          size="sm"
          className="mt-5"
          disabled={move.isPending}
          onClick={() => move.mutate("COMPLETED")}
        >
          <Check aria-hidden /> Acceptă și finalizează
        </Button>
      )}
      {e.status !== "IN_PROGRESS" && e.aiUsed && (
        <p className="mt-4 text-small text-muted-foreground">
          Freelancerul a declarat folosirea de AI.
        </p>
      )}
      {e.status === "COMPLETED" &&
        (e.review ? (
          <p className="mt-4 flex items-center gap-1 text-small">
            <Star className="size-4 fill-primary text-primary" aria-hidden /> {e.review.rating}/5 —{" "}
            {e.review.comment}
          </p>
        ) : (
          <ReviewForm e={e} onDone={onChange} />
        ))}
    </article>
  );
}

export function CollaborationsPage() {
  const qc = useQueryClient();
  const isClient = useAuthStore((s) => s.user?.role) !== "FREELANCER";
  const { data, isLoading, isError, refetch } = useQuery(engagementsQuery());
  const change = () => void qc.invalidateQueries({ queryKey: ["engagements"] });
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        label="Colaborări"
        title="Colaborările mele"
        text="Urmărește fiecare proiect de la început până la recenzie."
      />
      <div className="mt-8 space-y-4">
        {isLoading ? (
          <Skeleton className="h-48 rounded-[var(--radius-card)]" />
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : !data?.length ? (
          <EmptyState
            icon={Handshake}
            title="Nicio colaborare încă"
            text="Când un client și un freelancer se înțeleg, colaborarea apare aici."
          />
        ) : (
          data.map((e) => <EngagementCard key={e.id} e={e} isClient={isClient} onChange={change} />)
        )}
      </div>
    </div>
  );
}
