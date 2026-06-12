import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, X, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/hooks/useAuth";

export const Route = createFileRoute("/owner/reservas")({
  component: OwnerReservas,
});

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendente", class: "bg-amber-500/15 text-amber-400" },
  { value: "confirmed", label: "Confirmada", class: "bg-emerald-500/15 text-emerald-400" },
  { value: "cancelled", label: "Cancelada", class: "bg-red-500/15 text-red-400" },
  { value: "completed", label: "Concluída", class: "bg-surface text-muted-foreground" },
];

function OwnerReservas() {
  const { restaurantId } = useAuth();
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("pending");

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["owner", "reservations", restaurantId, filterStatus],
    enabled: !!restaurantId,
    queryFn: async () => {
      let q = supabase!
        .from("reservations")
        .select("*, profiles!reservations_user_id_fkey(full_name)")
        .eq("restaurant_id", restaurantId!)
        .order("reservation_date", { ascending: true })
        .order("time_slot", { ascending: true });
      if (filterStatus) q = q.eq("status", filterStatus);
      const { data } = await q;
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase!.from("reservations").update({ status }).eq("id", id);
      if (error) throw error;
      // Fire-and-forget email notification
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Reservas</h1>
          <p className="text-sm text-muted-foreground mt-1">{reservations.length} encontradas</p>
        </div>
      </div>

      {/* Filtro de status */}
      <div className="flex gap-2 mb-5">
        {[{ value: "pending", label: "Pendentes" }, { value: "confirmed", label: "Confirmadas" }, { value: "cancelled", label: "Canceladas" }, { value: "", label: "Todas" }].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilterStatus(opt.value)}
            className={`rounded-xl px-4 py-2 text-sm transition-colors ${filterStatus === opt.value ? "bg-primary text-primary-foreground font-semibold" : "border border-border/60 bg-card text-muted-foreground hover:text-foreground"}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="rounded-2xl border border-border/60 bg-card px-6 py-8 text-center text-muted-foreground">Carregando…</div>
        ) : reservations.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card px-6 py-8 text-center text-muted-foreground">Nenhuma reserva encontrada</div>
        ) : (
          (reservations as any[]).map((r) => {
            const statusInfo = STATUS_OPTIONS.find((s) => s.value === r.status);
            return (
              <div key={r.id} className="rounded-2xl border border-border/60 bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusInfo?.class}`}>
                        {statusInfo?.label}
                      </span>
                      <span className="text-xs text-muted-foreground">#{r.confirmation_code}</span>
                    </div>
                    <p className="font-medium text-sm">{(r.profiles as any)?.full_name ?? "Cliente"}</p>
                    {r.contact_phone && (
                      <a href={`tel:${r.contact_phone}`} className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 hover:text-primary transition-colors">
                        <Phone size={11} /> {r.contact_phone}
                      </a>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="font-display text-base">{new Date(r.reservation_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}</p>
                    <p className="text-sm text-muted-foreground">{r.time_slot} · {r.party_size} {r.party_size === 1 ? "pessoa" : "pessoas"}</p>
                  </div>
                </div>

                {r.status === "pending" && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border/40">
                    <button
                      onClick={() => updateStatus.mutate({ id: r.id, status: "confirmed" })}
                      disabled={updateStatus.isPending}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/15 text-emerald-400 py-2.5 text-sm font-semibold hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
                    >
                      <Check size={15} /> Confirmar
                    </button>
                    <button
                      onClick={() => updateStatus.mutate({ id: r.id, status: "cancelled" })}
                      disabled={updateStatus.isPending}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500/15 text-red-400 py-2.5 text-sm font-semibold hover:bg-red-500/25 transition-colors disabled:opacity-50"
                    >
                      <X size={15} /> Cancelar
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
