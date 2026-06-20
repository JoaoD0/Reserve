import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { BrenoChatFloating } from "@/components/BrenoChat";
import { supabase } from "@/lib/supabase";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Essa página não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Algo deu errado
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ocorreu um erro inesperado. Tente recarregar ou volte para o início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao início
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
      { title: "Reservê — Reserve mesas" },
      { name: "description", content: "Reserve mesas em restaurantes premium e acesse experiências exclusivas." },
      { property: "og:title", content: "Reservê" },
      { property: "og:description", content: "Reserve mesas em restaurantes premium e acesse experiências exclusivas." },
      { property: "og:type", content: "website" },
      { name: "theme-color", content: "#101012" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,300;1,9..144,400&family=Inter:wght@400;500;600;700&display=swap" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
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


function BrenoGlobal() {
  const [globalEnabled, setGlobalEnabled] = useState(() =>
    typeof localStorage !== "undefined" && localStorage.getItem("breno_global") === "true"
  );
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const handler = () => setGlobalEnabled(localStorage.getItem("breno_global") === "true");
    window.addEventListener("breno-toggle", handler);
    return () => window.removeEventListener("breno-toggle", handler);
  }, []);

  const isRestricted = pathname.startsWith("/owner") || pathname.startsWith("/admin");
  const isPerfilRoute = pathname.startsWith("/perfil");

  if (isRestricted) return null;
  if (!isPerfilRoute && !globalEnabled) return null;

  return <BrenoChatFloating />;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    if (!supabase) return;

    // If user didn't check "manter conectado" and this is a new browser session
    // (sessionStorage is cleared on browser close), sign them out automatically
    const keepLoggedIn = localStorage.getItem("reserve.keepLoggedIn");
    const sessionActive = sessionStorage.getItem("reserve.sessionActive");
    if (keepLoggedIn === "false" && !sessionActive) {
      supabase.auth.signOut();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        router.navigate({ to: "/reset-password" });
      }
      if (event === "SIGNED_IN" && !localStorage.getItem("reserve_onboarded")) {
        router.navigate({ to: "/onboarding" });
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster
        position="top-center"
        theme="dark"
        gap={8}
        toastOptions={{
          style: {
            background: "oklch(0.235 0.016 60)",
            border: "1px solid oklch(0.30 0.014 60 / 60%)",
            color: "oklch(0.96 0.012 80)",
            borderRadius: "0.875rem",
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "13px",
          },
        }}
      />
      <BrenoGlobal />
    </QueryClientProvider>
  );
}
