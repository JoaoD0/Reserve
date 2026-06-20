import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { FloatingInput } from "@/components/FloatingInput";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPassword,
  head: () => ({ meta: [{ title: "Recuperar senha — Reservê" }] }),
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!sent) return;
    setCountdown(15);
  }, [sent]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function handleResend() {
    if (!supabase || countdown > 0) return;
    setResending(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setResending(false);
    setCountdown(15);
    toast.success("E-mail reenviado!");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (!isSupabaseConfigured || !supabase) {
      await new Promise((r) => setTimeout(r, 1000));
      setSent(true);
      toast.success("E-mail enviado.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setLoading(false);
    if (error) {
      if (error.message.includes("rate limit") || error.status === 429) {
        toast.error("Aguarde alguns minutos antes de tentar novamente.");
      } else {
        toast.error("Não foi possível enviar o e-mail.", { description: error.message });
      }
    } else {
      setSent(true);
      toast.success("E-mail enviado.");
    }
  }

  return (
    <div className="min-h-screen bg-noir-gradient">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[480px] flex-col items-center justify-center px-5 py-10">
        {/* Back button */}
        <Link
          to="/login"
          search={{ redirect: "/" }}
          className="absolute left-5 top-12 flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-surface/60 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} />
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
          {sent ? (
            /* Success state */
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex h-24 w-24 items-center justify-center rounded-3xl border border-primary/20 bg-primary/10"
              >
                <Mail size={40} className="text-primary" strokeWidth={1.5} />
              </motion.div>
              <h1 className="font-display mt-6 text-2xl text-foreground">Email enviado!</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>

              <button
                onClick={handleResend}
                disabled={countdown > 0 || resending}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-full border border-border/60 bg-surface/60 py-3 text-sm font-medium text-foreground transition-opacity disabled:opacity-40"
              >
                {resending
                  ? <><Loader2 size={14} className="animate-spin" /> Reenviando...</>
                  : countdown > 0
                  ? `Reenviar e-mail (${countdown}s)`
                  : "Reenviar e-mail"
                }
              </button>

              <Link
                to="/login"
                search={{ redirect: "/" }}
                className="mt-4 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                Voltar ao login
              </Link>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <Logo size={36} />
              </div>

              <h1 className="font-display mt-8 text-center text-2xl text-foreground">
                Recuperar senha
              </h1>
              <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
                Informe seu email e enviaremos um link para você redefinir sua senha.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <FloatingInput
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 text-sm font-semibold text-accent-foreground transition-opacity disabled:opacity-60"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  Enviar link de recuperação
                </motion.button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
