import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X, Bell, Tag, MapPin, Sparkles } from "lucide-react";

type Notif = {
  id: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
};

const INITIAL: Notif[] = [
  {
    id: "n1",
    icon: <Bell size={15} />,
    iconBg: "bg-primary/20 text-primary",
    title: "Reserva confirmada",
    description: "Sua reserva no Sakura Omakase está confirmada para hoje às 20:30.",
    time: "há 2h",
    unread: true,
  },
  {
    id: "n2",
    icon: <Tag size={15} />,
    iconBg: "bg-gold/20 text-gold",
    title: "20% off no Sakura Sushi",
    description: "Oferta exclusiva válida só hoje para reservas acima de 2 pessoas.",
    time: "há 5h",
    unread: true,
  },
  {
    id: "n3",
    icon: <MapPin size={15} />,
    iconBg: "bg-emerald-500/20 text-emerald-400",
    title: "Novo restaurante perto de você",
    description: "Casa do Pão acabou de abrir em Pinheiros. Confira o cardápio.",
    time: "há 1d",
    unread: false,
  },
  {
    id: "n4",
    icon: <Sparkles size={15} />,
    iconBg: "bg-violet-500/20 text-violet-400",
    title: "Lembrete de reserva",
    description: "Sua reserva no Atelier Trufa é amanhã às 19h30. Não esqueça!",
    time: "há 1d",
    unread: false,
  },
];

const TOGGLES = [
  "Lembrete de reserva",
  "Promoções e descontos",
  "Restaurantes novos",
  "Novidades do app",
];

type Props = {
  open: boolean;
  onClose: () => void;
  onUnreadChange: (count: number) => void;
};

export function NotificationsDrawer({ open, onClose, onUnreadChange }: Props) {
  const [notifs, setNotifs] = useState(INITIAL);
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    "Lembrete de reserva": true,
    "Promoções e descontos": true,
    "Restaurantes novos": true,
    "Novidades do app": false,
  });

  const markRead = (id: string) => {
    const updated = notifs.map((n) => (n.id === id ? { ...n, unread: false } : n));
    setNotifs(updated);
    onUnreadChange(updated.filter((n) => n.unread).length);
  };

  const markAllRead = () => {
    const updated = notifs.map((n) => ({ ...n, unread: false }));
    setNotifs(updated);
    onUnreadChange(0);
  };

  const toggleSwitch = (label: string) =>
    setToggles((t) => ({ ...t, [label]: !t[label] }));

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
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-border/60" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <h2 className="font-display text-xl font-medium">Notificações</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={markAllRead}
                  className="text-[11px] text-primary underline-offset-2 hover:underline"
                >
                  Marcar todas como lidas
                </button>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-surface text-muted-foreground"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Toggles */}
            <div className="mx-5 mb-4 overflow-hidden rounded-2xl border border-border/60 bg-card">
              <p className="px-4 pt-3.5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Preferências
              </p>
              {TOGGLES.map((label, i) => (
                <div
                  key={label}
                  className={`flex items-center justify-between px-4 py-3 ${i < TOGGLES.length - 1 ? "border-b border-border/60" : ""}`}
                >
                  <span className="text-sm">{label}</span>
                  <button
                    onClick={() => toggleSwitch(label)}
                    aria-pressed={toggles[label]}
                    className={`relative h-6 w-11 rounded-full transition-colors ${toggles[label] ? "bg-primary" : "bg-surface border border-border/60"}`}
                  >
                    <motion.span
                      layout
                      transition={{ type: "spring", stiffness: 500, damping: 32 }}
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow ${toggles[label] ? "right-0.5" : "left-0.5"}`}
                    />
                  </button>
                </div>
              ))}
            </div>

            {/* Notification cards */}
            <div className="flex flex-col gap-2 px-5 pb-8">
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Recentes
              </p>
              {notifs.map((n) => (
                <motion.button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  whileTap={{ scale: 0.98 }}
                  className="flex w-full items-start gap-3 rounded-2xl border border-border/60 bg-card p-3.5 text-left"
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${n.iconBg}`}>
                    {n.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{n.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                      {n.description}
                    </p>
                    <p className="mt-1.5 text-[10px] text-muted-foreground/70">{n.time}</p>
                  </div>
                  {n.unread && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
