import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  MapPin, Search, Bell, Star, Clock, Flame, ArrowUpRight,
  Sparkles, Fish, UtensilsCrossed, Wine, Martini, Coffee, Navigation, Heart,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { MobileShell } from "@/components/MobileShell";
import { NotificationsDrawer } from "@/components/NotificationsDrawer";
import { LocationSheet, loadStoredLocation, type UserLocation } from "@/components/LocationSheet";
import { useRestaurants } from "@/lib/hooks/useRestaurants";
import { useAuth } from "@/lib/hooks/useAuth";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { haversineKm } from "@/lib/data";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Reservê — Reserve mesas em restaurantes selecionados" },
      { name: "description", content: "Descubra e reserve mesas nos melhores restaurantes da cidade." },
    ],
  }),
});

const BASE_CATEGORIES = [
  { label: "Tudo", Icon: Sparkles },
  { label: "Japonês", Icon: Fish },
  { label: "Italiano", Icon: UtensilsCrossed },
  { label: "Bistrô", Icon: Wine },
  { label: "Bar", Icon: Martini },
  { label: "Brunch", Icon: Coffee },
];

const stagger = { show: { transition: { staggerChildren: 0.07 } } };
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

/* ─── skeleton cards ─────────────────────────────────────────── */

function FeaturedSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto px-5 pb-2 no-scrollbar">
      {[1, 2].map((i) => (
        <div key={i} className="w-[230px] shrink-0 animate-pulse overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="h-[150px] bg-surface" />
          <div className="p-3.5">
            <div className="h-4 w-3/4 rounded-lg bg-surface mb-2" />
            <div className="h-3 w-1/2 rounded-lg bg-surface" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NearbySkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2].map((i) => (
        <div key={i} className="flex animate-pulse gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card p-2">
          <div className="h-[88px] w-[88px] rounded-xl bg-surface" />
          <div className="flex flex-1 flex-col gap-2 py-2">
            <div className="h-4 w-3/4 rounded-lg bg-surface" />
            <div className="h-3 w-1/2 rounded-lg bg-surface" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ category }: { category: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-3 py-10 text-center"
    >
      <p className="text-5xl">🍽️</p>
      <p className="font-display text-base text-foreground">Nenhum resultado</p>
      <p className="text-xs text-muted-foreground">
        Não encontramos restaurantes em "{category}". <br />
        Tente outro filtro.
      </p>
    </motion.div>
  );
}

/* ─── home ───────────────────────────────────────────────────── */

function Home() {
  const [activeCategory, setActiveCategory] = useState("Tudo");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  const { data: restaurants, isLoading } = useRestaurants();
  const { user } = useAuth();
  const { isFavorite, toggle: toggleFav } = useFavorites(user);

  const firstName = (user?.user_metadata?.full_name as string | undefined)
    ?.trim().split(" ")[0] ?? "você";

  const now = new Date();
  const hour = now.getHours();
  const min = now.getMinutes();
  const isDay = hour > 5 || (hour === 5 && min >= 30);
  const greeting = hour >= 18 ? "Boa noite" : !isDay ? "Boa noite" : hour >= 12 ? "Boa tarde" : "Bom dia";

  // Restore location from localStorage on mount
  useEffect(() => {
    const stored = loadStoredLocation();
    if (stored) setUserLocation(stored);
  }, []);

  // Build category list — prepend "Próximos a mim" when location with GPS is set
  const categories = userLocation?.lat
    ? [{ label: "Próximos a mim", Icon: Navigation }, ...BASE_CATEGORIES]
    : BASE_CATEGORIES;

  // Filter restaurants
  const filtered = (restaurants ?? []).filter((r) => {
    if (activeCategory === "Tudo") return true;
    if (activeCategory === "Próximos a mim" && userLocation?.lat) {
      return haversineKm(userLocation.lat!, userLocation.lng!, r.latitude, r.longitude) <= 10;
    }
    return r.cuisine === activeCategory;
  });

  const heroRestaurant = (restaurants ?? []).find((r) => r.id === "mare-alta");
  const featuredList = filtered.filter((r) => r.is_featured);
  const nearbyList = filtered.filter((r) => !r.is_featured && r.id !== "mare-alta");

  const locationLabel = userLocation?.label ?? "São Paulo";

  function handleLocationConfirm(loc: UserLocation) {
    setUserLocation(loc);
    if (activeCategory === "Próximos a mim" && !loc.lat) {
      setActiveCategory("Tudo");
    }
  }

  return (
    <MobileShell>
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 pt-6">
        <Logo />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLocation(true)}
            className="flex items-center gap-1.5 rounded-full border border-border/60 bg-surface/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur"
          >
            <MapPin size={13} className="text-primary" />
            {locationLabel}
          </button>
          <button
            onClick={() => setShowNotifications(true)}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-surface/60 backdrop-blur"
          >
            <Bell size={15} className="text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </button>
        </div>
      </header>

      {/* Greeting + search */}
      <section className="px-5 pt-7">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
          {greeting}, {firstName}
        </p>
        <h1 className="font-display mt-2 text-[28px] font-light leading-[1.15] text-foreground overflow-visible">
          Onde você quer <span className="text-gradient-gold italic inline-block pr-2">reservar?</span>
        </h1>

        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-border/60 bg-surface/70 px-4 py-3.5 backdrop-blur">
          <Search size={17} className="text-muted-foreground" />
          <input
            placeholder="Buscar restaurante, cozinha, bairro..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
          />
          <kbd className="rounded-md border border-border/70 px-1.5 py-0.5 text-[10px] text-muted-foreground">⌘K</kbd>
        </div>
      </section>

      {/* Categories */}
      <section className="mt-6 overflow-x-auto px-5 no-scrollbar">
        <div className="flex gap-2 pb-1">
          {categories.map((c, i) => {
            const Icon = c.Icon;
            const active = activeCategory === c.label;
            return (
              <motion.button
                key={c.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(c.label)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                  active
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-border/60 bg-surface/60 text-muted-foreground"
                }`}
              >
                <Icon size={13} strokeWidth={1.6} /> {c.label}
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Hero card */}
      {heroRestaurant && (
        <motion.section
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 px-5"
        >
          <Link to="/restaurante/$id" params={{ id: heroRestaurant.id }}>
            <div className="relative overflow-hidden rounded-3xl border border-border/60 glow-soft">
              <img
                src={heroRestaurant.image_url}
                alt={heroRestaurant.name}
                className="h-[230px] w-full object-cover"
                width={1024}
                height={768}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

              <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                <Flame size={11} /> Curadoria
              </div>

              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-gold-soft">Esta semana</p>
                <h2 className="font-display mt-1 text-2xl font-medium text-foreground">
                  {heroRestaurant.name}
                </h2>
                <p className="text-xs text-muted-foreground">{heroRestaurant.description.slice(0, 60)}…</p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Star size={11} className="fill-gold text-gold" /> {heroRestaurant.rating}</span>
                    <span>·</span>
                    <span>{heroRestaurant.location}</span>
                    <span>·</span>
                    <span>{heroRestaurant.price}</span>
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-[11px] font-semibold text-background">
                    Reservar <ArrowUpRight size={12} />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </motion.section>
      )}

      {/* Featured horizontal */}
      <section className="mt-8">
        <div className="flex items-end justify-between px-5">
          <div>
            <h3 className="font-display text-xl font-medium">Em destaque</h3>
            <p className="text-xs text-muted-foreground">Casas com horário limitado hoje</p>
          </div>
          <Link to="/" className="text-[11px] uppercase tracking-wider text-primary">
            Ver tudo
          </Link>
        </div>

        <div className="mt-4">
          {isLoading ? (
            <FeaturedSkeleton />
          ) : featuredList.length === 0 ? (
            <div className="px-5">
              <EmptyState category={activeCategory} />
            </div>
          ) : (
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="flex gap-4 overflow-x-auto px-5 pb-2 no-scrollbar"
            >
              {featuredList.map((r) => (
                <motion.article
                  key={r.id}
                  variants={item}
                  whileHover={{ y: -4 }}
                  className="w-[230px] shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-card relative"
                >
                  <Link to="/restaurante/$id" params={{ id: r.id }} className="block">
                    <div className="relative h-[150px]">
                      <img src={r.image_url} alt={r.name} className="h-full w-full object-cover" loading="lazy" />
                      <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-[10px] font-semibold backdrop-blur">
                        <Star size={10} className="fill-gold text-gold" /> {r.rating}
                      </div>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(r.id); }}
                        className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 backdrop-blur transition-transform active:scale-90"
                      >
                        <Heart
                          size={13}
                          className={isFavorite(r.id) ? "fill-primary text-primary" : "text-foreground"}
                        />
                      </button>
                    </div>
                    <div className="p-3.5">
                      <h4 className="font-display text-base">{r.name}</h4>
                      <p className="text-[11px] text-muted-foreground">{r.tag} · {r.price}</p>
                      <div className="mt-3 flex items-center justify-between">
                        {r.next_slot && (
                          <span className="flex items-center gap-1 text-[11px] text-gold">
                            <Clock size={11} /> Hoje {r.next_slot}
                          </span>
                        )}
                        <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-semibold text-primary">
                          Reservar
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Nearby list */}
      <section className="mt-8 px-5">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="font-display text-xl font-medium">Perto de você</h3>
            <p className="text-xs text-muted-foreground">Em até 15 minutos a pé</p>
          </div>
        </div>

        <div className="mt-4">
          {isLoading ? (
            <NearbySkeleton />
          ) : nearbyList.length === 0 ? (
            <EmptyState category={activeCategory} />
          ) : (
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="flex flex-col gap-3"
            >
              {nearbyList.map((r) => (
                <motion.article
                  key={r.id}
                  variants={item}
                  whileTap={{ scale: 0.98 }}
                  className="flex gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card p-2"
                >
                  <Link to="/restaurante/$id" params={{ id: r.id }} className="contents">
                    <img src={r.image_url} alt={r.name} className="h-[88px] w-[88px] rounded-xl object-cover" loading="lazy" />
                    <div className="flex flex-1 flex-col justify-between py-1 pr-2">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-display text-base leading-tight">{r.name}</h4>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-[11px]">
                              <Star size={10} className="fill-gold text-gold" /> {r.rating}
                            </span>
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(r.id); }}
                              className="transition-transform active:scale-90"
                            >
                              <Heart
                                size={14}
                                className={isFavorite(r.id) ? "fill-primary text-primary" : "text-muted-foreground"}
                              />
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{r.tag} · {r.price}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        {r.distance && (
                          <span className="text-[11px] text-muted-foreground">🚶 {r.distance}</span>
                        )}
                        <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                          Ver mesas
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Promo strip */}
      <section className="mt-8 px-5 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-primary/15 via-surface to-surface p-5"
        >
          <div className="shimmer pointer-events-none absolute inset-0" />
          <p className="text-[10px] uppercase tracking-[0.25em] text-gold">Reservê Club</p>
          <h4 className="font-display mt-1 text-xl">Acesso a chefs convidados</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Jantares fechados, harmonizações e mesas exclusivas todo mês.
          </p>
          <button className="mt-3 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background">
            Conhecer →
          </button>
        </motion.div>
      </section>

      {/* Drawers */}
      <NotificationsDrawer
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
        onUnreadChange={setUnreadCount}
      />
      <LocationSheet
        open={showLocation}
        onClose={() => setShowLocation(false)}
        onConfirm={handleLocationConfirm}
      />
    </MobileShell>
  );
}
