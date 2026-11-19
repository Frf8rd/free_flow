import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Lightbulb, Send, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { formatBudget, formatDate, formatRate } from "@/lib/format";
import type { Match, MatchBreakdown, ProjectMatch } from "@/types";
import { Button } from "@/components/ui/button";
import { Bar } from "@/components/common/states";
import { ImagePreview } from "@/components/common/ImagePreview";
import { UserAvatar } from "@/components/common/UserAvatar";
import { ScoreRing } from "./ScoreRing";
import { TalentBadge } from "@/components/freelancer/TalentBadge";
import { TierBadge } from "@/components/freelancer/TierBadge";
import { matchesService, type MatchAction } from "@/services";
import { useI18n } from "@/i18n";

/** Reports the card once, when ≥ 50% of it has been visible (fairness: exposure is measured). */
function useImpression(id: string, enabled: boolean) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          void matchesService.reportImpressions([id]);
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [id, enabled]);
  return ref;
}

function Breakdown({ b }: { b: MatchBreakdown }) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <Bar label="Abilități" value={b.skills} />
      <Bar label="Preț" value={b.price} />
      <Bar label="Disponibilitate" value={b.availability} />
      <Bar label="Termen" value={b.deadline} />
    </div>
  );
}

function Why({ reasons, breakdown }: { reasons: string[]; breakdown: MatchBreakdown }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-5 rounded-[18px] bg-inset p-4">
      <p className="flex items-center gap-2 text-small font-semibold">
        <Lightbulb className="size-4 text-primary" aria-hidden />
        De ce se potrivește
      </p>
      <p className="mt-1 text-small text-muted-foreground">
        {reasons.join(", ").replace(/^./, (c) => c.toUpperCase())}.
      </p>
      {open && <Breakdown b={breakdown} />}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-3 inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
      >
        {open ? "Ascunde detaliile" : "Vezi detaliile scorului"}
        <ChevronDown
          className={cn("size-4 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
    </div>
  );
}

const doneLabel = {
  INVITED: "Invitat",
  INTERESTED: "Interes trimis",
  DISMISSED: "Ascuns",
} as const;

function Actions({
  id,
  status,
  primary,
  onDone,
}: {
  id: string;
  status: Match["status"];
  primary: Extract<MatchAction, "invite" | "interest">;
  onDone?: (() => void) | undefined;
}) {
  const [pending, setPending] = useState<MatchAction | null>(null);
  const run = async (a: MatchAction) => {
    setPending(a);
    try {
      await matchesService.act(id, a);
      onDone?.();
    } finally {
      setPending(null);
    }
  };
  if (status !== "NEW")
    return (
      <p className="mt-5 inline-flex items-center gap-2 text-small font-semibold text-success">
        <Check className="size-4" aria-hidden /> {doneLabel[status]}
      </p>
    );
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <Button size="sm" disabled={!!pending} onClick={() => run(primary)}>
        <Send aria-hidden /> {primary === "invite" ? "Invită la proiect" : "Sunt interesat"}
      </Button>
      <Button size="sm" variant="ghost" disabled={!!pending} onClick={() => run("dismiss")}>
        <X aria-hidden /> Nu acum
      </Button>
    </div>
  );
}

export function MatchCard({
  match,
  className,
  onChange,
}: {
  match: Match;
  className?: string;
  onChange?: () => void;
}) {
  const { freelancer: f } = match;
  const ref = useImpression(match.id, true);
  return (
    <article
      ref={ref}
      className={cn(
        "surface-card min-w-0 p-6",
        match.status === "DISMISSED" && "opacity-60",
        className,
      )}
      aria-label={`Potrivire: ${f.name}`}
    >
      <div className="flex items-start gap-4">
        <UserAvatar name={f.name} imageUrl={f.avatarUrl} className="size-12 text-sm" />
        <div className="min-w-0 flex-1">
          <Link
            to="/freelancers/$id"
            params={{ id: f.id }}
            className="block truncate font-display text-lg hover:text-primary"
          >
            {f.name}
          </Link>
          <p className="truncate text-small text-muted-foreground">{f.headline}</p>
        </div>
        <ScoreRing score={match.score} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {f.risingTalent && <TalentBadge />}
        <TierBadge tier={f.tier} />
        <span className="inline-flex items-center rounded-full border border-border px-2.5 text-[11px] font-semibold leading-5 text-muted-foreground">
          {formatRate(f.hourlyRate)}
        </span>
      </div>
      <Why reasons={match.reasons} breakdown={match.breakdown} />
      <Actions id={match.id} status={match.status} primary="invite" onDone={onChange} />
    </article>
  );
}

/** Freelancer mode: a recommended project. */
export function ProjectMatchCard({
  match,
  onChange,
}: {
  match: ProjectMatch;
  onChange?: () => void;
}) {
  const { locale } = useI18n();
  const p = match.project;
  const ref = useImpression(match.id, true);
  return (
    <article
      ref={ref}
      className={cn("surface-card min-w-0 p-6", match.status === "DISMISSED" && "opacity-60")}
      aria-label={`Proiect potrivit: ${p.title}`}
    >
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg">{p.title}</h3>
          <p className="mt-1 text-small text-muted-foreground">
            {p.categoryName} · {formatBudget(p.budget, locale)} · până la{" "}
            {formatDate(p.deadline, locale)}
          </p>
        </div>
        <ScoreRing score={match.score} />
      </div>
      <p className="mt-3 line-clamp-2 text-small text-muted-foreground">{p.description}</p>
      {!!p.imageUrls?.length && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {p.imageUrls.map((url, index) => (
            <ImagePreview
              key={`${url}-${index}`}
              src={url}
              alt={`${p.title} · imagine ${index + 1}`}
              className="size-20 shrink-0"
              imageClassName="size-20 object-cover"
            />
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {p.skills.map((s) => (
          <span
            key={s}
            className="rounded-full bg-selected px-2.5 text-[11px] font-semibold leading-5"
          >
            {s}
          </span>
        ))}
      </div>
      <Why reasons={match.reasons} breakdown={match.breakdown} />
      <Actions id={match.id} status={match.status} primary="interest" onDone={onChange} />
    </article>
  );
}
