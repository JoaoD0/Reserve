import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: (s.redirect as string) || "/" }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Digite um e-mail válido").max(255),
  password: z.string().min(6, "Mínimo de 6 caracteres").max(72),
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setLoading(true);
    const { error } = await supabase!.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error?.message?.includes("Email not confirmed")) {
      toast.error("Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.");
      return;
    }
    if (error) { toast.error("Não foi possível entrar", { description: error.message }); return; }
    localStorage.setItem("reserve.keepLoggedIn", keepLoggedIn ? "true" : "false");
    sessionStorage.setItem("reserve.sessionActive", "1");
    toast.success("Bem-vindo de volta!");
    navigate({ to: redirect });
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pt-6 pb-10 bg-background">
      <button onClick={() => navigate({ to: "/" })} className="size-10 rounded-full bg-surface/60 border border-border/60 grid place-items-center">
        <ArrowLeft className="size-5" />
      </button>

      <div className="text-center mt-8">
        <span className="inline-flex size-14 rounded-full bg-primary/20 items-center justify-center font-display text-2xl text-primary">R</span>
        <h1 className="font-display text-3xl mt-4">Bem-vindo!</h1>
        <p className="text-sm text-muted-foreground mt-1">Entre para gerenciar suas reservas</p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-3">
        <FloatingInput type="email" label="E-mail" autoComplete="email" value={email} onChange={setEmail} />
        <FloatingInput type="password" label="Senha" autoComplete="current-password" value={password} onChange={setPassword} />

        <label className="flex items-center gap-2 pt-1 select-none cursor-pointer">
          <input type="checkbox" checked={keepLoggedIn} onChange={(e) => setKeepLoggedIn(e.target.checked)} className="peer sr-only" />
          <span className="grid place-items-center size-5 rounded-md border border-border/60 bg-surface transition-all peer-checked:bg-primary peer-checked:border-primary">
            <svg viewBox="0 0 16 16" className={`size-3 transition-opacity ${keepLoggedIn ? "opacity-100" : "opacity-0"}`} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 8.5 6.5 12 13 4.5" />
            </svg>
          </span>
          <span className="text-sm text-foreground">Manter conectado</span>
        </label>

        <Link to="/forgot-password" className="block text-right text-xs font-bold text-primary">Esqueci minha senha</Link>

        <button type="submit" disabled={loading} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-bold disabled:opacity-50">
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-8">
        Novo por aqui? <Link to="/signup" search={{ redirect }} className="text-primary font-bold">Criar conta</Link>
      </p>
    </div>
  );
}

export function FloatingInput({ type, label, value, onChange, autoComplete }: {
  type: string; label: string; value: string; onChange: (v: string) => void; autoComplete?: string;
}) {
  const [focus, setFocus] = useState(false);
  const float = focus || value.length > 0;
  return (
    <label className="relative block">
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        className="w-full h-14 px-4 pt-4 rounded-xl bg-surface/60 border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      <span className={`absolute left-4 transition-all pointer-events-none ${float ? "top-1.5 text-[10px] font-bold text-primary uppercase tracking-wider" : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground"}`}>
        {label}
      </span>
    </label>
  );
}
