import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { notificationsQuery, useSidebarCounts } from "@/hooks/use-queries";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

export function NotificationsButton() {
  const { data: counts } = useSidebarCounts();
  const { data: items, isLoading } = useQuery(notificationsQuery());
  const unread = counts?.unreadNotifications ?? 0;

  return (
    <Popover>
      <PopoverTrigger
        aria-label={unread ? `Notificări, ${unread} necitite` : "Notificări"}
        className="relative flex size-11 cursor-pointer items-center justify-center rounded-full border border-border bg-panel text-muted-foreground transition-colors hover:bg-selected hover:text-foreground"
      >
        <Bell className="size-[18px]" aria-hidden />
        {unread > 0 && (
          <span aria-hidden className="absolute right-2.5 top-2.5 size-2 rounded-full bg-coral ring-2 ring-panel" />
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-2">
        <p className="section-label px-3 pb-2 pt-2">Notificări</p>
        {isLoading ? (
          <div className="flex flex-col gap-2 p-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : (
          <ul className="flex flex-col">
            {items?.map((n) => (
              <li key={n.id} className="flex gap-3 rounded-[14px] px-3 py-2.5 transition-colors hover:bg-selected/60">
                <span
                  aria-hidden
                  className={cn("mt-2 size-2 shrink-0 rounded-full", n.read ? "bg-border" : "bg-primary")}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {n.title}
                    {!n.read && <span className="sr-only"> (necitită)</span>}
                  </p>
                  <p className="text-small text-muted-foreground">{n.body}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{n.createdAt}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
