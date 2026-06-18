import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { FloatingInput } from "./login";

export const Route = createFileRoute("/signup")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: (s.redirect as string) || "/" }),
  component: SignupPage,
});

function getWebmailUrl(email: string): string {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (domain === "gmail.com") return "https://mail.google.com";
  if (domain === "outlook.com" || domain === "hotmail.com" || domain === "live.com") return "https://outlook.live.com";
  if (domain === "yahoo.com" || domain === "yahoo.com.br") return "https://mail.yahoo.com";
  if (domain === "icloud.com" || domain === "me.com") return "https://www.icloud.com/mail";
  return `mailto:${email}`;
}

function SignupPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const setPassword = (v: string) => {
    setForm((f) => ({ ...f, password: v }));
    if (v.length > 0 && v.length < 8) setPasswordError("A senha deve ter pelo menos 8 caracteres");
    else setPasswordError(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Informe seu nome"); return; }
    if (form.password.length < 8) { setPasswordError("A senha deve ter pelo menos 8 caracteres"); return; }
    if (!isSupabaseConfigured || !supabase) {
      toast.error("Supabase não configurado. Adicione as variáveis de ambiente.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: form.name },
      },
    });
    setLoading(false);
    if (error) { toast.error("Não foi possível cadastrar", { description: error.message }); return; }
    // Supabase retorna identities vazio quando o email já está cadastrado
    if (data.user && data.user.identities?.length === 0) {
      toast.error("Esse e-mail já está cadastrado.", {
        description: "Tente fazer login ou recupere sua senha.",
        action: { label: "Entrar", onClick: () => navigate({ to: "/login", search: { redirect } }) },
      });
      return;
    }
    if (data.session) {
      toast.success("Conta criada! Bem-vindo ao Reservê.");
      navigate({ to: redirect || "/perfil" });
      return;
    }
    setSubmittedEmail(form.email);
    setEmailSent(true);
  };

  useEffect(() => {
    if (!emailSent || !supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        toast.success("E-mail confirmado! Bem-vindo ao Reservê.");
        navigate({ to: redirect || "/perfil" });
      }
    });
    return () => subscription.unsubscribe();
  }, [emailSent, navigate, redirect]);

  if (emailSent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="mx-auto w-full max-w-[480px] flex flex-col items-center px-6 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="size-24 rounded-full bg-primary/10 grid place-items-center mb-6">
            <Mail className="size-12 text-primary" />
          </motion.div>
          <h1 className="font-display text-3xl">Verifique seu e-mail</h1>
          <p className="text-sm text-muted-foreground mt-3 max-w-xs">
            Enviamos um link de confirmação para{" "}
            <span className="font-bold text-foreground">{submittedEmail}</span>.
            Clique no link para ativar sua conta.
          </p>
          <a href={getWebmailUrl(submittedEmail)}
            className="mt-8 w-full max-w-xs h-12 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2">
            <Mail className="size-4" /> Abrir meu e-mail
          </a>
          <button onClick={async () => { if (supabase) { await supabase.auth.resend({ type: "signup", email: submittedEmail }); toast.success("E-mail reenviado!"); } }}
            className="mt-3 text-sm text-primary font-bold">
            Reenviar e-mail
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="mx-auto w-full max-w-[480px] flex flex-col px-6 pt-6 pb-10">
        <button onClick={() => navigate({ to: "/" })} className="size-10 rounded-full bg-surface/60 border border-border/60 grid place-items-center">
          <ArrowLeft className="size-5" />
        </button>

        <div className="text-center mt-8">
          <span className="inline-flex size-14 rounded-full bg-primary/20 items-center justify-center font-display text-2xl text-primary">R</span>
          <h1 className="font-display text-3xl mt-4">Crie sua conta</h1>
          <p className="text-sm text-muted-foreground mt-1">Reserve em segundos. Cancele quando quiser.</p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-3">
          <FloatingInput type="text" label="Nome completo" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <FloatingInput type="email" label="E-mail" autoComplete="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <div>
            <FloatingInput type="password" label="Senha" autoComplete="new-password" value={form.password} onChange={setPassword} />
            {passwordError && <p className="mt-1.5 ml-1 text-xs font-bold text-red-400">{passwordError}</p>}
          </div>
          <button type="submit" disabled={loading} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-bold disabled:opacity-50 mt-2">
            {loading ? "Criando…" : "Criar conta"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Já tem conta? <Link to="/login" search={{ redirect }} className="text-primary font-bold">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
