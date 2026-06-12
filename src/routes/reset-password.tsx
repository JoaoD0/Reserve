import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { FloatingInput } from "@/components/FloatingInput";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
  head: () => ({ meta: [{ title: "Redefinir senha — Reservê" }] }),
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passError, setPassError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  function validate() {
    let valid = true;
    if (password.length < 8) {
      setPassError("A senha deve ter no mínimo 8 caracteres");
      valid = false;
    } else {
      setPassError("");
    }
    if (confirm.length > 0 && password !== confirm) {
      setConfirmError("As senhas não coincidem");
      valid = false;
    } else {
      setConfirmError("");
    }
    return valid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    if (!isSupabaseConfigured || !supabase) {
      await new Promise((r) => setTimeout(r, 1000));
      toast.success("Senha redefinida com sucesso!");
      setTimeout(() => navigate({ to: "/login", search: { redirect: "/" } }), 2000);
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Senha redefinida com sucesso!");
      setTimeout(() => navigate({ to: "/login", search: { redirect: "/" } }), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-noir-gradient">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col items-center justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
          <div className="flex justify-center">
            <Logo size={36} />
          </div>

          <h1 className="font-display mt-8 text-center text-2xl text-foreground">
            Redefinir senha
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Escolha uma nova senha para a sua conta
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-3">
            <FloatingInput
              label="Nova senha"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (e.target.value.length >= 8) setPassError("");
              }}
              required
              autoComplete="new-password"
              error={passError}
              rightEl={
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
            <FloatingInput
              label="Confirme a nova senha"
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                if (e.target.value === password) setConfirmError("");
              }}
              required
              autoComplete="new-password"
              error={confirmError}
              rightEl={
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 text-sm font-semibold text-accent-foreground transition-opacity disabled:opacity-60"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              Salvar nova senha
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
