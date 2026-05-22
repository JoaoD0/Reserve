import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, Clock, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/hooks/useAuth";

export const Route = createFileRoute("/owner/")({
  component: OwnerDashboard,
});

function OwnerDashboard() {
  const { restaurantId } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["owner", "stats", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [pending, todayRes, total] = await Promise.all([
        supabase!.from("reservations").select("*", { count: "exact", head: true }).eq("restaurant_id", restaurantId!).eq("status", "pending"),
        supabase!.from("reservations").select("*", { count: "exact", head: true }).eq("restaurant_id", restaurantId!).eq("reservation_date", today),
        supabase!.from("reservations").select("*", { count: "exact", head: true }).eq("restaurant_id", restaurantId!),
      ]);
      return {
        pending: pending.count ?? 0,
        today: todayRes.count ?? 0,
        total: total.count ?? 0,
      };
    },
  });

  const { data: recent = [] } = useQuery({
    queryKey: ["owner", "recent", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data } = await supabase!
        .from("reservations")
        .select("*, profiles(full_name)")
        .eq("restaurant_id", restaurantId!)
        .eq("status", "pending")
        .order("reservation_date", { ascending: true })
        .limit(5);
      return data ?? [];
    },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral do seu restaurante</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Aguardando aprovação", value: stats?.pending ?? 0, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Reservas hoje", value: stats?.today ?? 0, icon: CalendarCheck, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Total de reservas", value: stats?.total ?? 0, icon: Users, color: "text-primary", bg: "bg-primary/10" },
        ].map((s) => {
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

      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border/60">
          <h2 className="font-display text-base font-medium">Solicitações pendentes</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40">
              {["Cliente", "Data", "Horário", "Pessoas"].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">Nenhuma solicitação pendente</td></tr>
            ) : (
              recent.map((r: any) => (
                <tr key={r.id} className="border-b border-border/40 last:border-0 hover:bg-surface/40 transition-colors">
                  <td className="px-6 py-3.5 font-medium">{r.profiles?.full_name ?? "Cliente"}</td>
                  <td className="px-6 py-3.5">{new Date(r.reservation_date + "T12:00:00").toLocaleDateString("pt-BR")}</td>
                  <td className="px-6 py-3.5 text-muted-foreground">{r.time_slot}</td>
                  <td className="px-6 py-3.5 text-muted-foreground">{r.party_size}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
