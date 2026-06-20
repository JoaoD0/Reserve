import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, Clock, TrendingUp, ArrowRight, Check, X, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/hooks/useAuth";

export const Route = createFileRoute("/owner/")({
  component: OwnerDashboard,
});

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const container = { hidden: {}, visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function OwnerDashboard() {
  const { restaurantId, profile } = useAuth();
  const qc = useQueryClient();

  const { data: restaurant } = useQuery({
    queryKey: ["owner", "restaurant", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data } = await supabase!
        .from("restaurants")
        .select("name")
        .eq("id", restaurantId!)
        .single();
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["owner", "stats", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [pending, todayRes, total] = await Promise.all([
        supabase!.from("reservations").select("*", { count: "exact", head: true }).eq("restaurant_id", restaurantId!).eq("status", "pending"),
        supabase!.from("reservations").select("*", { count: "exact", head: true }).eq("restaurant_id", restaurantId!).eq("reservation_date", today).in("status", ["confirmed", "pending"]),
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
        .select("*, profiles!reservations_user_id_fkey(full_name)")
        .eq("restaurant_id", restaurantId!)
        .eq("status", "pending")
        .order("reservation_date", { ascending: true })
        .limit(5);
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

  const statCards = [
    {
      label: "Pendentes",
      description: "aguardando aprovação",
      value: stats?.pending ?? 0,
      icon: Clock,
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/10",
      accent: "bg-amber-400",
      valueColor: (stats?.pending ?? 0) > 0 ? "text-amber-400" : undefined,
    },
    {
      label: "Hoje",
      description: "reservas confirmadas hoje",
      value: stats?.today ?? 0,
      icon: CalendarCheck,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10",
      accent: "bg-emerald-400",
    },
    {
      label: "Total",
      description: "todas as reservas",
      value: stats?.total ?? 0,
      icon: TrendingUp,
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
      accent: "bg-primary",
    },
  ];

  const todayLabel = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <motion.div
      className="p-8 max-w-3xl"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{greeting()},</p>
          <h1 className="font-display text-3xl font-semibold leading-tight">
            {restaurant?.name ?? profile?.full_name ?? "Restaurante"}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground capitalize shrink-0 pb-0.5">{todayLabel}</p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              variants={fadeUp}
              className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6"
            >
              <div className={`absolute inset-x-0 top-0 h-[3px] ${s.accent}`} />

              <div className="flex items-start justify-between mb-5">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.iconBg}`}>
                  <Icon size={17} className={s.iconColor} />
                </div>
                <span
                  className={`font-display text-4xl font-light tabular-nums ${s.valueColor ?? "text-foreground"}`}
                >
                  {stats ? s.value : "—"}
                </span>
              </div>

              <p className="text-sm font-semibold">{s.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{s.description}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Pending reservations */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base font-medium">Solicitações pendentes</h2>
            {(stats?.pending ?? 0) > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500/15 px-1.5 text-[10px] font-bold text-amber-400">
                {stats?.pending}
              </span>
            )}
          </div>
          <Link
            to="/owner/reservas"
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            Ver todas <ArrowRight size={12} />
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface mb-3">
                <CalendarCheck size={22} className="text-muted-foreground" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium">Nenhuma solicitação pendente</p>
              <p className="text-xs text-muted-foreground mt-1">Tudo em dia por aqui</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {(recent as any[]).map((r, i) => {
                const name = (r.profiles as any)?.full_name ?? "Cliente";
                const date = new Date(r.reservation_date + "T12:00:00").toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "short",
                });
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.07, duration: 0.4, ease: EASE }}
                    className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface/40"
                  >
                    {/* Avatar */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      {initials(name)}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{name}</p>
                      {r.contact_phone && (
                        <a
                          href={`tel:${r.contact_phone}`}
                          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary mt-0.5"
                        >
                          <Phone size={10} /> {r.contact_phone}
                        </a>
                      )}
                    </div>

                    {/* Date + party */}
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium">{date}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.time_slot} · {r.party_size} {r.party_size === 1 ? "pessoa" : "pessoas"}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => updateStatus.mutate({ id: r.id, status: "confirmed" })}
                        disabled={updateStatus.isPending}
                        title="Confirmar"
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 transition-colors hover:bg-emerald-500/25 disabled:opacity-50"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => updateStatus.mutate({ id: r.id, status: "cancelled" })}
                        disabled={updateStatus.isPending}
                        title="Cancelar"
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/15 text-red-400 transition-colors hover:bg-red-500/25 disabled:opacity-50"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
