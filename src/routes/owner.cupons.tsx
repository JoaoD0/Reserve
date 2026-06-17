import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search, CheckCircle, XCircle, Ticket, Camera, X, User, Calendar, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/owner/cupons")({
  component: OwnerCupons,
});

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const REWARD_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  priority:  { label: "Fila Prioritária",   color: "text-sky-400",     bg: "bg-sky-500/10" },
  discount10: { label: "10% de Desconto",   color: "text-emerald-400", bg: "bg-emerald-500/10" },
  vip:        { label: "Mesa VIP",          color: "text-violet-400",  bg: "bg-violet-500/10" },
  discount20: { label: "20% de Desconto",   color: "text-amber-400",   bg: "bg-amber-500/10" },
  chef:       { label: "Menu do Chef",      color: "text-rose-400",    bg: "bg-rose-500/10" },
};

function OwnerCupons() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<any>(null);

  const lookup = useMutation({
    mutationFn: async (couponCode: string) => {
      const { data } = await supabase!
        .from("user_rewards")
        .select("*, profiles!user_rewards_user_id_fkey(full_name)")
        .eq("coupon_code", couponCode.trim().toUpperCase())
        .maybeSingle();
      return data ?? null;
    },
    onSuccess: (data) => {
      if (!data) { setNotFound(true); setResult(null); }
      else { setNotFound(false); setResult(data); }
    },
    onError: () => toast.error("Erro ao buscar cupom."),
  });

  const markUsed = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase!.from("user_rewards").update({ is_used: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setResult((r: any) => ({ ...r, is_used: true }));
      toast.success("Cupom validado com sucesso!");
    },
    onError: () => toast.error("Erro ao validar cupom."),
  });

  useEffect(() => {
    if (!scanning) return;
    let done = false;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (done) return;
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          if (done) return;
          done = true;
          const cleaned = decoded.trim().toUpperCase();
          scanner.stop().catch(() => {}).finally(() => {
            scannerRef.current = null;
            setCode(cleaned);
            setScanning(false);
            lookup.mutate(cleaned);
          });
        },
        () => {}
      ).catch(() => {
        toast.error("Não foi possível acessar a câmera. Verifique as permissões do browser.");
        setScanning(false);
      });
    });

    return () => {
      done = true;
      scannerRef.current?.stop().catch(() => {});
      scannerRef.current = null;
    };
  }, [scanning]); // eslint-disable-line react-hooks/exhaustive-deps

  const isExpired = result && new Date(result.expires_at) < new Date();
  const isValid = result && !isExpired && !result.is_used;
  const reward = result ? (REWARD_LABELS[result.reward_id] ?? { label: result.reward_id, color: "text-primary", bg: "bg-primary/10" }) : null;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-7">
        <h1 className="font-display text-2xl font-semibold">Validar Cupom</h1>
        <p className="text-sm text-muted-foreground mt-1">Digite o código ou escaneie o QR do cliente</p>
      </div>

      {/* Search bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); if (code.trim()) lookup.mutate(code); }}
        className="flex gap-2 mb-6"
      >
        <div className="relative flex-1">
          <Ticket size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={code}
            onChange={(e) => { setCode(e.target.value); setResult(null); setNotFound(false); }}
            placeholder="RSV-PRIO-AB3K7M"
            className="h-12 w-full rounded-xl border border-border/60 bg-card pl-10 pr-4 font-mono text-sm uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal placeholder:font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>
        <button
          type="button"
          onClick={() => { setResult(null); setNotFound(false); setScanning((s) => !s); }}
          title={scanning ? "Fechar câmera" : "Escanear QR"}
          className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
            scanning
              ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
              : "border border-border/60 bg-card text-muted-foreground hover:bg-surface hover:text-foreground"
          }`}
        >
          {scanning ? <X size={16} /> : <Camera size={16} />}
        </button>
        <button
          type="submit"
          disabled={!code.trim() || lookup.isPending}
          className="flex h-12 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50 transition-opacity shadow-sm shadow-primary/20"
        >
          <Search size={14} />
          Buscar
        </button>
      </form>

      {/* Camera */}
      <AnimatePresence>
        {scanning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="mb-6 overflow-hidden rounded-2xl border border-border/60"
          >
            <div className="flex items-center justify-between bg-card px-4 py-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                <p className="text-xs font-medium">Câmera ativa — aponte para o QR code</p>
              </div>
              <button onClick={() => setScanning(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Fechar
              </button>
            </div>
            <div id="qr-reader" className="w-full bg-black" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Not found */}
      <AnimatePresence>
        {notFound && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="flex items-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/8 px-5 py-4 mb-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15">
              <XCircle size={20} className="text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-400">Cupom não encontrado</p>
              <p className="text-xs text-muted-foreground mt-0.5">Verifique o código digitado</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && reward && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden rounded-2xl border border-border/60 bg-card"
          >
            {/* Result header */}
            <div className={`px-5 py-4 ${reward.bg} border-b border-border/40`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${reward.color}`}>
                    {reward.label}
                  </span>
                  <p className={`font-mono text-lg font-bold tracking-widest mt-0.5 ${reward.color}`}>
                    {result.coupon_code}
                  </p>
                </div>
                <StatusBadge used={result.is_used} expired={isExpired} />
              </div>
            </div>

            {/* Details */}
            <div className="px-5 py-4 grid grid-cols-2 gap-3">
              <InfoRow icon={User} label="Cliente" value={(result.profiles as any)?.full_name ?? "—"} />
              <InfoRow icon={Calendar} label="Resgatado em" value={new Date(result.redeemed_at).toLocaleDateString("pt-BR")} />
              <InfoRow icon={Clock} label="Válido até" value={new Date(result.expires_at).toLocaleDateString("pt-BR")} />
            </div>

            {/* Action */}
            {isValid && (
              <div className="px-5 pb-5">
                <button
                  onClick={() => markUsed.mutate(result.id)}
                  disabled={markUsed.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/15 py-3 text-sm font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/25 disabled:opacity-50"
                >
                  <CheckCircle size={16} />
                  {markUsed.isPending ? "Validando…" : "Marcar como utilizado"}
                </button>
              </div>
            )}

            {result.is_used && (
              <div className="px-5 pb-5">
                <div className="flex items-center justify-center gap-2 rounded-xl bg-surface py-3 text-sm text-muted-foreground">
                  <CheckCircle size={15} />
                  Cupom já foi utilizado
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ used, expired }: { used: boolean; expired: boolean }) {
  if (used)    return <span className="rounded-full bg-surface px-3 py-1 text-[11px] font-semibold text-muted-foreground border border-border/60">Utilizado</span>;
  if (expired) return <span className="rounded-full bg-red-500/15 px-3 py-1 text-[11px] font-semibold text-red-400 border border-red-500/20">Expirado</span>;
  return <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">Válido</span>;
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-surface">
        <Icon size={11} className="text-muted-foreground" />
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
