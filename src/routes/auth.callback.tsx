import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let resolved = false;

    function resolve(ok: boolean) {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
      if (ok) {
        toast.success("Conta ativada.");
        navigate({ to: "/perfil" });
      } else {
        toast.error("Link expirado. Tente fazer login.");
        navigate({ to: "/login", search: { redirect: "/" } });
      }
    }

    // Listen for the SIGNED_IN event fired after PKCE code exchange completes
    const { data: { subscription } } = supabase!.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) resolve(true);
      else if (event === "SIGNED_OUT") resolve(false);
    });

    // Fast path: session already set (e.g. implicit flow or already logged in)
    supabase!.auth.getSession().then(({ data: { session } }) => {
      if (session) resolve(true);
    });

    // Fallback: if nothing fires within 8s, something went wrong
    const timeout = setTimeout(() => resolve(false), 8000);

    return () => {
      resolved = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center font-display text-xl text-primary">R</div>
        <p className="text-sm text-muted-foreground">Verificando sua conta…</p>
      </div>
    </div>
  );
}
