import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { UtensilsCrossed, Users, CalendarCheck, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Concluída",
};

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400",
  confirmed: "bg-emerald-500/15 text-emerald-400",
  cancelled: "bg-red-500/15 text-red-400",
  completed: "bg-surface text-muted-foreground",
};

function AdminDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const { data: restaurantCount = 0 } = useQuery({
    queryKey: ["admin", "restaurantCount"],
    queryFn: async () => {
      const { count } = await supabase!.from("restaurants").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: ownerCount = 0 } = useQuery({
    queryKey: ["admin", "ownerCount"],
    queryFn: async () => {
      const { count } = await supabase!.from("profiles").select("*", { count: "exact", head: true }).eq("role", "owner");
      return count ?? 0;
    },
  });

  const { data: todayCount = 0 } = useQuery({
    queryKey: ["admin", "todayCount"],
    queryFn: async () => {
      const { count } = await supabase!.from("reservations").select("*", { count: "exact", head: true }).eq("reservation_date", today);
      return count ?? 0;
    },
  });

  const { data: monthCount = 0 } = useQuery({
    queryKey: ["admin", "monthCount"],
    queryFn: async () => {
      const monthStartDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
      const { count } = await supabase!.from("reservations").select("*", { count: "exact", head: true }).gte("reservation_date", monthStartDate);
      return count ?? 0;
    },
  });

  const { data: recentReservations = [] } = useQuery({
    queryKey: ["admin", "recentReservations"],
    queryFn: async () => {
      const { data } = await supabase!
        .from("reservations")
        .select("id, reservation_date, time_slot, party_size, status, restaurant_id, user_id")
        .order("reservation_date", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  const stats = [
    { label: "Restaurantes", value: restaurantCount, icon: UtensilsCrossed, color: "text-primary", bg: "bg-primary/10" },
    { label: "Proprietários", value: ownerCount, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Reservas hoje", value: todayCount, icon: CalendarCheck, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Reservas no mês", value: monthCount, icon: TrendingUp, color: "text-gold", bg: "bg-gold/10" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral do Reservê</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl border border-border/60 bg-card p-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg} mb-3`}>
                <Icon size={18} className={s.color} />
              </div>
              <p className="font-display text-3xl font-light">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent reservations */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border/60">
          <h2 className="font-display text-base font-medium">Últimas reservas</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40">
              {["Restaurante", "Data", "Horário", "Pessoas", "Status"].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentReservations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-sm">
                  Nenhuma reserva ainda
                </td>
              </tr>
            ) : (
              recentReservations.map((r: any) => (
                <tr key={r.id} className="border-b border-border/40 last:border-0 hover:bg-surface/40 transition-colors">
                  <td className="px-6 py-3.5 text-muted-foreground font-mono text-xs">{r.restaurant_id?.slice(0, 8)}…</td>
                  <td className="px-6 py-3.5">{new Date(r.reservation_date + "T12:00:00").toLocaleDateString("pt-BR")}</td>
                  <td className="px-6 py-3.5 text-muted-foreground">{r.time_slot}</td>
                  <td className="px-6 py-3.5 text-muted-foreground">{r.party_size}</td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_CLASS[r.status] ?? STATUS_CLASS.pending}`}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
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
