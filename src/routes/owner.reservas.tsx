import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, X, Phone, Calendar, Clock, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/hooks/useAuth";

export const Route = createFileRoute("/owner/reservas")({
  component: OwnerReservas,
});

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const FILTERS = [
  { value: "pending", label: "Pendentes", dot: "bg-amber-400" },
  { value: "confirmed", label: "Confirmadas", dot: "bg-emerald-400" },
  { value: "cancelled", label: "Canceladas", dot: "bg-red-400" },
  { value: "", label: "Todas", dot: "bg-muted-foreground" },
];

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  pending:   { label: "Pendente",   cls: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  confirmed: { label: "Confirmada", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
  cancelled: { label: "Cancelada",  cls: "bg-red-500/15 text-red-400 border-red-500/25" },
  completed: { label: "Concluída",  cls: "bg-surface text-muted-foreground border-border/60" },
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function OwnerReservas() {
  const { restaurantId } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("pending");

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["owner", "reservations", restaurantId, filter],
    enabled: !!restaurantId,
    queryFn: async () => {
      let q = supabase!
        .from("reservations")
        .select("*, profiles!reservations_user_id_fkey(full_name)")
        .eq("restaurant_id", restaurantId!)
        .order("reservation_date", { ascending: true })
        .order("time_slot", { ascending: true });
      if (filter) q = q.eq("status", filter);
      const { data } = await q;
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase!.from("reservations").update({ status }).eq("id", id);
      if (error) throw error;
      supabase!.functions.invoke("notify-reservation", { body: { reservationId: id, status } }).catch(() => {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["owner"] });
      toast.success("Status atualizado.");
    },
    onError: () => toast.error("Erro ao atualizar."),
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-7">
        <h1 className="font-display text-2xl font-semibold">Reservas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isLoading ? "Carregando…" : `${reservations.length} reserva${reservations.length !== 1 ? "s" : ""} encontrada${reservations.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition-all ${
              filter === f.value
                ? "bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/20"
                : "border border-border/60 bg-card text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${filter === f.value ? "bg-primary-foreground" : f.dot}`} />
            {f.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-border/60 bg-card px-6 py-12 text-center text-muted-foreground"
          >
            Carregando…
          </motion.div>
        ) : reservations.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="rounded-2xl border border-border/60 bg-card px-6 py-14 text-center"
          >
            <p className="text-3xl mb-3">📭</p>
            <p className="text-sm font-medium">Nenhuma reserva encontrada</p>
            <p className="text-xs text-muted-foreground mt-1">Tente outro filtro</p>
          </motion.div>
        ) : (
          <motion.div
            key={filter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            {(reservations as any[]).map((r, i) => {
              const status = STATUS_STYLE[r.status] ?? STATUS_STYLE.completed;
              const name = (r.profiles as any)?.full_name ?? "Cliente";
              const date = new Date(r.reservation_date + "T12:00:00").toLocaleDateString("pt-BR", {
                weekday: "short", day: "numeric", month: "short",
              });

              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.35, ease: EASE }}
                  className="overflow-hidden rounded-2xl border border-border/60 bg-card"
                >
                  <div className="flex items-center gap-4 px-5 py-4">
                    {/* Avatar */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      {initials(name)}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold">{name}</p>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${status.cls}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {r.contact_phone && (
                          <a href={`tel:${r.contact_phone}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                            <Phone size={10} /> {r.contact_phone}
                          </a>
                        )}
                        <span className="text-border/80">·</span>
                        <span className="font-mono text-[10px] tracking-wide opacity-60">#{r.confirmation_code}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar size={12} className="text-primary/60" />
                        <span className="capitalize">{date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock size={12} className="text-primary/60" />
                        {r.time_slot}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users size={12} className="text-primary/60" />
                        {r.party_size} {r.party_size === 1 ? "pessoa" : "pessoas"}
                      </div>
                    </div>

                    {/* Actions — only for pending */}
                    {r.status === "pending" && (
                      <div className="flex items-center gap-2 shrink-0 pl-2">
                        <button
                          onClick={() => updateStatus.mutate({ id: r.id, status: "confirmed" })}
                          disabled={updateStatus.isPending}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/25 disabled:opacity-50"
                        >
                          <Check size={13} /> Confirmar
                        </button>
                        <button
                          onClick={() => updateStatus.mutate({ id: r.id, status: "cancelled" })}
                          disabled={updateStatus.isPending}
                          className="flex items-center gap-1.5 rounded-xl bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/25 disabled:opacity-50"
                        >
                          <X size={13} /> Recusar
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
