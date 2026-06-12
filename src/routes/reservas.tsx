import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Users,
  MoreHorizontal,
  ChevronDown,
  Heart,
  X,
  MapPin,
  Phone,
  Star,
  Share2,
  Bell,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import sushiImg from "@/assets/sushi.jpg";

export const Route = createFileRoute("/reservas")({
  component: Reservas,
  head: () => ({ meta: [{ title: "Reservas — Reservê" }] }),
});

type Dish = { name: string; price: string; description?: string };

type Reservation = {
  id?: string;
  reservationDate?: string; // ISO format yyyy-mm-dd, used for DB updates
  name: string;
  img: string;
  date: string;
  time: string;
  people: number;
  address: string;
  phone: string;
  rating: number;
  cuisine: string;
  description: string;
  status: "Confirmada" | "Aguardando";
  dishes: Dish[];
};

const upcomingSeed: Reservation[] = [
  {
    name: "Sakura Omakase",
    img: sushiImg,
    date: "Sex, 16 Mai",
    time: "20:30",
    people: 2,
    address: "Rua dos Pinheiros 1280, Jardins",
    phone: "+55 11 4002-8922",
    rating: 4.9,
    cuisine: "Japonês contemporâneo",
    description:
      "Balcão íntimo de 10 lugares. Omakase autoral do chef Kenzo Arata, com peixes selecionados diariamente do Tsukiji.",
    status: "Confirmada",
    dishes: [
      { name: "Omakase 12 cortes", price: "R$ 320", description: "Seleção do chef, 12 etapas" },
      { name: "Sashimi de toro", price: "R$ 145", description: "Barriga de atum gordo" },
      { name: "Tempura de camarão", price: "R$ 78", description: "Camarão rosa empanado" },
      { name: "Sake pairing", price: "R$ 220", description: "Harmonização 5 doses" },
    ],
  },
  {
    name: "Atelier Trufa",
    img: sushiImg,
    date: "Sáb, 24 Mai",
    time: "21:00",
    people: 4,
    address: "Rua Aspicuelta 410, Vila Madalena",
    phone: "+55 11 3815-7733",
    rating: 4.8,
    cuisine: "Italiano · Autoral",
    description:
      "Cozinha italiana contemporânea com massas frescas feitas na hora e foco em trufas brancas e negras.",
    status: "Aguardando",
    dishes: [
      { name: "Tagliolini ao tartufo", price: "R$ 189", description: "Massa fresca, lascas de trufa" },
      { name: "Risoto de funghi porcini", price: "R$ 162" },
      { name: "Burrata com trufa negra", price: "R$ 98" },
      { name: "Tiramisù da casa", price: "R$ 54" },
    ],
  },
];

const tabs = ["Próximas", "Club", "Histórico"] as const;
type Tab = (typeof tabs)[number];

const TYPE_LABELS: Record<string, string> = {
  chef_table: "Mesa do Chef",
  private_dinner: "Jantar Privado",
  harmonization: "Harmonização",
  tasting_menu: "Menu Degustação",
  blind_dinner: "Mesa às Cegas",
};

const TYPE_IMAGES: Record<string, string> = {
  chef_table: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80",
  private_dinner: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
  harmonization: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80",
  tasting_menu: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80",
  blind_dinner: "https://images.unsplash.com/photo-1530469912745-a215c6b256ea?w=600&q=80",
};

const TYPE_ACCENT: Record<string, string> = {
  chef_table: "#D4A853",
  private_dinner: "#C17B7B",
  harmonization: "#9B7EC8",
  tasting_menu: "#6BAF8E",
  blind_dinner: "#7B9FC1",
};

const itemAnim = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

type Modal =
  | { kind: "details"; r: Reservation }
  | { kind: "reschedule"; r: Reservation }
  | null;

function Reservas() {
  const { user, loading: authLoading, isConfigured } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("Próximas");
  const [modal, setModal] = useState<Modal>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({
    "Sakura Omakase": true,
  });

  /* ── Real reservations from Supabase ── */
  const { data: realUpcoming = [] } = useQuery({
    queryKey: ["userReservations", user?.id],
    queryFn: async () => {
      if (!supabase || !user) return [];
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("reservations")
        .select(`*, restaurants(name, image_url, address, cuisine, rating)`)
        .in("status", ["confirmed", "pending"])
        .gte("reservation_date", today)
        .order("reservation_date", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r: any): Reservation => ({
        id: r.id,
        reservationDate: r.reservation_date,
        name: r.restaurants?.name ?? "Restaurante",
        img: r.restaurants?.image_url ?? sushiImg,
        date: new Date(r.reservation_date + "T12:00:00").toLocaleDateString("pt-BR", {
          weekday: "short",
          day: "numeric",
          month: "short",
        }),
        time: r.time_slot,
        people: r.party_size,
        address: r.restaurants?.address ?? "",
        phone: r.contact_phone ?? "",
        rating: r.restaurants?.rating ?? 0,
        cuisine: r.restaurants?.cuisine ?? "",
        description: "",
        status: r.status === "confirmed" ? "Confirmada" : "Aguardando",
        dishes: [],
      }));
    },
    enabled: isConfigured && !!user,
  });

  const { data: pastReservations = [] } = useQuery({
    queryKey: ["pastReservations", user?.id],
    queryFn: async () => {
      if (!supabase || !user) return [];
      const today = new Date().toISOString().slice(0, 10);
      // Past by date OR cancelled/completed
      const [byDate, byStatus] = await Promise.all([
        supabase
          .from("reservations")
          .select(`*, restaurants(name, image_url, address, cuisine, rating)`)
          .lt("reservation_date", today)
          .order("reservation_date", { ascending: false }),
        supabase
          .from("reservations")
          .select(`*, restaurants(name, image_url, address, cuisine, rating)`)
          .in("status", ["cancelled", "completed"])
          .order("reservation_date", { ascending: false }),
      ]);
      const combined = [...(byDate.data ?? []), ...(byStatus.data ?? [])];
      const seen = new Set<string>();
      return combined.filter((r: any) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      }) as any[];
    },
    enabled: isConfigured && !!user,
  });

  const { data: expBookings = [] } = useQuery({
    queryKey: ["expBookings", user?.id],
    queryFn: async () => {
      if (!supabase || !user) return [];
      const { data } = await supabase
        .from("experience_bookings")
        .select("*, experiences(title, type, event_date, event_time, price_per_person, restaurants(name, location, image_url))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as any[];
    },
    enabled: isConfigured && !!user,
  });

  const upcomingList: Reservation[] = isConfigured && user ? realUpcoming : upcomingSeed;
  const [reservations, setReservations] = useState<Reservation[]>(upcomingSeed);
  const displayReservations = isConfigured && user ? upcomingList : reservations;

  const toggleFav = (name: string) =>
    setFavorites((f) => ({ ...f, [name]: !f[name] }));

  const cancelReservation = async (r: Reservation) => {
    if (!r.id || !supabase) return;
    await supabase.from("reservations").update({ status: "cancelled" }).eq("id", r.id);
    qc.invalidateQueries({ queryKey: ["userReservations", user?.id] });
    toast.success("Reserva cancelada.");
  };

  const confirmPresence = async (r: Reservation) => {
    if (!r.id || !supabase) return;
    await supabase.from("reservations").update({ status: "confirmed" }).eq("id", r.id);
    qc.invalidateQueries({ queryKey: ["userReservations", user?.id] });
    setModal(null);
    toast.success("Presença confirmada!");
  };

  const reschedule = async (r: Reservation, isoDate: string, time: string) => {
    if (r.id && supabase) {
      await supabase
        .from("reservations")
        .update({ reservation_date: isoDate, time_slot: time })
        .eq("id", r.id);
    }
    setReservations((rs) =>
      rs.map((x) => (x.name === r.name ? { ...x, reservationDate: isoDate, time } : x))
    );
    setModal(null);
  };

  /* ── Auth gate ── */
  if (isConfigured && !authLoading && !user) {
    return (
      <MobileShell>
        <header className="flex items-center px-5 pt-6">
          <Logo />
        </header>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center justify-center px-5 py-20 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-border/60 bg-surface text-4xl">
            🍽️
          </div>
          <h1 className="font-display mt-6 text-2xl text-foreground">
            Faça login para ver suas reservas
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre na sua conta para acompanhar todas as suas reservas.
          </p>
          <div className="mt-8 flex w-full flex-col gap-3">
            <Link
              to="/login"
              search={{ redirect: "/reservas" }}
              className="flex w-full items-center justify-center rounded-full bg-accent py-3.5 text-sm font-semibold text-accent-foreground"
            >
              Entrar
            </Link>
            <Link
              to="/signup"
              search={{ redirect: "/reservas" }}
              className="flex w-full items-center justify-center rounded-full border border-border/60 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
            >
              Criar conta
            </Link>
          </div>
        </motion.div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 pt-6">
        <Logo />
      </header>

      <section className="px-5 pt-7">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Suas mesas</p>
        <h1 className="font-display mt-2 text-[34px] font-light leading-[1.05]">
          {tab === "Club" ? (
            <>Reservê <span className="text-gradient-gold italic">Club</span></>
          ) : (
            <>Reservas <span className="text-gradient-gold italic">{tab.toLowerCase()}</span></>
          )}
        </h1>
      </section>

      {/* Tabs */}
      <div className="mt-5 px-5">
        <div className="relative flex gap-0.5 rounded-full border border-border/60 bg-surface/60 p-1 backdrop-blur">
          {tabs.map((t) => {
            const active = tab === t;
            const isClub = t === "Club";
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative flex-1 rounded-full py-2 text-[10px] font-medium transition-colors flex items-center justify-center gap-1 ${
                  active
                    ? isClub ? "text-gold" : "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="reservas-tab-pill"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className={`absolute inset-0 rounded-full ${isClub ? "bg-gold/15" : "bg-primary/15"}`}
                  />
                )}
                {isClub && <Sparkles size={9} className="relative shrink-0" />}
                <span className="relative">{t}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === "Próximas" && (
          <motion.section
            key="upcoming"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-6 flex flex-col gap-4 px-5"
          >
            {displayReservations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3 py-16 text-center"
              >
                <p className="text-4xl">🍽️</p>
                <p className="font-display text-lg text-foreground">Sem reservas próximas</p>
                <p className="text-sm text-muted-foreground">
                  Você ainda não tem nenhuma reserva agendada.
                </p>
                <Link
                  to="/"
                  className="mt-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Explorar restaurantes
                </Link>
              </motion.div>
            ) : (
              displayReservations.map((r, i) => (
                <ReservationCard
                  key={r.name + i}
                  r={r}
                  i={i}
                  isFav={!!favorites[r.name]}
                  onToggleFav={() => toggleFav(r.name)}
                  onDetails={() => setModal({ kind: "details", r })}
                  onReschedule={() => setModal({ kind: "reschedule", r })}
                  onCancel={() => cancelReservation(r)}
                />
              ))
            )}
          </motion.section>
        )}

        {tab === "Histórico" && (
          <motion.section
            key="past"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-6 flex flex-col gap-3 px-5"
          >
            {pastReservations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3 py-16 text-center"
              >
                <p className="text-4xl">🍽️</p>
                <p className="font-display text-lg text-foreground">Sem histórico ainda</p>
                <p className="text-sm text-muted-foreground">
                  Suas reservas concluídas aparecerão aqui.
                </p>
              </motion.div>
            ) : (
              pastReservations.map((r: any, i: number) => (
                <PastReservationCard key={r.id} r={r} i={i} />
              ))
            )}
          </motion.section>
        )}

        {tab === "Club" && (
          <motion.section
            key="club"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-6 flex flex-col gap-4 px-5"
          >
            {expBookings.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3 py-16 text-center"
              >
                <p className="text-3xl text-gold/60">✦</p>
                <p className="font-display text-lg">Sem experiências</p>
                <p className="text-sm text-muted-foreground">
                  Você ainda não reservou nenhuma experiência Club.
                </p>
                <Link
                  to="/clube"
                  className="mt-2 rounded-full bg-gold/20 border border-gold/40 px-5 py-2.5 text-sm font-semibold text-gold"
                >
                  Explorar experiências
                </Link>
              </motion.div>
            ) : (
              expBookings.map((b: any, i: number) => (
                <ExperienceBookingCard key={b.id} booking={b} i={i} />
              ))
            )}
          </motion.section>
        )}

      </AnimatePresence>

      <AnimatePresence>
        {modal?.kind === "details" && (
          <DetailsModal r={modal.r} onClose={() => setModal(null)} onConfirmPresence={() => confirmPresence(modal.r)} />
        )}
        {modal?.kind === "reschedule" && (
          <RescheduleModal
            r={modal.r}
            onClose={() => setModal(null)}
            onConfirm={(isoDate, t) => reschedule(modal.r, isoDate, t)}
          />
        )}
      </AnimatePresence>
    </MobileShell>
  );
}

function ReservationCard({
  r,
  i,
  isFav,
  onToggleFav,
  onDetails,
  onReschedule,
  onCancel,
}: {
  r: Reservation;
  i: number;
  isFav: boolean;
  onToggleFav: () => void;
  onDetails: () => void;
  onReschedule: () => void;
  onCancel: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  return (
    <motion.article
      custom={i}
      variants={itemAnim}
      initial="hidden"
      animate="show"
      className="overflow-hidden rounded-2xl border border-border/60 bg-card glow-soft"
    >
      <div className="relative h-[140px]">
        <img src={r.img} alt={r.name} className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              r.status === "Confirmada"
                ? "bg-primary/90 text-primary-foreground"
                : "bg-gold/20 text-gold border border-gold/30"
            }`}
          >
            ● {r.status}
          </span>
          <button
            onClick={onToggleFav}
            aria-label="Favoritar"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background/70 backdrop-blur"
          >
            <motion.span
              key={isFav ? "on" : "off"}
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
            >
              <Heart
                size={14}
                className={isFav ? "fill-primary text-primary" : "text-muted-foreground"}
              />
            </motion.span>
          </button>
        </div>
        <div className="absolute bottom-3 left-4">
          <h3 className="font-display text-xl">{r.name}</h3>
          <p className="text-[11px] text-muted-foreground">{r.address}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 divide-x divide-border/60 px-1 py-3 text-center">
        <Stat icon={<Calendar size={13} />} label={r.date} />
        <Stat icon={<Clock size={13} />} label={r.time} />
        <Stat icon={<Users size={13} />} label={`${r.people} pessoas`} />
      </div>

      {/* Dishes preview — only shown when dishes exist */}
      {r.dishes.length > 0 && (
        <>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center justify-between border-t border-border/60 px-4 py-3 text-left"
          >
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Pratos do restaurante
              </p>
              <p className="text-xs text-foreground/90">
                {r.dishes.length} sugestões a partir de{" "}
                <span className="text-gold">{r.dishes[r.dishes.length - 1].price}</span>
              </p>
            </div>
            <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-muted-foreground">
              <ChevronDown size={16} />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {open && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden border-t border-border/60 px-4"
              >
                {r.dishes.map((d, idx) => (
                  <li
                    key={d.name}
                    className={`flex justify-between py-2.5 text-xs ${
                      idx < r.dishes.length - 1 ? "border-b border-border/40" : ""
                    }`}
                  >
                    <span className="text-foreground/90">{d.name}</span>
                    <span className="text-gold">{d.price}</span>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </>
      )}


      <div className="relative flex gap-2 border-t border-border/60 p-3">
        <button
          onClick={onDetails}
          className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground"
        >
          Detalhes
        </button>
        <button
          onClick={onReschedule}
          className="rounded-xl border border-border/60 bg-surface px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Reagendar
        </button>
        <button
          onClick={() => setMenu((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menu}
          className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-border/60 bg-surface text-muted-foreground"
        >
          <MoreHorizontal size={15} />
        </button>

        <AnimatePresence>
          {menu && (
            <>
              <button
                aria-label="fechar menu"
                onClick={() => setMenu(false)}
                className="fixed inset-0 z-40 cursor-default"
              />
              <motion.div
                role="menu"
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-14 right-3 z-50 w-48 overflow-hidden rounded-xl border border-border/60 bg-surface-elevated shadow-2xl"
              >
                <MenuItem icon={<Share2 size={13} />} label="Compartilhar" onClick={() => setMenu(false)} />
                <MenuItem icon={<Bell size={13} />} label="Lembrete" onClick={() => setMenu(false)} />
                <MenuItem
                  icon={<XCircle size={13} />}
                  label="Cancelar reserva"
                  onClick={() => { setMenu(false); onCancel(); }}
                  destructive
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      role="menuitem"
      className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs transition-colors hover:bg-primary/10 ${
        destructive ? "text-red-400" : "text-foreground/90"
      }`}
    >
      <span className={destructive ? "text-red-400" : "text-muted-foreground"}>{icon}</span>
      {label}
    </button>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-2">
      <span className="text-primary">{icon}</span>
      <span className="text-[11px] text-foreground">{label}</span>
    </div>
  );
}

function ModalShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-background/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 34 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border/60 bg-surface-elevated sm:rounded-3xl no-scrollbar"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function DetailsModal({ r, onClose, onConfirmPresence }: { r: Reservation; onClose: () => void; onConfirmPresence: () => void }) {
  return (
    <ModalShell onClose={onClose}>
      <div className="relative h-[200px]">
        <img src={r.img} alt={r.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-elevated via-surface-elevated/30 to-transparent" />
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/70 backdrop-blur"
        >
          <X size={15} />
        </button>
        <div className="absolute bottom-4 left-5 right-5">
          <p className="text-[10px] uppercase tracking-wider text-gold">{r.cuisine}</p>
          <h3 className="font-display mt-1 text-2xl">{r.name}</h3>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star size={11} className="fill-gold text-gold" /> {r.rating}
            </span>
            <span>·</span>
            <span>{r.address.split(",")[1]?.trim() || r.address}</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-5">
        <p className="text-xs leading-relaxed text-muted-foreground">{r.description}</p>

        <div className="mt-5 grid grid-cols-3 divide-x divide-border/60 rounded-2xl border border-border/60 bg-card py-3 text-center">
          <Stat icon={<Calendar size={13} />} label={r.date} />
          <Stat icon={<Clock size={13} />} label={r.time} />
          <Stat icon={<Users size={13} />} label={`${r.people} pessoas`} />
        </div>

        <div className="mt-5 space-y-2.5">
          <InfoLine icon={<MapPin size={13} />} label={r.address} />
          <InfoLine icon={<Phone size={13} />} label={r.phone} />
        </div>

        <div className="mt-6">
          <div className="flex items-end justify-between">
            <h4 className="font-display text-lg">Pratos principais</h4>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {r.dishes.length} itens
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {r.dishes.map((d) => (
              <li
                key={d.name}
                className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-card px-3.5 py-3"
              >
                <div>
                  <p className="text-sm text-foreground">{d.name}</p>
                  {d.description && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{d.description}</p>
                  )}
                </div>
                <span className="font-display shrink-0 text-sm text-gold">{d.price}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="sticky bottom-0 -mx-5 mt-6 flex gap-2 border-t border-border/60 bg-surface-elevated px-5 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border/60 bg-surface py-3 text-xs font-medium text-muted-foreground"
          >
            Fechar
          </button>
          {r.status === "Aguardando" ? (
            <button
              onClick={onConfirmPresence}
              className="flex-[2] rounded-xl bg-primary py-3 text-xs font-semibold text-primary-foreground"
            >
              Confirmar presença
            </button>
          ) : (
            <span className="flex-[2] flex items-center justify-center rounded-xl bg-primary/10 py-3 text-xs font-semibold text-primary">
              ✓ Confirmada
            </span>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

function InfoLine({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-xs text-foreground/90">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      {label}
    </div>
  );
}

function buildRescheduleDays() {
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 2);
  return Array.from({ length: 60 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    if (d > maxDate) return null;
    return {
      iso: d.toISOString().slice(0, 10),
      short: String(d.getDate()).padStart(2, "0"),
      weekday: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
    };
  }).filter(Boolean) as { iso: string; short: string; weekday: string }[];
}

const TIMES = ["19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"];

function RescheduleModal({
  r,
  onClose,
  onConfirm,
}: {
  r: Reservation;
  onClose: () => void;
  onConfirm: (date: string, time: string) => void;
}) {
  const days = useMemo(() => buildRescheduleDays(), []);
  const [isoDate, setIsoDate] = useState(r.reservationDate ?? days[0]?.iso ?? "");
  const [time, setTime] = useState(r.time);

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60"
          >
            <ChevronLeft size={14} />
          </button>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Reagendar</p>
            <p className="font-display text-base">{r.name}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60"
        >
          <X size={14} />
        </button>
      </div>

      <div className="px-5 py-5">
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Escolha uma data
        </p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {days.map((d) => {
            const active = isoDate === d.iso;
            return (
              <button
                key={d.iso}
                onClick={() => setIsoDate(d.iso)}
                className={`relative flex w-[60px] shrink-0 flex-col items-center rounded-2xl border px-2 py-3 transition-colors ${
                  active
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border/60 bg-surface/60 text-muted-foreground"
                }`}
              >
                <span className="text-[10px] uppercase tracking-wider">{d.weekday}</span>
                <span className="font-display mt-1 text-xl">{d.short}</span>
              </button>
            );
          })}
        </div>

        <p className="mt-6 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Horários disponíveis
        </p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {TIMES.map((t) => {
            const active = time === t;
            return (
              <button
                key={t}
                onClick={() => setTime(t)}
                className={`relative rounded-xl border py-2.5 text-xs transition-colors ${
                  active
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border/60 bg-surface/60 text-muted-foreground"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="time-pill"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="absolute inset-0 -z-10 rounded-xl bg-primary/15"
                  />
                )}
                {t}
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-border/60 bg-card p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Resumo</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm">
              {new Date(isoDate + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })}
            </span>
            <span className="font-display text-base text-gold">{time}</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {r.people} pessoas · {r.address.split(",")[1]?.trim() || r.address}
          </p>
        </div>

        <button
          onClick={() => onConfirm(isoDate, time)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground"
        >
          Confirmar nova data <ChevronRight size={15} />
        </button>
      </div>
    </ModalShell>
  );
}

const STATUS_STYLE: Record<string, string> = {
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};
const STATUS_LABEL: Record<string, string> = {
  completed: "Concluída",
  cancelled: "Cancelada",
  confirmed: "Confirmada",
  pending: "Pendente",
};

function PastReservationCard({ r, i }: { r: any; i: number }) {
  const restaurant = r.restaurants as any;
  const [open, setOpen] = useState(false);

  return (
    <motion.article
      custom={i}
      variants={itemAnim}
      initial="hidden"
      animate="show"
      className="overflow-hidden rounded-2xl border border-border/60 bg-card"
    >
      <button className="flex w-full items-center gap-3 p-3 text-left" onClick={() => setOpen((v) => !v)}>
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
          {restaurant?.image_url ? (
            <img src={restaurant.image_url} alt={restaurant.name} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="h-full w-full bg-surface flex items-center justify-center text-xl">🍽️</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-base truncate">{restaurant?.name ?? "Restaurante"}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {r.reservation_date
              ? new Date(r.reservation_date + "T12:00:00").toLocaleDateString("pt-BR", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "—"}{" · "}{r.time_slot ?? "—"}{" · "}{r.party_size ?? 1} pessoa{(r.party_size ?? 1) !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${STATUS_STYLE[r.status] ?? STATUS_STYLE.completed}`}>
            {STATUS_LABEL[r.status] ?? r.status}
          </span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} className="text-muted-foreground" />
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as const }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/60 px-4 py-3 space-y-2">
              {restaurant?.cuisine && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-primary">✦</span>
                  {restaurant.cuisine}
                </div>
              )}
              {restaurant?.address && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin size={11} className="text-primary shrink-0" />
                  {restaurant.address}
                </div>
              )}
              {r.contact_phone && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone size={11} className="text-primary shrink-0" />
                  {r.contact_phone}
                </div>
              )}
              {r.status === "completed" && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400 font-medium mt-1">
                  <Star size={11} className="fill-emerald-400" />
                  150 pontos creditados
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function ExperienceBookingCard({ booking, i }: { booking: any; i: number }) {
  const exp = booking.experiences as any;
  const restaurant = exp?.restaurants as any;
  const img = TYPE_IMAGES[exp?.type] ?? restaurant?.image_url;
  const accent = TYPE_ACCENT[exp?.type] ?? "#D4A853";
  const label = TYPE_LABELS[exp?.type] ?? exp?.type ?? "Experiência";
  const total = (booking.party_size ?? 1) * Number(exp?.price_per_person ?? 0);

  return (
    <motion.article
      custom={i}
      variants={itemAnim}
      initial="hidden"
      animate="show"
      className="overflow-hidden rounded-2xl border border-gold/20 bg-card shadow-lg shadow-black/10"
    >
      {/* Image */}
      <div className="relative h-36 overflow-hidden">
        {img && (
          <img src={img} alt={exp?.title} className="h-full w-full object-cover" loading="lazy" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

        <span
          className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide backdrop-blur-sm border"
          style={{ background: `${accent}22`, borderColor: `${accent}55`, color: accent }}
        >
          {label}
        </span>

        <span className="absolute top-3 right-3 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white/80 bg-black/40 border border-white/10 backdrop-blur-sm">
          #{booking.confirmation_code}
        </span>

        <div className="absolute bottom-3 left-4 right-4">
          <p className="font-display text-white text-lg leading-tight">{exp?.title}</p>
          <p className="text-[11px] text-white/55 mt-0.5">{restaurant?.name}</p>
        </div>
      </div>

      {/* Info row */}
      <div className="grid grid-cols-3 divide-x divide-border/60 px-1 py-3 text-center">
        <Stat
          icon={<Calendar size={13} />}
          label={
            exp?.event_date
              ? new Date(exp.event_date + "T12:00:00").toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "short",
                })
              : "—"
          }
        />
        <Stat icon={<Clock size={13} />} label={exp?.event_time ?? "—"} />
        <Stat icon={<Users size={13} />} label={`${booking.party_size ?? 1} pessoa${booking.party_size !== 1 ? "s" : ""}`} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
        <span className="text-xs text-muted-foreground">
          Total estimado
        </span>
        <span className="font-display text-base" style={{ color: accent }}>
          R$ {total.toFixed(0)}
        </span>
      </div>
    </motion.article>
  );
}
