import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Share2,
  Star,
  Clock,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  X,
  CheckCircle,
  Loader2,
  Users,
  Calendar,
  Phone,
  Heart,
} from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { useQuery } from "@tanstack/react-query";
import { useRestaurant } from "@/lib/hooks/useRestaurant";
import { useMenuItems } from "@/lib/hooks/useMenuItems";
import { useCreateReservation } from "@/lib/hooks/useReservation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/restaurante/$id")({
  component: RestaurantPage,
});

/* ─── helpers ─────────────────────────────────────────────────── */

function getNext7Days() {
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 2);
  return Array.from({ length: 60 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    if (d > maxDate) return null;
    const weekday = d
      .toLocaleDateString("pt-BR", { weekday: "short" })
      .slice(0, 3)
      .toUpperCase()
      .replace(".", "");
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return { weekday, day, label: `${day}/${month}`, iso: d.toISOString().split("T")[0] };
  }).filter(Boolean) as { weekday: string; day: string; label: string; iso: string }[];
}

function generateTimeSlots(opening: string, closing: string) {
  const slots: string[] = [];
  const [oh, om] = opening.split(":").map(Number);
  const [ch] = closing.split(":").map(Number);
  let h = oh, m = om;
  const limit = ch <= oh ? 24 : ch; // handle past-midnight close
  while (h < limit) {
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += 30;
    if (m >= 60) { m = 0; h++; }
  }
  return slots;
}

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const MENU_CATEGORIES = ["Entradas", "Pratos", "Sobremesas", "Bebidas"] as const;

/* ─── step indicator ──────────────────────────────────────────── */

function StepIndicator({ current }: { current: number }) {
  const steps = ["Data", "Horário", "Contato", "Confirmar"];
  return (
    <div className="flex items-start gap-1 px-5 pt-5 pb-4">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-center">
              {i > 0 && <div className={`h-px flex-1 ${done ? "bg-primary" : "bg-border/60"}`} />}
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                  done
                    ? "bg-primary text-primary-foreground"
                    : active
                    ? "border border-primary/60 bg-primary/15 text-primary"
                    : "border border-border/60 bg-surface text-muted-foreground"
                }`}
              >
                {done ? "✓" : n}
              </div>
              {i < steps.length - 1 && <div className={`h-px flex-1 ${done ? "bg-primary" : "bg-border/60"}`} />}
            </div>
            <span className={`text-[9px] uppercase tracking-wider ${active ? "text-primary" : "text-muted-foreground"}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── skeleton ────────────────────────────────────────────────── */

function RestaurantSkeleton() {
  return (
    <MobileShell>
      <div className="animate-pulse">
        <div className="h-[320px] bg-surface" />
        <div className="px-5 pt-5">
          <div className="h-8 w-3/4 rounded-xl bg-surface mb-2" />
          <div className="h-4 w-1/2 rounded-xl bg-surface mb-4" />
          <div className="flex gap-2">
            <div className="h-6 w-20 rounded-full bg-surface" />
            <div className="h-6 w-16 rounded-full bg-surface" />
          </div>
        </div>
      </div>
    </MobileShell>
  );
}

/* ─── main page ───────────────────────────────────────────────── */

function RestaurantPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user, isConfigured } = useAuth();
  const { isFavorite, toggle: toggleFav } = useFavorites(user);
  const { data: restaurant, isLoading } = useRestaurant(id);
  const { data: menuItems = [] } = useMenuItems(id);
  const createReservation = useCreateReservation();

  const [tab, setTab] = useState<"Cardápio" | "Reservar">("Cardápio");
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Reservar state
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [phone, setPhone] = useState("");
  const [bookedModal, setBookedModal] = useState(false);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  const days = getNext7Days();
  const timeSlots = restaurant
    ? generateTimeSlots(restaurant.opening_time, restaurant.closing_time)
    : [];

  // Real booked slots for selected date
  const { data: bookedSlots = [] } = useQuery({
    queryKey: ["bookedSlots", id, selectedDate],
    queryFn: async () => {
      if (!supabase || !selectedDate) return [];
      const { data } = await supabase
        .from("reservations")
        .select("time_slot")
        .eq("restaurant_id", id)
        .eq("reservation_date", selectedDate)
        .in("status", ["confirmed", "pending"]);
      return (data ?? []).map((r: any) => r.time_slot as string);
    },
    enabled: !!selectedDate,
  });

  useEffect(() => {
    const handleScroll = () => setShowStickyHeader(window.scrollY > 260);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: restaurant?.name, url }).catch(() => null);
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    }
  }

  async function handleConfirmReservation() {
    if (!restaurant || !selectedSlot) return;
    if (isConfigured && !user) {
      navigate({ to: "/login", search: { redirect: `/restaurante/${id}` } });
      return;
    }
    try {
      const result = await createReservation.mutateAsync({
        restaurant_id: restaurant.id,
        reservation_date: selectedDate,
        time_slot: selectedSlot,
        party_size: partySize,
        contact_phone: phone,
      });
      setSuccessCode(result.confirmation_code);
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao criar reserva.");
    }
  }

  if (isLoading) return <RestaurantSkeleton />;

  if (!restaurant) {
    return (
      <MobileShell>
        <div className="flex flex-col items-center justify-center gap-4 px-5 pt-20 text-center">
          <p className="text-5xl">🍽️</p>
          <p className="font-display text-xl">Restaurante não encontrado</p>
          <Link to="/" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            Voltar ao início
          </Link>
        </div>
      </MobileShell>
    );
  }

  // Success screen
  if (successCode) {
    return (
      <MobileShell>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center px-5 pt-16 pb-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 22, delay: 0.1 }}
          >
            <CheckCircle size={72} className="text-primary" strokeWidth={1.5} />
          </motion.div>
          <h1 className="font-display mt-5 text-3xl font-medium">Reserva confirmada!</h1>
          <div className="mt-4 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5">
            <span className="font-mono text-sm font-bold text-primary">{successCode}</span>
          </div>

          <div className="mt-6 w-full overflow-hidden rounded-2xl border border-border/60 bg-card text-left">
            <img src={restaurant.image_url} alt={restaurant.name} className="h-[130px] w-full object-cover" />
            <div className="p-4">
              <p className="font-display text-lg">{restaurant.name}</p>
              <p className="text-[11px] text-muted-foreground">{restaurant.address}</p>
              <div className="mt-3 grid grid-cols-3 divide-x divide-border/60 text-center">
                {[
                  { icon: <Calendar size={12} />, label: selectedDate },
                  { icon: <Clock size={12} />, label: selectedSlot },
                  { icon: <Users size={12} />, label: `${partySize} pessoas` },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col items-center gap-1 px-2 py-2">
                    <span className="text-primary">{s.icon}</span>
                    <span className="text-[11px]">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-border/60 bg-surface/60 p-4 text-left">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Você receberá uma mensagem de lembrete próximo ao horário da sua reserva.
            </p>
          </div>

          <div className="mt-6 flex w-full flex-col gap-2">
            <Link
              to="/reservas"
              className="flex w-full items-center justify-center rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground"
            >
              Ver minhas reservas
            </Link>
            <Link
              to="/"
              className="flex w-full items-center justify-center rounded-xl border border-border/60 py-3.5 text-sm text-muted-foreground"
            >
              Voltar ao início
            </Link>
          </div>
        </motion.div>
      </MobileShell>
    );
  }

  const menuByCategory = MENU_CATEGORIES.reduce(
    (acc, cat) => ({ ...acc, [cat]: menuItems.filter((m) => m.category === cat) }),
    {} as Record<string, typeof menuItems>
  );

  return (
    <MobileShell>
      {/* Sticky header */}
      <AnimatePresence>
        {showStickyHeader && (
          <motion.div
            initial={{ y: -48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -48, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed top-0 left-1/2 z-50 flex w-full max-w-[480px] -translate-x-1/2 items-center gap-3 border-b border-border/60 bg-surface-elevated/90 px-4 py-3 backdrop-blur-xl"
          >
            <button onClick={() => navigate({ to: "/" })} className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-surface">
              <ArrowLeft size={14} />
            </button>
            <span className="font-display flex-1 text-base font-medium">{restaurant.name}</span>
            <button onClick={handleShare} className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-surface text-muted-foreground">
              <Share2 size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <div ref={heroRef} className="relative h-[320px]">
        <img src={restaurant.image_url} alt={restaurant.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <button
          onClick={() => navigate({ to: "/" })}
          className="absolute left-4 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/70 backdrop-blur"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="absolute right-4 top-5 flex flex-col gap-2">
          <button
            onClick={handleShare}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/70 backdrop-blur text-foreground"
          >
            <Share2 size={16} />
          </button>
          <button
            onClick={() => toggleFav(id)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/70 backdrop-blur transition-transform active:scale-90"
          >
            <Heart
              size={16}
              className={isFavorite(id) ? "fill-primary text-primary" : "text-foreground"}
            />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="px-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display text-3xl font-medium leading-tight">{restaurant.name}</h1>
          <span className="mt-1 shrink-0 font-display text-lg text-gold">{restaurant.price}</span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
            {restaurant.cuisine}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Star size={11} className="fill-gold text-gold" /> {restaurant.rating}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock size={11} /> {restaurant.opening_time}–{restaurant.closing_time}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin size={11} /> {restaurant.location}
          </span>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{restaurant.description}</p>
      </div>

      {/* Tabs */}
      <div className="mt-5 px-5">
        <div className="relative flex gap-1 rounded-full border border-border/60 bg-surface/60 p-1 backdrop-blur">
          {(["Cardápio", "Reservar"] as const).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative flex-1 rounded-full py-2 text-[11px] font-medium transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
              >
                {active && (
                  <motion.span
                    layoutId="restaurant-tab"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-primary/15"
                  />
                )}
                <span className="relative">{t}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === "Cardápio" ? (
          <motion.div
            key="cardapio"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            {/* Category anchors */}
            <div className="mt-4 overflow-x-auto px-5 no-scrollbar">
              <div className="flex gap-2 pb-1">
                {MENU_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      document.getElementById(`section-${cat}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className="shrink-0 rounded-full border border-border/60 bg-surface/60 px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu sections */}
            <div className="mt-2 flex flex-col gap-0 pb-8">
              {MENU_CATEGORIES.map((cat) => {
                const items = menuByCategory[cat] ?? [];
                if (!items.length) return null;
                return (
                  <div key={cat} id={`section-${cat}`}>
                    <div className="sticky top-0 z-10 bg-background/95 px-5 py-2.5 backdrop-blur">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {cat}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 px-5 pb-3">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-3"
                        >
                          <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-xl bg-surface text-3xl">
                            🍽️
                          </div>
                          <div className="flex flex-1 flex-col justify-between self-stretch py-0.5">
                            <div>
                              <p className="text-sm font-medium leading-tight">{item.name}</p>
                              {item.description && (
                                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <p className="mt-1 text-sm font-semibold text-gold">{item.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="reservar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="pb-28"
          >
            <StepIndicator current={step} />

            <AnimatePresence mode="wait">
              {/* Step 1: Data + Pessoas */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22 }}
                  className="px-5"
                >
                  <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Escolha uma data
                  </p>
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {days.map((d) => {
                      const active = selectedDate === d.iso;
                      return (
                        <button
                          key={d.iso}
                          onClick={() => setSelectedDate(d.iso)}
                          className={`relative flex w-[58px] shrink-0 flex-col items-center rounded-2xl border px-2 py-3 transition-colors ${
                            active
                              ? "border-primary/50 bg-primary/15 text-primary"
                              : "border-border/60 bg-surface/60 text-muted-foreground"
                          }`}
                        >
                          <span className="text-[9px] uppercase tracking-wider">{d.weekday}</span>
                          <span className="font-display mt-0.5 text-xl">{d.day}</span>
                        </button>
                      );
                    })}
                  </div>

                  <p className="mt-6 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Quantas pessoas?
                  </p>
                  <div className="mt-3 flex items-center gap-4 rounded-2xl border border-border/60 bg-card px-5 py-4">
                    <button
                      onClick={() => setPartySize((p) => Math.max(1, p - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-surface text-foreground"
                    >
                      <Minus size={15} />
                    </button>
                    <p className="flex-1 text-center font-display text-2xl">{partySize}</p>
                    <button
                      onClick={() => setPartySize((p) => Math.min(12, p + 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/40 bg-primary/15 text-primary"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                  <p className="mt-1 text-center text-[11px] text-muted-foreground">
                    {partySize} {partySize === 1 ? "pessoa" : "pessoas"}
                  </p>

                  <button
                    disabled={!selectedDate}
                    onClick={() => setStep(2)}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
                  >
                    Próximo <ChevronRight size={16} />
                  </button>
                </motion.div>
              )}

              {/* Step 2: Horário */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22 }}
                  className="px-5"
                >
                  <button onClick={() => setStep(1)} className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ChevronLeft size={14} /> Voltar
                  </button>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Horários disponíveis
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {timeSlots.map((slot) => {
                      const booked = bookedSlots.includes(slot);
                      const active = selectedSlot === slot;
                      return (
                        <button
                          key={slot}
                          onClick={() => {
                            if (booked) { setBookedModal(true); return; }
                            setSelectedSlot(slot);
                          }}
                          className={`relative rounded-xl border py-2.5 text-xs transition-colors ${
                            booked
                              ? "border-border/40 bg-surface/40 text-muted-foreground/40 line-through"
                              : active
                              ? "border-primary/50 bg-primary/20 font-semibold text-primary"
                              : "border-primary/30 bg-surface/60 text-primary"
                          }`}
                        >
                          {slot}
                          {booked && (
                            <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-surface px-1.5 text-[8px] text-muted-foreground/60">
                              Esgotado
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    disabled={!selectedSlot}
                    onClick={() => setStep(3)}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
                  >
                    Próximo <ChevronRight size={16} />
                  </button>
                </motion.div>
              )}

              {/* Step 3: Contato */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22 }}
                  className="px-5"
                >
                  <button onClick={() => setStep(2)} className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ChevronLeft size={14} /> Voltar
                  </button>
                  <label className="block text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Seu WhatsApp ou telefone para contato
                  </label>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Usaremos para enviar lembretes sobre sua reserva.
                  </p>
                  <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border/60 bg-surface/60 px-4 py-3.5">
                    <Phone size={15} className="text-muted-foreground shrink-0" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => setPhone(maskPhone(e.target.value))}
                      placeholder="(00) 00000-0000"
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                    />
                  </div>

                  <button
                    disabled={phone.replace(/\D/g, "").length < 10}
                    onClick={() => setStep(4)}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
                  >
                    Próximo <ChevronRight size={16} />
                  </button>
                </motion.div>
              )}

              {/* Step 4: Confirmar */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22 }}
                  className="px-5"
                >
                  <button onClick={() => setStep(3)} className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ChevronLeft size={14} /> Voltar
                  </button>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Resumo da reserva
                  </p>

                  <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-card">
                    <img src={restaurant.image_url} alt={restaurant.name} className="h-[100px] w-full object-cover" />
                    <div className="p-4">
                      <p className="font-display text-lg">{restaurant.name}</p>
                      <p className="text-[11px] text-muted-foreground">{restaurant.address}</p>
                      <div className="mt-3 grid grid-cols-3 divide-x divide-border/60 text-center">
                        {[
                          { icon: <Calendar size={12} />, label: selectedDate },
                          { icon: <Clock size={12} />, label: selectedSlot },
                          { icon: <Users size={12} />, label: `${partySize}p` },
                        ].map((s) => (
                          <div key={s.label} className="flex flex-col items-center gap-1 py-2">
                            <span className="text-primary">{s.icon}</span>
                            <span className="text-[11px]">{s.label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
                        <Phone size={11} /> {phone}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky bottom bar (Reservar tab) */}
      {tab === "Reservar" && !successCode && (
        <div className="fixed bottom-[80px] left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-border/60 bg-surface-elevated/90 px-5 py-3 backdrop-blur-xl">
          <button
            disabled={step < 4 ? false : !selectedSlot || createReservation.isPending}
            onClick={step === 4 ? handleConfirmReservation : () => {
              if (step === 1 && selectedDate) setStep(2);
              else if (step === 2 && selectedSlot) setStep(3);
              else if (step === 3 && phone.replace(/\D/g, "").length >= 10) setStep(4);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
          >
            {createReservation.isPending ? (
              <><Loader2 size={15} className="animate-spin" /> Confirmando...</>
            ) : selectedSlot ? (
              step === 4 ? `Confirmar Reserva · ${selectedSlot}` : `Próximo · ${selectedSlot}`
            ) : (
              "Selecione um horário"
            )}
          </button>
        </div>
      )}

      {/* Booked slot modal */}
      <AnimatePresence>
        {bookedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-end justify-center bg-background/70 backdrop-blur-sm"
            onClick={() => setBookedModal(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 34 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[480px] rounded-t-3xl border border-border/60 bg-surface-elevated px-5 py-6"
            >
              <div className="flex justify-center pt-0 pb-4">
                <div className="h-1 w-10 rounded-full bg-border/60" />
              </div>
              <p className="text-center text-3xl">😕</p>
              <h3 className="font-display mt-3 text-center text-lg">Este horário está indisponível</h3>
              <p className="mt-2 text-center text-[12px] leading-relaxed text-muted-foreground">
                Escolha outro horário para continuar sua reserva.
              </p>
              <button
                onClick={() => setBookedModal(false)}
                className="mt-5 flex w-full items-center justify-center rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground"
              >
                Escolher outro horário
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileShell>
  );
}
