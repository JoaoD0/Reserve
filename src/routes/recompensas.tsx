import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Trophy,
  Zap,
  Percent,
  Crown,
  BadgePercent,
  ChefHat,
  Copy,
  Check,
  Lock,
  CalendarCheck,
  Star,
  Users,
} from "lucide-react";
import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/recompensas")({
  component: Recompensas,
  head: () => ({ meta: [{ title: "Recompensas — Reservê" }] }),
});

type Reward = {
  id: string;
  name: string;
  description: string;
  Icon: LucideIcon;
  points: number;
  accent: string;
  iconBg: string;
};

const REWARDS: Reward[] = [
  {
    id: "priority",
    name: "Fila Prioritária",
    description: "Pule a fila em qualquer restaurante parceiro na sua próxima visita",
    Icon: Zap,
    points: 300,
    accent: "text-sky-400",
    iconBg: "bg-sky-500/10",
  },
  {
    id: "discount10",
    name: "10% de Desconto",
    description: "Desconto aplicado automaticamente na sua próxima reserva",
    Icon: Percent,
    points: 600,
    accent: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
  },
  {
    id: "vip",
    name: "Mesa VIP",
    description: "Mesa com localização especial e atendimento dedicado",
    Icon: Crown,
    points: 1200,
    accent: "text-gold",
    iconBg: "bg-gold/10",
  },
  {
    id: "discount20",
    name: "20% de Desconto",
    description: "Desconto premium aplicado na sua próxima reserva",
    Icon: BadgePercent,
    points: 2500,
    accent: "text-primary",
    iconBg: "bg-primary/10",
  },
  {
    id: "chef",
    name: "Menu do Chef",
    description: "Experiência de menu degustação exclusiva, cortesia da casa",
    Icon: ChefHat,
    points: 5000,
    accent: "text-violet-400",
    iconBg: "bg-violet-500/10",
  },
];

const TIERS = [
  { name: "Bronze", min: 0, max: 499 },
  { name: "Prata", min: 500, max: 999 },
  { name: "Ouro", min: 1000, max: 4999 },
  { name: "Diamante", min: 5000, max: Infinity },
];

const TIER_COLORS: Record<string, string> = {
  Bronze: "text-orange-400",
  Prata: "text-slate-300",
  Ouro: "text-gold",
  Diamante: "text-blue-300",
};

type UserReward = {
  id: string;
  reward_id: string;
  coupon_code: string;
  redeemed_at: string;
  expires_at: string;
  is_used: boolean;
};

function getTier(pts: number) {
  return TIERS.find((t) => pts >= t.min && pts <= t.max) ?? TIERS[0];
}

function getNextTier(pts: number) {
  const idx = TIERS.findIndex((t) => pts >= t.min && pts <= t.max);
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

function generateCode(rewardId: string) {
  const tag = rewardId.slice(0, 4).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `RSV-${tag}-${rand}`;
}

function Recompensas() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [copied, setCopied] = useState<string | null>(null);

  const { data: points = 0 } = useQuery<number>({
    queryKey: ["points", user?.id],
    queryFn: async () => {
      if (!supabase || !user) return 0;
      const { data } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", user.id)
        .single();
      return data?.points ?? 0;
    },
    enabled: !!user && !!supabase,
  });

  const { data: userRewards = [] } = useQuery<UserReward[]>({
    queryKey: ["userRewards", user?.id],
    queryFn: async () => {
      if (!supabase || !user) return [];
      const { data } = await supabase
        .from("user_rewards")
        .select("*")
        .eq("user_id", user.id)
        .order("redeemed_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user && !!supabase,
  });

  const redeem = useMutation({
    mutationFn: async (reward: Reward) => {
      if (!supabase || !user) return;
      if (points < reward.points) { toast.error("Pontos insuficientes"); return; }
      const code = generateCode(reward.id);
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      await supabase.from("user_rewards").insert({
        user_id: user.id,
        reward_id: reward.id,
        coupon_code: code,
        expires_at: expires.toISOString(),
      });
      await supabase
        .from("profiles")
        .update({ points: points - reward.points })
        .eq("id", user.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["points", user?.id] });
      qc.invalidateQueries({ queryKey: ["userRewards", user?.id] });
      toast.success("Recompensa resgatada!");
    },
    onError: () => toast.error("Erro ao resgatar. Tente novamente."),
  });

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Código copiado!");
  }

  const tier = getTier(points);
  const nextTier = getNextTier(points);
  const progress = nextTier
    ? ((points - tier.min) / (nextTier.min - tier.min)) * 100
    : 100;
  const redeemedIds = new Set(userRewards.map((r) => r.reward_id));
  const tierColor = TIER_COLORS[tier.name];

  return (
    <MobileShell>
      <header className="px-5 pt-6">
        <h1 className="font-display text-2xl">Recompensas</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Troque pontos por experiências exclusivas</p>
      </header>

      <div className="flex flex-col gap-5 px-5 pt-5 pb-32">

        {/* Points card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl bg-card border border-border/60"
        >
          {/* Glow */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-6 bottom-0 h-28 w-28 rounded-full bg-primary/8 blur-2xl" />

          <div className="relative p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Saldo atual</p>
                <p className="font-display mt-1 text-[52px] font-light leading-none tracking-tight">
                  {points.toLocaleString("pt-BR")}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">pontos acumulados</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
                  <Trophy size={22} className="text-primary" />
                </div>
                <span className={`text-sm font-semibold ${tierColor}`}>{tier.name}</span>
              </div>
            </div>

            {nextTier && (
              <div className="mt-5 border-t border-border/40 pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">
                    Faltam <span className="font-semibold text-foreground">{(nextTier.min - points).toLocaleString("pt-BR")} pts</span> para {nextTier.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {Math.round(progress)}%
                  </p>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-surface">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                  <span>{tier.name}</span>
                  <span>{nextTier.name}</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Earn section */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { Icon: CalendarCheck, label: "Reserva", pts: "+150" },
            { Icon: Star, label: "Avaliação", pts: "+50" },
            { Icon: Users, label: "Indicação", pts: "+200" },
          ].map(({ Icon, label, pts }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-border/60 bg-card py-3.5 px-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                <Icon size={14} className="text-primary" />
              </div>
              <span className="text-[10px] text-muted-foreground text-center leading-tight">{label}</span>
              <span className="text-xs font-semibold text-primary">{pts} pts</span>
            </motion.div>
          ))}
        </div>

        {/* Rewards */}
        <div>
          <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Disponíveis para resgatar</p>
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card divide-y divide-border/60">
            {REWARDS.map((reward, i) => {
              const unlocked = points >= reward.points;
              const redeemed = redeemedIds.has(reward.id);
              const { Icon } = reward;
              return (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-3 px-4 py-3.5 ${!unlocked ? "opacity-50" : ""}`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${unlocked ? reward.iconBg : "bg-surface"}`}>
                    {unlocked
                      ? <Icon size={18} className={reward.accent} />
                      : <Lock size={14} className="text-muted-foreground" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-tight ${unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                      {reward.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug line-clamp-1">
                      {reward.description}
                    </p>
                    <p className={`mt-1 text-[11px] font-semibold ${unlocked ? reward.accent : "text-muted-foreground"}`}>
                      {reward.points.toLocaleString("pt-BR")} pts
                    </p>
                  </div>
                  <button
                    onClick={() => !redeemed && redeem.mutate(reward)}
                    disabled={!unlocked || redeemed || redeem.isPending}
                    className={`shrink-0 rounded-xl px-3 py-2 text-[11px] font-semibold transition-all disabled:opacity-50 ${
                      redeemed
                        ? "bg-surface text-muted-foreground"
                        : unlocked
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface/60 text-muted-foreground"
                    }`}
                  >
                    {redeemed ? "Resgatado" : "Resgatar"}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Active coupons */}
        {userRewards.length > 0 && (
          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Meus cupons</p>
            <div className="flex flex-col gap-2">
              {userRewards.map((ur) => {
                const reward = REWARDS.find((r) => r.id === ur.reward_id);
                if (!reward) return null;
                const { Icon } = reward;
                const expires = new Date(ur.expires_at).toLocaleDateString("pt-BR");
                return (
                  <motion.div
                    key={ur.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3.5"
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${reward.iconBg}`}>
                      <Icon size={18} className={reward.accent} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{reward.name}</p>
                      <p className="mt-0.5 font-mono text-xs tracking-wider text-primary">{ur.coupon_code}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">Válido até {expires}</p>
                    </div>
                    <button
                      onClick={() => copyCode(ur.coupon_code)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-surface transition-colors active:bg-surface-elevated"
                    >
                      {copied === ur.coupon_code
                        ? <Check size={14} className="text-emerald-400" />
                        : <Copy size={14} className="text-muted-foreground" />
                      }
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </MobileShell>
  );
}
