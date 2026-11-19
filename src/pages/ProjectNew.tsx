import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/common/states";
import { categoriesQuery, skillsQuery } from "@/hooks/use-queries";
import { getErrorMessage, projectsService } from "@/services";
import { cn } from "@/lib/utils";

const schema = z.object({
  description: z.string().trim().min(20, "Descrie proiectul în cel puțin 20 de caractere."),
  categoryId: z.string().min(1, "Alege o categorie."),
  budget: z.coerce
    .number({ invalid_type_error: "Introdu un buget." })
    .min(10, "Bugetul minim este 10 €."),
  deadline: z
    .string()
    .min(1, "Alege un termen.")
    .refine((d) => new Date(d) > new Date(), "Termenul trebuie să fie în viitor."),
});

export function ProjectNewPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const cats = useQuery(categoriesQuery());
  const skills = useQuery(skillsQuery());
  const [form, setForm] = useState({ description: "", categoryId: "", budget: "", deadline: "" });
  const [picked, setPicked] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const create = useMutation({
    mutationFn: projectsService.create,
    onSuccess: async (p) => {
      await qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Proiect postat. Căutăm potriviri…");
      void navigate({ to: "/matches", search: { project: p.id } });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) {
      setErrors(Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    setErrors({});
    create.mutate({ ...r.data, skills: picked });
  };
  const Err = ({ k }: { k: string }) =>
    errors[k] ? (
      <p role="alert" className="mt-1 text-small text-destructive">
        {errors[k]}
      </p>
    ) : null;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        label="Proiect nou"
        title="Postează un proiect"
        text="Scrie liber ce ai nevoie. Sistemul înțelege cererea și completează restul."
      />
      <form onSubmit={submit} noValidate className="surface-card mt-8 space-y-6 p-6 md:p-8">
        <div>
          <Label htmlFor="desc">Ce ai nevoie?</Label>
          <Textarea
            id="desc"
            rows={5}
            className="mt-2"
            value={form.description}
            onChange={set("description")}
            aria-invalid={!!errors["description"]}
            placeholder="Ex: Vreau un site pentru frizeria mea, cu programări online, în două săptămâni."
          />
          <Err k="description" />
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <Label htmlFor="cat">Categorie</Label>
            <select
              id="cat"
              value={form.categoryId}
              onChange={set("categoryId")}
              className="mt-2 h-11 w-full rounded-[var(--radius-input)] border border-border bg-background px-3 text-sm"
            >
              <option value="">Alege…</option>
              {cats.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Err k="categoryId" />
          </div>
          <div>
            <Label htmlFor="budget">Buget (€)</Label>
            <Input
              id="budget"
              type="number"
              min={0}
              className="mt-2"
              value={form.budget}
              onChange={set("budget")}
            />
            <Err k="budget" />
          </div>
          <div>
            <Label htmlFor="deadline">Termen</Label>
            <Input
              id="deadline"
              type="date"
              className="mt-2"
              value={form.deadline}
              onChange={set("deadline")}
            />
            <Err k="deadline" />
          </div>
        </div>
        <fieldset>
          <legend className="text-sm font-medium">
            Abilități{" "}
            <span className="font-normal text-muted-foreground">
              (opțional — cele neclare le deducem noi)
            </span>
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {skills.data?.map((s) => {
              const on = picked.includes(s);
              return (
                <button
                  type="button"
                  key={s}
                  aria-pressed={on}
                  onClick={() => setPicked((p) => (on ? p.filter((x) => x !== s) : [...p, s]))}
                  className={cn(
                    "rounded-full border px-3 py-1 text-small font-semibold transition-colors",
                    on
                      ? "border-primary bg-primary-soft text-primary-soft-foreground"
                      : "border-border hover:bg-selected",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </fieldset>
        <Button type="submit" size="lg" disabled={create.isPending}>
          {create.isPending ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <Sparkles aria-hidden />
          )}
          {create.isPending ? "Se postează…" : "Postează și găsește potriviri"}
        </Button>
      </form>
    </div>
  );
}
