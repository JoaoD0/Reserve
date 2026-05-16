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
    supabase!.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        toast.error("Link inválido ou expirado. Tente fazer login.");
        navigate({ to: "/login" });
        return;
      }
      if (session) {
        toast.success("E-mail confirmado! Bem-vindo ao Reservê.");
        navigate({ to: "/perfil" });
      } else {
        navigate({ to: "/login" });
      }
    });
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
