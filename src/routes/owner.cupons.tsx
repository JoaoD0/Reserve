import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search, CheckCircle, XCircle, Ticket, Camera, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/owner/cupons")({
  component: OwnerCupons,
});

const REWARD_LABELS: Record<string, string> = {
  priority: "Fila Prioritária",
  discount10: "10% de Desconto",
  vip: "Mesa VIP",
  discount20: "20% de Desconto",
  chef: "Menu do Chef",
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
      if (!data) {
        setNotFound(true);
        setResult(null);
      } else {
        setNotFound(false);
        setResult(data);
      }
    },
    onError: () => toast.error("Erro ao buscar cupom."),
  });

  const markUsed = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase!
        .from("user_rewards")
        .update({ is_used: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setResult((r: any) => ({ ...r, is_used: true }));
      toast.success("Cupom validado!");
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

      scanner
        .start(
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
        )
        .catch(() => {
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

  return (
    <div className="p-8 max-w-lg">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold">Validar Cupom</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Digite o código ou escaneie o QR do cliente
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim()) lookup.mutate(code);
        }}
        className="flex gap-2"
      >
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setResult(null);
            setNotFound(false);
          }}
          placeholder="RSV-PRIO-AB3K7M"
          className="flex-1 rounded-xl border border-border/60 bg-card px-4 py-3 text-sm font-mono uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="button"
          onClick={() => {
            setResult(null);
            setNotFound(false);
            setScanning((s) => !s);
          }}
          title={scanning ? "Fechar câmera" : "Escanear QR"}
          className={`flex items-center justify-center rounded-xl px-3 py-3 transition-colors ${
            scanning
              ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
              : "border border-border/60 bg-card text-muted-foreground hover:bg-surface"
          }`}
        >
          {scanning ? <X size={16} /> : <Camera size={16} />}
        </button>
        <button
          type="submit"
          disabled={!code.trim() || lookup.isPending}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50 transition-opacity"
        >
          <Search size={15} />
          Buscar
        </button>
      </form>

      {/* Camera scanner */}
      {scanning && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-black">
          <div className="flex items-center justify-between px-4 py-2.5 bg-card border-b border-border/60">
            <p className="text-xs text-muted-foreground">Aponte para o QR code do cliente</p>
            <div className="flex h-2 w-2 rounded-full bg-red-400 animate-pulse" />
          </div>
          <div id="qr-reader" className="w-full" />
        </div>
      )}

      {notFound && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4">
          <XCircle size={20} className="text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-400">Cupom não encontrado</p>
            <p className="text-xs text-muted-foreground mt-0.5">Verifique o código digitado</p>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
            <div className="flex items-center gap-2">
              <Ticket size={15} className="text-primary" />
              <span className="font-mono text-sm font-bold text-primary">
                {result.coupon_code}
              </span>
            </div>
            {result.is_used ? (
              <span className="rounded-full bg-surface px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                Utilizado
              </span>
            ) : isExpired ? (
              <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold text-red-400">
                Expirado
              </span>
            ) : (
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
                Válido
              </span>
            )}
          </div>

          <div className="space-y-3 px-5 py-4">
            <Row label="Recompensa" value={REWARD_LABELS[result.reward_id] ?? result.reward_id} />
            <Row label="Cliente" value={(result.profiles as any)?.full_name ?? "—"} />
            <Row
              label="Resgatado em"
              value={new Date(result.redeemed_at).toLocaleDateString("pt-BR")}
            />
            <Row
              label="Válido até"
              value={new Date(result.expires_at).toLocaleDateString("pt-BR")}
            />
          </div>

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
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
