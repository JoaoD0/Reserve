import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, Tag, MapPin, Sparkles, Megaphone } from "lucide-react";
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

const SAMPLE_NOTIFICATIONS = [
  {
    id: "1",
    Icon: Bell,
    title: "Reserva confirmada!",
    description: "Sua reserva no Cipriani está confirmada para amanhã às 20h.",
    time: "há 5 min",
    read: false,
  },
  {
    id: "2",
    Icon: Tag,
    title: "Oferta exclusiva",
    description: "20% de desconto no Fasano esta semana para membros Gold.",
    time: "há 2h",
    read: false,
  },
  {
    id: "3",
    Icon: MapPin,
    title: "Novo restaurante",
    description: "L'Amour Bistrot acaba de entrar no Reservê. Confira!",
    time: "há 1 dia",
    read: true,
  },
  {
    id: "4",
    Icon: Megaphone,
    title: "Avalie sua última visita",
    description: "Como foi sua experiência no Maré Alta? Deixe uma avaliação.",
    time: "há 3 dias",
    read: true,
  },
];

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

  const [readIds, setReadIds] = useState<Set<string>>(
    new Set(SAMPLE_NOTIFICATIONS.filter((n) => n.read).map((n) => n.id)),
  );
  const unreadCount = SAMPLE_NOTIFICATIONS.filter((n) => !readIds.has(n.id)).length;

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
            onClick={() => setReadIds(new Set(SAMPLE_NOTIFICATIONS.map((n) => n.id)))}
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
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
            {SAMPLE_NOTIFICATIONS.map((n, i) => {
              const Icon = n.Icon;
              const isRead = readIds.has(n.id);
              return (
                <motion.button
                  key={n.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setReadIds((s) => new Set([...s, n.id]))}
                  className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors ${
                    i < SAMPLE_NOTIFICATIONS.length - 1 ? "border-b border-border/60" : ""
                  } ${!isRead ? "bg-primary/5" : ""}`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon size={15} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!isRead ? "font-bold" : "font-medium"}`}>
                        {n.title}
                      </p>
                      {!isRead && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                      {n.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{n.time}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
