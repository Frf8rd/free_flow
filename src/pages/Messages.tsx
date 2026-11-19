import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ImagePreview } from "@/components/common/ImagePreview";
import { ImageUpload } from "@/components/common/ImageUpload";
import { EmptyState, ErrorState, PageHeader } from "@/components/common/states";
import { conversationsQuery, messagesQuery } from "@/hooks/use-queries";
import { getErrorMessage, messagesService } from "@/services";
import { initials, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { toast } from "sonner";

function Chat({ id, onBack }: { id: string; onBack: () => void }) {
  const { locale, t } = useI18n();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(messagesQuery(id));
  const [text, setText] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [data?.length]);
  useEffect(() => {
    void messagesService
      .markRead(id)
      .then(() => qc.invalidateQueries({ queryKey: ["conversations"] }));
  }, [id, qc]);
  const send = useMutation({
    mutationFn: ({ body, files }: { body: string; files: File[] }) =>
      messagesService.send(id, body, files),
    onSuccess: () => {
      setText("");
      setImages([]);
      void qc.invalidateQueries({ queryKey: ["conversations", id, "messages"] });
      void qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  return (
    <div className="flex h-full min-h-0 flex-col">
      <button
        onClick={onBack}
        className="mb-3 inline-flex items-center gap-1 text-small font-semibold md:hidden"
      >
        <ArrowLeft className="size-4" aria-hidden /> Conversații
      </button>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1" aria-live="polite">
        {isLoading ? (
          <Skeleton className="h-16 w-2/3 rounded-2xl" />
        ) : (
          data?.map((m) => {
            const mine = m.authorId === "me";
            return (
              <div key={m.id} className={cn("flex", mine && "justify-end")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                    mine ? "bg-primary text-primary-foreground" : "bg-inset",
                  )}
                >
                  {m.body && <p>{m.body}</p>}
                  {!!m.imageUrls?.length && (
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {m.imageUrls.map((url, index) => (
                        <ImagePreview
                          key={`${url}-${index}`}
                          src={url}
                          alt={`${t("upload.image")} ${index + 1}`}
                          className="overflow-hidden rounded-lg"
                          imageClassName="aspect-square w-28 object-cover"
                        />
                      ))}
                    </div>
                  )}
                  <p
                    className={cn(
                      "mt-1 text-[11px]",
                      mine ? "text-primary-foreground/70" : "text-muted-foreground",
                    )}
                  >
                    {timeAgo(m.createdAt, locale)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={end} />
      </div>
      <div className="mt-3 space-y-3">
        <ImageUpload
          compact
          label={t("upload.messageImages")}
          files={images}
          onFilesChange={setImages}
        />
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim() || images.length) {
              send.mutate({ body: text.trim(), files: images });
            }
          }}
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Scrie un mesaj…"
            aria-label="Mesaj"
          />
          <Button
            type="submit"
            disabled={send.isPending || (!text.trim() && !images.length)}
            aria-label="Trimite"
          >
            <Send aria-hidden />
          </Button>
        </form>
      </div>
    </div>
  );
}

export function MessagesPage() {
  const { locale, t } = useI18n();
  const { data, isLoading, isError, refetch } = useQuery(conversationsQuery());
  const [active, setActive] = useState<string | null>(null);
  const current = active ?? undefined;
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader label="Mesaje" title="Conversații" />
      <div className="mt-8">
        {isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : !isLoading && !data?.length ? (
          <EmptyState
            icon={MessageSquare}
            title="Nicio conversație"
            text="Conversațiile apar după ce inviți un freelancer sau îți arată cineva interes."
          />
        ) : (
          <div className="surface-card grid h-[34rem] gap-4 p-4 md:grid-cols-[19rem_1fr]">
            <ul className={cn("min-h-0 space-y-1 overflow-y-auto", current && "hidden md:block")}>
              {isLoading ? (
                <Skeleton className="h-16 rounded-xl" />
              ) : (
                data?.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setActive(c.id)}
                      aria-current={c.id === current}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-[var(--radius-item)] p-3 text-left transition-colors hover:bg-selected",
                        c.id === current && "bg-selected",
                      )}
                    >
                      <span
                        aria-hidden
                        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-soft-foreground"
                      >
                        {initials(c.participant.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex justify-between gap-2">
                          <span className="truncate font-semibold">{c.participant.name}</span>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {timeAgo(c.lastMessageAt, locale)}
                          </span>
                        </span>
                        <span className="block truncate text-small text-muted-foreground">
                          {c.projectTitle}
                        </span>
                        <span className="block truncate text-small">
                          {c.lastMessage === "📷" ? t("message.imageSent") : c.lastMessage}
                        </span>
                      </span>
                      {c.unread > 0 && (
                        <span
                          className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground"
                          aria-label={`${c.unread} necitite`}
                        >
                          {c.unread}
                        </span>
                      )}
                    </button>
                  </li>
                ))
              )}
            </ul>
            <div
              className={cn(
                "min-h-0 md:border-l md:border-border md:pl-4",
                !current && "hidden md:block",
              )}
            >
              {current ? (
                <Chat key={current} id={current} onBack={() => setActive(null)} />
              ) : (
                <p className="flex h-full items-center justify-center text-small text-muted-foreground">
                  Alege o conversație.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
