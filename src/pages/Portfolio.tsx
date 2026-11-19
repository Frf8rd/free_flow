import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Images, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ImagePreview } from "@/components/common/ImagePreview";
import { ImageUpload } from "@/components/common/ImageUpload";
import { EmptyState, ErrorState, PageHeader } from "@/components/common/states";
import { portfolioQuery } from "@/hooks/use-queries";
import { getErrorMessage, portfolioService } from "@/services";
import type { PortfolioItem } from "@/types";

function ItemDialog({
  item,
  open,
  onClose,
}: {
  item: PortfolioItem | "new" | null;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const base = item && item !== "new" ? item : null;
  const [title, setTitle] = useState(base?.title ?? "");
  const [description, setDescription] = useState(base?.description ?? "");
  const [tags, setTags] = useState(base?.tags.join(", ") ?? "");
  const [images, setImages] = useState<File[]>([]);
  const save = useMutation({
    mutationFn: () =>
      portfolioService.save(
        {
          title: title.trim(),
          description: description.trim(),
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          images,
        },
        base?.id,
      ),
    onSuccess: () => {
      toast.success("Portofoliu actualizat.");
      void qc.invalidateQueries({ queryKey: ["portfolio"] });
      onClose();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{base ? "Editează lucrarea" : "Lucrare nouă"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="pt">Titlu</Label>
            <Input
              id="pt"
              className="mt-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="pd">Descriere</Label>
            <Textarea
              id="pd"
              className="mt-2"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="pg">Etichete (separate prin virgulă)</Label>
            <Input
              id="pg"
              className="mt-2"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
          <ImageUpload
            files={images}
            onFilesChange={setImages}
            existingImageUrls={base?.imageUrls}
          />
        </div>
        <DialogFooter>
          <Button
            disabled={save.isPending || title.trim().length < 3}
            onClick={() => save.mutate()}
          >
            Salvează
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PortfolioPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery(portfolioQuery());
  const [editing, setEditing] = useState<PortfolioItem | "new" | null>(null);
  const del = useMutation({
    mutationFn: portfolioService.remove,
    onSuccess: () => {
      toast.success("Lucrare ștearsă.");
      void qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        label="Portofoliu"
        title="Lucrările tale"
        text="Portofoliul contează în potrivire mai mult decât numărul de recenzii."
        action={
          <Button onClick={() => setEditing("new")}>
            <Plus aria-hidden /> Adaugă lucrare
          </Button>
        }
      />
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {isLoading ? (
          <Skeleton className="h-40 rounded-[var(--radius-card)]" />
        ) : isError ? (
          <div className="md:col-span-2">
            <ErrorState onRetry={() => void refetch()} />
          </div>
        ) : !data?.length ? (
          <div className="md:col-span-2">
            <EmptyState
              icon={Images}
              title="Portofoliul e gol"
              text="Adaugă 2–3 lucrări ca să apari în mai multe potriviri."
            />
          </div>
        ) : (
          data.map((p) => (
            <article key={p.id} className="surface-card p-6">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display text-lg">{p.title}</h2>
                <div className="flex shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditing(p)}
                    aria-label={`Editează ${p.title}`}
                  >
                    <Pencil aria-hidden />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => del.mutate(p.id)}
                    aria-label={`Șterge ${p.title}`}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </div>
              {!!p.imageUrls?.length && (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
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
              <p className="mt-2 text-small text-muted-foreground">{p.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-selected px-2.5 text-[11px] font-semibold leading-5"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </article>
          ))
        )}
      </div>
      {editing && (
        <ItemDialog
          key={editing === "new" ? "new" : editing.id}
          item={editing}
          open
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
