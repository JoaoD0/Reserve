import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Clock, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { MobileShell } from "@/components/MobileShell";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/clube")({
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

const TYPE_COLORS: Record<string, string> = {
  chef_table: "bg-amber-500/15 text-amber-400",
  private_dinner: "bg-rose-500/15 text-rose-400",
  harmonization: "bg-purple-500/15 text-purple-400",
  tasting_menu: "bg-emerald-500/15 text-emerald-400",
  blind_dinner: "bg-blue-500/15 text-blue-400",
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
      {/* Header */}
      <header className="relative overflow-hidden px-5 pt-6 pb-8">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        <div className="shimmer pointer-events-none absolute inset-0 opacity-40" />
        <button
          onClick={() => navigate({ to: "/" })}
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-surface/60 mb-5"
        >
          <ArrowLeft size={16} />
        </button>
        <p className="relative text-[10px] uppercase tracking-[0.25em] text-gold font-medium">Reservê Club</p>
        <h1 className="relative font-display text-2xl mt-1">Experiências exclusivas</h1>
        <p className="relative text-xs text-muted-foreground mt-1">
          Mesas especiais, jantares privados e momentos únicos nos melhores restaurantes.
        </p>
      </header>

      <div className="px-5 pb-24 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-52 rounded-2xl bg-surface animate-pulse" />
            ))}
          </div>
        ) : experiences.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card px-6 py-12 text-center">
            <p className="text-2xl mb-2">✦</p>
            <p className="font-display text-base">Em breve</p>
            <p className="text-xs text-muted-foreground mt-1">Novas experiências sendo preparadas.</p>
          </div>
        ) : (
          (experiences as any[]).map((exp, i) => {
            const restaurant = exp.restaurants as any;
            return (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Link to="/clube/$id" params={{ id: exp.id }} className="block">
                  <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
                    {/* Image */}
                    {(exp.image_url || restaurant?.image_url) && (
                      <div className="relative h-44 overflow-hidden">
                        <img
                          src={exp.image_url || restaurant?.image_url}
                          alt={exp.title}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <span className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-semibold ${TYPE_COLORS[exp.type] ?? "bg-surface text-muted-foreground"}`}>
                          {TYPE_LABELS[exp.type] ?? exp.type}
                        </span>
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="font-display text-white text-lg leading-tight">{exp.title}</p>
                          <p className="text-xs text-white/70 mt-0.5">{restaurant?.name}</p>
                        </div>
                      </div>
                    )}

                    {/* Info */}
                    <div className="p-4">
                      {!exp.image_url && !restaurant?.image_url && (
                        <>
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold mb-2 ${TYPE_COLORS[exp.type] ?? "bg-surface text-muted-foreground"}`}>
                            {TYPE_LABELS[exp.type] ?? exp.type}
                          </span>
                          <p className="font-display text-base">{exp.title}</p>
                          <p className="text-xs text-muted-foreground">{restaurant?.name}</p>
                        </>
                      )}
                      <div className="flex items-center gap-4 mt-3">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock size={11} />
                          {new Date(exp.event_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} · {exp.event_time}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users size={11} />
                          {exp.available_spots} vaga{exp.available_spots !== 1 ? "s" : ""}
                        </span>
                        <span className="ml-auto font-display text-base text-primary">
                          R$ {Number(exp.price_per_person).toFixed(0)}<span className="text-xs text-muted-foreground font-sans">/pessoa</span>
                        </span>
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
