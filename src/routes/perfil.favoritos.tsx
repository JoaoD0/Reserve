import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Star } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/lib/hooks/useAuth";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { useRestaurants } from "@/lib/hooks/useRestaurants";

export const Route = createFileRoute("/perfil/favoritos")({
  component: PerfilFavoritos,
  head: () => ({ meta: [{ title: "Favoritos — Reservê" }] }),
});

function PerfilFavoritos() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { favorites: favoriteIds, isLoading: favsLoading } = useFavorites(user);
  const { data: allRestaurants = [], isLoading: restsLoading } = useRestaurants();
  const isLoading = authLoading || favsLoading || restsLoading;

  const favorites = allRestaurants.filter((r) => favoriteIds.includes(r.id));

  return (
    <MobileShell>
      <header className="flex items-center gap-3 px-5 pt-6">
        <button
          onClick={() => navigate({ to: "/perfil" })}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-surface/60"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="font-display text-lg">Restaurantes favoritos</h1>
      </header>

      <div className="px-5 pt-6 pb-24">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[100px] animate-pulse rounded-2xl bg-surface" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <span className="text-5xl mb-4">🍽️</span>
            <h2 className="font-display text-xl">Nenhum favorito ainda</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs">
              Toque no coração nos cards de restaurante para salvar seus favoritos.
            </p>
            <Link
              to="/"
              className="mt-8 h-12 px-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center"
            >
              Descobrir restaurantes
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.07 } } }}
            className="flex flex-col gap-3"
          >
            {favorites.map((r) => (
              <motion.article
                key={r.id}
                variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } } }}
                className="flex gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card p-2"
              >
                <img
                  src={r.image_url}
                  alt={r.name}
                  className="h-[88px] w-[88px] shrink-0 rounded-xl object-cover"
                  loading="lazy"
                />
                <div className="flex flex-1 flex-col justify-between py-1 pr-1">
                  <div>
                    <h4 className="font-display text-base leading-tight">{r.name}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {r.cuisine} · {r.price}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={10} className="fill-gold text-gold" />
                      <span className="text-[11px] text-muted-foreground">{r.rating}</span>
                    </div>
                  </div>
                  <Link
                    to="/restaurante/$id"
                    params={{ id: r.id }}
                    className="self-start rounded-full bg-primary/15 px-3 py-1.5 text-[11px] font-semibold text-primary"
                  >
                    Ver restaurante
                  </Link>
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}
      </div>
    </MobileShell>
  );
}
