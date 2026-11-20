import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { NotFoundPage } from "@/pages/NotFound";
import { Toaster } from "@/components/ui/sonner";
import { rehydrateStores } from "@/store";
import { useApplyTheme } from "@/hooks/use-apply-theme";
import { I18nProvider } from "@/i18n";

// Runs before paint so a saved light/system preference never flashes dark. Key must match THEME_STORAGE_KEY.
const themeScript = `(function(){try{var t=(JSON.parse(localStorage.getItem("fairmatch-theme")||"{}").state||{}).theme||"dark";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);var l=localStorage.getItem("fairmatch-language");if(l==="ro"||l==="ru"||l==="en")document.documentElement.lang=l;}catch(e){}})();`;

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl">Pagina nu s-a încărcat</h1>
        <p className="mt-2 text-muted-foreground">
          A apărut o problemă. Încearcă din nou sau revino la pagina principală.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Încearcă din nou
          </button>
          <a
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-foreground hover:bg-selected"
          >
            Pagina principală
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FairMatch — Nu cel mai cunoscut. Cel mai potrivit." },
      {
        name: "description",
        content: "Platformă de freelancing cu potrivire automată între clienți și freelanceri.",
      },
      { property: "og:title", content: "FairMatch" },
      {
        property: "og:description",
        content: "Platformă de freelancing cu potrivire automată între clienți și freelanceri.",
      },
      { property: "og:image", content: "/fairmatch-logo.png" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "/fairmatch-logo.png" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "apple-touch-icon", href: "/fairmatch-mark.png" },
    ],
    scripts: [{ children: themeScript }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ro" className="dark" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    void rehydrateStores();
  }, []);
  useApplyTheme();

  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <Toaster />
      </QueryClientProvider>
    </I18nProvider>
  );
}
