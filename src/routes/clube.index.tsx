import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Clock, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { MobileShell } from "@/components/MobileShell";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/clube/")({
  component: ClubePage,
  head: () => ({ meta: [{ title: "Reservê Club" }] }),
});

const TYPE_LABELS: Record<string, string> = {
  chef_table: "Mesa do Chef",
  private_dinner: "Jantar Privado",
  harmonization: "Harmonização",
  tasting_menu: "Menu Degustação",
  blind_dinner: "Mesa às Cegas",
};

const TYPE_IMAGES: Record<string, string> = {
  chef_table:
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=85",
  private_dinner:
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=85",
  harmonization:
    "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=900&q=85",
  tasting_menu:
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&q=85",
  blind_dinner:
    "https://images.unsplash.com/photo-1530469912745-a215c6b256ea?w=900&q=85",
};

const TYPE_ACCENT: Record<string, string> = {
  chef_table: "#D4A853",
  private_dinner: "#C17B7B",
  harmonization: "#9B7EC8",
  tasting_menu: "#6BAF8E",
  blind_dinner: "#7B9FC1",
};

function ClubePage() {
  const navigate = useNavigate();

  const { data: experiences = [], isLoading } = useQuery({
    queryKey: ["club", "experiences"],
    queryFn: async () => {
      const { data } = await supabase!
        .from("experiences")
        .select("*, restaurants(name, image_url, location)")
        .eq("is_active", true)
        .gte("event_date", new Date().toISOString().slice(0, 10))
        .order("event_date", { ascending: true });
      return data ?? [];
    },
  });

  return (
    <MobileShell>
      {/* Hero Header */}
      <header className="relative overflow-hidden px-5 pt-6 pb-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,168,83,0.12)_0%,_transparent_70%)] pointer-events-none" />
        <div className="shimmer pointer-events-none absolute inset-0 opacity-30" />

        <button
          onClick={() => window.history.back()}
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-surface/60 mb-6"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="relative flex items-center gap-2 mb-3">
          <Sparkles size={12} className="text-gold" strokeWidth={1.5} />
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium">Reservê Club</p>
        </div>
        <h1 className="relative font-display text-3xl leading-tight tracking-tight">
          Experiências<br />
          <span className="italic text-gold/90">exclusivas</span>
        </h1>
        <p className="relative text-xs text-muted-foreground mt-2 leading-relaxed">
          Vivências gastronômicas únicas, curadas para quem busca o extraordinário.
        </p>

        <div className="relative mt-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          <span className="text-gold/50 text-[10px]">✦</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        </div>
      </header>

      <div className="px-5 pb-28 space-y-5">
        {isLoading ? (
          <div className="space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-surface animate-pulse" />
            ))}
          </div>
        ) : experiences.length === 0 ? (
          <div className="rounded-2xl border border-gold/20 bg-card px-6 py-14 text-center">
            <p className="text-3xl mb-3 text-gold/60">✦</p>
            <p className="font-display text-lg tracking-tight">Em breve</p>
            <p className="text-xs text-muted-foreground mt-1.5">Novas experiências sendo preparadas.</p>
          </div>
        ) : (
          (experiences as any[]).map((exp, i) => {
            const restaurant = exp.restaurants as any;
            const img = exp.image_url ?? restaurant?.image_url ?? TYPE_IMAGES[exp.type];
            const accent = TYPE_ACCENT[exp.type] ?? "#D4A853";
            const label = TYPE_LABELS[exp.type] ?? exp.type;

            return (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <Link to="/clube/$id" params={{ id: exp.id }} className="block group">
                  <div className="overflow-hidden rounded-2xl border border-white/8 bg-card shadow-xl shadow-black/20">
                    <div className="relative h-60 overflow-hidden">
                      <img
                        src={img}
                        alt={exp.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />

                      <span
                        className="absolute top-3.5 left-3.5 rounded-full px-3 py-1 text-[10px] font-semibold tracking-wide backdrop-blur-sm border"
                        style={{
                          background: `${accent}22`,
                          borderColor: `${accent}55`,
                          color: accent,
                        }}
                      >
                        {label}
                      </span>

                      <span className="absolute top-3.5 right-3.5 rounded-full px-2.5 py-1 text-[10px] text-white/80 backdrop-blur-sm bg-black/40 border border-white/10 flex items-center gap-1">
                        <Users size={9} />
                        {exp.available_spots} vaga{exp.available_spots !== 1 ? "s" : ""}
                      </span>

                      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8">
                        <p className="text-[10px] text-white/55 mb-1 tracking-wide">{restaurant?.name}</p>
                        <p className="font-display text-white text-xl leading-tight tracking-tight drop-shadow-lg">
                          {exp.title}
                        </p>
                        <div className="flex items-center justify-between mt-2.5">
                          <span className="flex items-center gap-1.5 text-[11px] text-white/60">
                            <Clock size={10} />
                            {new Date(exp.event_date + "T12:00:00").toLocaleDateString("pt-BR", {
                              day: "numeric",
                              month: "short",
                            })}
                            {" · "}
                            {exp.event_time}
                          </span>
                          <span
                            className="font-display text-lg leading-none"
                            style={{ color: accent }}
                          >
                            R$ {Number(exp.price_per_person).toFixed(0)}
                            <span className="text-[10px] text-white/40 font-sans ml-0.5">/pessoa</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })
        )}
      </div>
    </MobileShell>
  );
}
