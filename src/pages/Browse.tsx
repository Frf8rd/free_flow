import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/common/states";
import { TalentBadge } from "@/components/freelancer/TalentBadge";
import { TierBadge } from "@/components/freelancer/TierBadge";
import { browseQuery, categoriesQuery } from "@/hooks/use-queries";
import { availabilityLabel, formatRate } from "@/lib/format";
import { UserAvatar } from "@/components/common/UserAvatar";
import type { Availability, BrowseFilters } from "@/types";

const selectCls =
  "h-11 w-full rounded-[var(--radius-input)] border border-border bg-background px-3 text-sm";

export function BrowsePage() {
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [availability, setAvailability] = useState("");
  const [maxRate, setMaxRate] = useState("");
  const [page, setPage] = useState(1);
  const cats = useQuery(categoriesQuery());
  const filters: BrowseFilters = {
    q: q || undefined,
    categoryId: categoryId || undefined,
    availability: (availability || undefined) as Availability | undefined,
    maxRate: maxRate ? Number(maxRate) : undefined,
    page,
  };
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    ...browseQuery(filters),
    placeholderData: (prev) => prev,
  });
  const reset =
    <T,>(fn: (v: T) => void) =>
    (v: T) => {
      fn(v);
      setPage(1);
    };
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
      <p className="section-label">Explorează</p>
      <h1 className="mt-3 text-4xl md:text-5xl">Freelanceri</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Ordinea nu este plătită. Pentru potriviri personalizate, descrie proiectul după ce îți
        creezi cont.
      </p>

      <form
        role="search"
        onSubmit={(e) => e.preventDefault()}
        className="surface-card mt-8 grid gap-3 p-4 md:grid-cols-[1fr_12rem_11rem_8rem]"
      >
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            className="pl-9"
            value={q}
            onChange={(e) => reset(setQ)(e.target.value)}
            placeholder="Caută după nume sau abilitate"
            aria-label="Caută"
          />
        </div>
        <select
          className={selectCls}
          value={categoryId}
          onChange={(e) => reset(setCategoryId)(e.target.value)}
          aria-label="Categorie"
        >
          <option value="">Toate categoriile</option>
          {cats.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className={selectCls}
          value={availability}
          onChange={(e) => reset(setAvailability)(e.target.value)}
          aria-label="Disponibilitate"
        >
          <option value="">Orice disponibilitate</option>
          {(Object.keys(availabilityLabel) as Availability[])
            .filter((a) => a !== "UNAVAILABLE")
            .map((a) => (
              <option key={a} value={a}>
                {availabilityLabel[a]}
              </option>
            ))}
        </select>
        <Input
          type="number"
          min={0}
          value={maxRate}
          onChange={(e) => reset(setMaxRate)(e.target.value)}
          placeholder="Max €/h"
          aria-label="Tarif maxim"
        />
      </form>

      <div aria-busy={isFetching} className="mt-8">
        {isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : !isLoading && !data?.items.length ? (
          <EmptyState
            icon={SearchX}
            title="Niciun rezultat"
            text="Încearcă alte filtre sau șterge căutarea."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setQ("");
                  setCategoryId("");
                  setAvailability("");
                  setMaxRate("");
                }}
              >
                Șterge filtrele
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-[var(--radius-card)]" />
                ))
              : data?.items.map((f) => (
                  <li key={f.id}>
                    <Link
                      to="/freelancers/$id"
                      params={{ id: f.id }}
                      className="surface-card block h-full p-6 transition-all hover:-translate-y-0.5 hover:border-primary"
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={f.name}
                          imageUrl={f.avatarUrl}
                          className="size-11 text-sm"
                        />
                        <div className="min-w-0">
                          <p className="font-display text-lg">{f.name}</p>
                          <p className="truncate text-small text-muted-foreground">{f.headline}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {f.risingTalent && <TalentBadge />}
                        <TierBadge tier={f.tier} />
                      </div>
                      <p className="mt-4 text-small text-muted-foreground">
                        {f.skills.join(" · ")}
                      </p>
                      <p className="mt-2 text-small font-semibold">
                        {formatRate(f.hourlyRate)} · {availabilityLabel[f.availability]}
                      </p>
                    </Link>
                  </li>
                ))}
          </ul>
        )}
      </div>

      {pages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Paginare">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft aria-hidden /> Înapoi
          </Button>
          <span className="text-small text-muted-foreground">
            Pagina {page} din {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages}
            onClick={() => setPage(page + 1)}
          >
            Înainte <ChevronRight aria-hidden />
          </Button>
        </nav>
      )}
    </div>
  );
}
