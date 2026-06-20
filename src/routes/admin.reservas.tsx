import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/reservas")({
  component: AdminReservas,
});

type Reservation = {
  id: string;
  user_id: string;
  restaurant_id: string;
  reservation_date: string;
  time_slot: string;
  party_size: number;
  status: string;
  profiles?: { full_name: string | null };
};

type Restaurant = { id: string; name: string };

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendente" },
  { value: "confirmed", label: "Confirmada" },
  { value: "cancelled", label: "Cancelada" },
  { value: "completed", label: "Concluída" },
];

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400",
  confirmed: "bg-emerald-500/15 text-emerald-400",
  cancelled: "bg-red-500/15 text-red-400",
  completed: "bg-surface text-muted-foreground",
};

function AdminReservas() {
  const qc = useQueryClient();
  const [filterRestaurant, setFilterRestaurant] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const { data: restaurants = [] } = useQuery<Restaurant[]>({
    queryKey: ["admin", "restaurantsSelect"],
    queryFn: async () => {
      const { data } = await supabase!.from("restaurants").select("id, name").order("name");
      return (data ?? []) as Restaurant[];
    },
  });

  const { data: reservations = [], isLoading } = useQuery<Reservation[]>({
    queryKey: ["admin", "reservations", filterRestaurant, filterStatus],
    queryFn: async () => {
      let q = supabase!
        .from("reservations")
        .select("*, profiles(full_name)")
        .order("reservation_date", { ascending: false })
        .order("time_slot", { ascending: false });
      if (filterRestaurant) q = q.eq("restaurant_id", filterRestaurant);
      if (filterStatus) q = q.eq("status", filterStatus);
      const { data } = await q;
      return (data ?? []) as Reservation[];
    },
  });

  const restaurantMap = Object.fromEntries(restaurants.map((r) => [r.id, r.name]));

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await supabase!.from("reservations").update({ status }).eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reservations"] });
      toast.success("Status atualizado.");
    },
    onError: () => toast.error("Erro ao atualizar status."),
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Reservas</h1>
        <p className="text-sm text-muted-foreground mt-1">{reservations.length} encontradas</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <select
          value={filterRestaurant}
          onChange={(e) => setFilterRestaurant(e.target.value)}
          className="rounded-xl border border-border/60 bg-card px-3.5 py-2.5 text-sm focus:border-primary/60 focus:outline-none"
        >
          <option value="">Todos os restaurantes</option>
          {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-border/60 bg-card px-3.5 py-2.5 text-sm focus:border-primary/60 focus:outline-none"
        >
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        {(filterRestaurant || filterStatus) && (
          <button
            onClick={() => { setFilterRestaurant(""); setFilterStatus(""); }}
            className="rounded-xl border border-border/60 bg-card px-3.5 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40">
              {["Cliente", "Restaurante", "Data", "Horário", "Pessoas", "Status", "Alterar status"].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">Carregando…</td></tr>
            ) : reservations.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">Nenhuma reserva encontrada</td></tr>
            ) : (
              reservations.map((r) => (
                <tr key={r.id} className="border-b border-border/40 last:border-0 hover:bg-surface/40 transition-colors">
                  <td className="px-6 py-3.5 text-muted-foreground">{r.profiles?.full_name ?? "—"}</td>
                  <td className="px-6 py-3.5 font-medium">
                    {restaurantMap[r.restaurant_id] ?? "—"}
                  </td>
                  <td className="px-6 py-3.5">{new Date(r.reservation_date + "T12:00:00").toLocaleDateString("pt-BR")}</td>
                  <td className="px-6 py-3.5 text-muted-foreground">{r.time_slot}</td>
                  <td className="px-6 py-3.5 text-muted-foreground">{r.party_size}</td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_CLASS[r.status] ?? STATUS_CLASS.pending}`}>
                      {STATUS_OPTIONS.find((s) => s.value === r.status)?.label ?? r.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <select
                      value={r.status}
                      onChange={(e) => updateStatus.mutate({ id: r.id, status: e.target.value })}
                      className="rounded-lg border border-border/60 bg-surface px-2 py-1 text-xs focus:border-primary/60 focus:outline-none"
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
