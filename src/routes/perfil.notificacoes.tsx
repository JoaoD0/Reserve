import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, Tag, MapPin, Sparkles } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/perfil/notificacoes")({
  component: PerfilNotificacoes,
  head: () => ({ meta: [{ title: "Notificações — Reservê" }] }),
});

const PREFS_CONFIG = [
  { key: "reserva", label: "Lembrete de reserva", Icon: Bell, description: "Lembretes antes da sua reserva" },
  { key: "promocoes", label: "Promoções e descontos", Icon: Tag, description: "Ofertas exclusivas para você" },
  { key: "novos", label: "Restaurantes novos", Icon: MapPin, description: "Quando novos lugares chegam" },
  { key: "novidades", label: "Novidades do app", Icon: Sparkles, description: "Updates e funcionalidades" },
] as const;

type PrefKey = (typeof PREFS_CONFIG)[number]["key"];
type Prefs = Record<PrefKey, boolean>;

const DEFAULT_PREFS: Prefs = { reserva: true, promocoes: true, novos: false, novidades: false };

type Notif = {
  id: string;
  title: string;
  body: string | null;
  type: string;
  read: boolean;
  created_at: string;
};

const TYPE_STYLE: Record<string, { Icon: typeof Bell; bg: string }> = {
  reservation:    { Icon: Bell,     bg: "bg-primary/10 text-primary" },
  promotion:      { Icon: Tag,      bg: "bg-gold/10 text-gold" },
  new_restaurant: { Icon: MapPin,   bg: "bg-emerald-500/10 text-emerald-400" },
  general:        { Icon: Sparkles, bg: "bg-violet-500/10 text-violet-400" },
};

function formatTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "agora";
  if (mins < 60) return `há ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)}d`;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border transition-colors duration-200 ${
        checked ? "bg-primary border-primary" : "bg-surface border-border/60"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 mt-[1px] ${
          checked ? "translate-x-[21px]" : "translate-x-[1px]"
        }`}
      />
    </button>
  );
}

function PerfilNotificacoes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: prefs = DEFAULT_PREFS } = useQuery<Prefs>({
    queryKey: ["notification_prefs", user?.id],
    queryFn: async () => {
      if (!supabase || !user) return DEFAULT_PREFS;
      const { data } = await supabase
        .from("profiles")
        .select("notification_prefs")
        .eq("id", user.id)
        .single();
      return (data?.notification_prefs as Prefs) ?? DEFAULT_PREFS;
    },
    enabled: !!user && !!supabase,
    initialData: DEFAULT_PREFS,
  });

  const updatePref = useMutation({
    mutationFn: async ({ key, value }: { key: PrefKey; value: boolean }) => {
      if (!supabase || !user) return;
      const next = { ...prefs, [key]: value };
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        notification_prefs: next,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onMutate: ({ key, value }) => {
      qc.setQueryData(["notification_prefs", user?.id], (old: Prefs) => ({ ...old, [key]: value }));
    },
    onError: () => toast.error("Erro ao atualizar preferências"),
  });

  const { data: notifs = [] } = useQuery<Notif[]>({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!supabase || !user) return [];
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return (data ?? []) as Notif[];
    },
    enabled: !!user && !!supabase,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      if (!supabase || !user) return;
      await supabase.from("notifications").update({ read: true }).eq("id", id).eq("user_id", user.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!supabase || !user) return;
      await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <MobileShell>
      <header className="flex items-center gap-3 px-5 pt-6">
        <button
          onClick={() => navigate({ to: "/perfil" })}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-surface/60"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="font-display text-lg flex-1">Notificações</h1>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            className="text-xs text-primary font-medium"
          >
            Marcar todas como lidas
          </button>
        )}
      </header>

      <div className="px-5 pt-6 pb-24 space-y-6">
        {/* Preferences */}
        <div>
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 px-1">
            Preferências
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
            {PREFS_CONFIG.map((p, i) => {
              const Icon = p.Icon;
              return (
                <div
                  key={p.key}
                  className={`flex items-center gap-3 px-4 py-3.5 ${
                    i < PREFS_CONFIG.length - 1 ? "border-b border-border/60" : ""
                  }`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon size={15} />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{p.label}</p>
                    <p className="text-[11px] text-muted-foreground">{p.description}</p>
                  </div>
                  <Toggle
                    checked={prefs[p.key]}
                    onChange={(v) => updatePref.mutate({ key: p.key, value: v })}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent notifications */}
        <div>
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 px-1">
            Recentes
          </h2>
          {notifs.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-card py-12 text-center">
              <p className="text-3xl mb-2">🔔</p>
              <p className="text-sm text-muted-foreground">Nenhuma notificação ainda</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
              {notifs.map((n, i) => {
                const style = TYPE_STYLE[n.type] ?? TYPE_STYLE.general;
                const Icon = style.Icon;
                return (
                  <motion.button
                    key={n.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => !n.read && markRead.mutate(n.id)}
                    className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors ${
                      i < notifs.length - 1 ? "border-b border-border/60" : ""
                    } ${!n.read ? "bg-primary/5" : ""}`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.bg}`}>
                      <Icon size={15} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!n.read ? "font-bold" : "font-medium"}`}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      {n.body && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                          {n.body}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {formatTime(n.created_at)}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
