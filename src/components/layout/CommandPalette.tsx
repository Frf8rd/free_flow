import { useNavigate } from "@tanstack/react-router";
import { LogOut, Monitor, Moon, Sun } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { navLabel, quickActions, visibleNav, type AppPath } from "@/lib/navigation";
import { useAuthStore } from "@/store/auth";
import { useSidebarStore } from "@/store/sidebar";
import { useThemeStore } from "@/store/theme";

export function CommandPalette() {
  const open = useSidebarStore((s) => s.commandOpen);
  const setOpen = useSidebarStore((s) => s.setCommandOpen);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const setTheme = useThemeStore((s) => s.setTheme);
  const navigate = useNavigate();

  if (!user) return null;

  const go = (to: AppPath) => {
    setOpen(false);
    navigate({ to });
  };

  const pages = visibleNav(user.role).flatMap((item) =>
    item.children
      ? item.children.map((c) => ({ key: c.to, label: `${navLabel(item, user.role)} · ${c.label}`, to: c.to, icon: item.icon }))
      : item.to
        ? [{ key: item.to, label: navLabel(item, user.role), to: item.to, icon: item.icon }]
        : [],
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <DialogTitle className="sr-only">Caută în FairMatch</DialogTitle>
      <DialogDescription className="sr-only">Pagini și acțiuni rapide</DialogDescription>
      <CommandInput placeholder="Caută pagini sau acțiuni…" />
      <CommandList className="max-h-[380px] p-1">
        <CommandEmpty>Niciun rezultat.</CommandEmpty>
        <CommandGroup heading="Pagini">
          {pages.map((p) => (
            <CommandItem key={p.key} value={p.label} onSelect={() => go(p.to)}>
              <p.icon aria-hidden /> {p.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Acțiuni rapide">
          {quickActions(user.role).map((a) => (
            <CommandItem key={a.label} value={a.label} onSelect={() => go(a.to)}>
              <a.icon aria-hidden /> {a.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Temă">
          <CommandItem value="Temă luminoasă" onSelect={() => setTheme("light")}>
            <Sun aria-hidden /> Temă luminoasă
          </CommandItem>
          <CommandItem value="Temă întunecată" onSelect={() => setTheme("dark")}>
            <Moon aria-hidden /> Temă întunecată
          </CommandItem>
          <CommandItem value="Temă după sistem" onSelect={() => setTheme("system")}>
            <Monitor aria-hidden /> Temă după sistem
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Cont">
          <CommandItem
            value="Deconectare"
            onSelect={() => {
              setOpen(false);
              logout();
              navigate({ to: "/" });
            }}
          >
            <LogOut aria-hidden /> Deconectare
            <CommandShortcut />
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
