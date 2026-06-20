import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { X, Bell, Tag, MapPin, Sparkles } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase } from "@/lib/supabase";

type Notif = {
  id: string;
  title: string;
  body: string | null;
  type: string;
  read: boolean;
  created_at: string;
};

type PrefKey = "reserva" | "promocoes" | "novos" | "novidades";
type Prefs = Record<PrefKey, boolean>;
const DEFAULT_PREFS: Prefs = { reserva: true, promocoes: true, novos: false, novidades: false };

const TOGGLES: { key: PrefKey; label: string }[] = [
  { key: "reserva", label: "Lembrete de reserva" },
  { key: "promocoes", label: "Promoções e descontos" },
  { key: "novos", label: "Restaurantes novos" },
  { key: "novidades", label: "Novidades do app" },
];

const TYPE_STYLE: Record<string, { Icon: typeof Bell; bg: string }> = {
  reservation:    { Icon: Bell,     bg: "bg-primary/20 text-primary" },
  promotion:      { Icon: Tag,      bg: "bg-gold/20 text-gold" },
  new_restaurant: { Icon: MapPin,   bg: "bg-emerald-500/20 text-emerald-400" },
  general:        { Icon: Sparkles, bg: "bg-violet-500/20 text-violet-400" },
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

type Props = {
  open: boolean;
  onClose: () => void;
  onUnreadChange: (count: number) => void;
};

export function NotificationsDrawer({ open, onClose, onUnreadChange }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: notifs = [] } = useQuery<Notif[]>({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!supabase || !user) return [];
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      return (data ?? []) as Notif[];
    },
    enabled: !!user && !!supabase,
  });

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

  useEffect(() => {
    onUnreadChange(notifs.filter((n) => !n.read).length);
  }, [notifs, onUnreadChange]);

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

  const updatePref = useMutation({
    mutationFn: async ({ key, value }: { key: PrefKey; value: boolean }) => {
      if (!supabase || !user) return;
      const next = { ...prefs, [key]: value };
      await supabase.from("profiles").upsert({
        id: user.id,
        notification_prefs: next,
        updated_at: new Date().toISOString(),
      });
    },
    onMutate: ({ key, value }) => {
      qc.setQueryData(["notification_prefs", user?.id], (old: Prefs) => ({ ...old, [key]: value }));
    },
  });

  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-background/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[88vh] w-full max-w-[480px] overflow-y-auto rounded-t-3xl border border-border/60 bg-surface-elevated no-scrollbar"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-border/60" />
            </div>

            <div className="flex items-center justify-between px-5 py-3">
              <h2 className="font-display text-xl font-medium">Notificações</h2>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead.mutate()}
                    className="text-[11px] text-primary underline-offset-2 hover:underline"
                  >
                    Marcar todas como lidas
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-surface text-muted-foreground"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Preferências */}
            <div className="mx-5 mb-4 overflow-hidden rounded-2xl border border-border/60 bg-card">
              <p className="px-4 pt-3.5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Preferências
              </p>
              {TOGGLES.map(({ key, label }, i) => (
                <div
                  key={key}
                  className={`flex items-center justify-between px-4 py-3 ${i < TOGGLES.length - 1 ? "border-b border-border/60" : ""}`}
                >
                  <span className="text-sm">{label}</span>
                  <button
                    onClick={() => updatePref.mutate({ key, value: !prefs[key] })}
                    aria-pressed={prefs[key]}
                    className={`relative h-6 w-11 rounded-full transition-colors ${prefs[key] ? "bg-primary" : "bg-surface border border-border/60"}`}
                  >
                    <motion.span
                      layout
                      transition={{ type: "spring", stiffness: 500, damping: 32 }}
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow ${prefs[key] ? "right-0.5" : "left-0.5"}`}
                    />
                  </button>
                </div>
              ))}
            </div>

            {/* Lista */}
            <div className="flex flex-col gap-2 px-5 pb-8">
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Recentes
              </p>
              {notifs.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-3xl mb-2">🔔</p>
                  <p className="text-sm text-muted-foreground">Nenhuma notificação ainda</p>
                </div>
              ) : (
                notifs.map((n) => {
                  const style = TYPE_STYLE[n.type] ?? TYPE_STYLE.general;
                  const Icon = style.Icon;
                  return (
                    <motion.button
                      key={n.id}
                      onClick={() => !n.read && markRead.mutate(n.id)}
                      whileTap={{ scale: 0.98 }}
                      className="flex w-full items-start gap-3 rounded-2xl border border-border/60 bg-card p-3.5 text-left"
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.bg}`}>
                        <Icon size={15} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">{n.title}</p>
                        {n.body && (
                          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                            {n.body}
                          </p>
                        )}
                        <p className="mt-1.5 text-[10px] text-muted-foreground/70">
                          {formatTime(n.created_at)}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
