import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Users, MapPin, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/hooks/useAuth";
import { MobileShell } from "@/components/MobileShell";

export const Route = createFileRoute("/clube/$id")({
  component: ClubeExperiencia,
});

const TYPE_LABELS: Record<string, string> = {
  chef_table: "Mesa do Chef",
  private_dinner: "Jantar Privado",
  harmonization: "Harmonização",
  tasting_menu: "Menu Degustação",
  blind_dinner: "Mesa às Cegas",
};

function ClubeExperiencia() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [partySize, setPartySize] = useState(1);
  const [booked, setBooked] = useState(false);
  const [confirmCode, setConfirmCode] = useState("");

  const { data: exp, isLoading } = useQuery({
    queryKey: ["club", "experience", id],
    queryFn: async () => {
      const { data } = await supabase!
        .from("experiences")
        .select("*, restaurants(name, image_url, location, address)")
        .eq("id", id)
        .single();
      return data;
    },
  });

  const book = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Faça login para continuar.");
      if (partySize > (exp?.available_spots ?? 0)) throw new Error("Vagas insuficientes.");

      const code = Math.random().toString(36).slice(2, 8).toUpperCase();

      const { error: bookErr } = await supabase!
        .from("experience_bookings")
        .insert({ user_id: user.id, experience_id: id, party_size: partySize, confirmation_code: code });
      if (bookErr) throw bookErr;

      await supabase!
        .from("experiences")
        .update({ available_spots: (exp?.available_spots ?? 0) - partySize })
        .eq("id", id);

      return code;
    },
    onSuccess: (code) => {
      setConfirmCode(code);
      setBooked(true);
    },
    onError: (err: any) => toast.error(err?.message ?? "Erro ao solicitar experiência."),
  });

  if (isLoading || !exp) {
    return (
      <MobileShell>
        <div className="flex items-center justify-center h-64">
          <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </MobileShell>
    );
  }

  const restaurant = exp.restaurants as any;
  const total = partySize * Number(exp.price_per_person);

  if (booked) {
    return (
      <MobileShell>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center px-8 py-20 text-center"
        >
          <div className="h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center mb-5">
            <CheckCircle size={32} className="text-emerald-400" />
          </div>
          <p className="font-display text-2xl mb-1">Solicitado!</p>
          <p className="text-sm text-muted-foreground mb-6">
            Sua experiência foi solicitada. O restaurante entrará em contato para confirmar.
          </p>
          <div className="w-full rounded-2xl border border-border/60 bg-card p-5 text-left space-y-2 mb-6">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Detalhes</p>
            <p className="font-display text-base">{exp.title}</p>
            <p className="text-sm text-muted-foreground">{restaurant?.name}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
              <span>{new Date(exp.event_date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</span>
              <span>·</span>
              <span>{exp.event_time}</span>
              <span>·</span>
              <span>{partySize} pessoa{partySize !== 1 ? "s" : ""}</span>
            </div>
            <div className="pt-2 border-t border-border/40">
              <p className="text-xs text-muted-foreground">Código de confirmação</p>
              <p className="font-display text-xl tracking-widest mt-0.5">#{confirmCode}</p>
            </div>
          </div>
          <button
            onClick={() => navigate({ to: "/" })}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm"
          >
            Voltar ao início
          </button>
        </motion.div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      {/* Header image */}
      <div className="relative h-56 overflow-hidden">
        {(exp.image_url || restaurant?.image_url) ? (
          <img src={exp.image_url || restaurant?.image_url} alt={exp.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full bg-gradient-to-br from-primary/20 to-surface" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-black/20 to-transparent" />
        <button
          onClick={() => navigate({ to: "/clube" })}
          className="absolute top-5 left-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/30 backdrop-blur-sm"
        >
          <ArrowLeft size={16} className="text-white" />
        </button>
        <div className="absolute bottom-4 left-5 right-5">
          <span className="text-[10px] uppercase tracking-[0.2em] text-gold">{TYPE_LABELS[exp.type] ?? exp.type}</span>
          <h1 className="font-display text-2xl text-white mt-0.5">{exp.title}</h1>
        </div>
      </div>

      <div className="px-5 pt-5 pb-28 space-y-5">
        {/* Restaurant & info */}
        <div className="flex items-center gap-3">
          {restaurant?.image_url && (
            <img src={restaurant.image_url} alt={restaurant.name} className="h-10 w-10 rounded-xl object-cover" />
          )}
          <div>
            <p className="font-medium text-sm">{restaurant?.name}</p>
            {restaurant?.location && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin size={10} /> {restaurant.location}
              </p>
            )}
          </div>
        </div>

        {/* Date & spots */}
        <div className="flex gap-3">
          <div className="flex-1 rounded-2xl border border-border/60 bg-card px-4 py-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Data & Horário</p>
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Clock size={13} className="text-primary" />
              {new Date(exp.event_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} · {exp.event_time}
            </p>
          </div>
          <div className="flex-1 rounded-2xl border border-border/60 bg-card px-4 py-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Vagas</p>
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Users size={13} className="text-primary" />
              {exp.available_spots} disponíveis
            </p>
          </div>
        </div>

        {/* Description */}
        {exp.description && (
          <div className="rounded-2xl border border-border/60 bg-card px-5 py-4">
            <p className="text-sm text-muted-foreground leading-relaxed">{exp.description}</p>
          </div>
        )}

        {/* Party size selector */}
        <div className="rounded-2xl border border-border/60 bg-card px-5 py-4">
          <p className="text-sm font-medium mb-3">Número de pessoas</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPartySize(Math.max(1, partySize - 1))}
              className="h-9 w-9 rounded-full border border-border/60 flex items-center justify-center text-lg font-light hover:bg-surface transition-colors"
            >−</button>
            <span className="font-display text-2xl w-8 text-center">{partySize}</span>
            <button
              onClick={() => setPartySize(Math.min(exp.available_spots, partySize + 1))}
              className="h-9 w-9 rounded-full border border-border/60 flex items-center justify-center text-lg font-light hover:bg-surface transition-colors"
            >+</button>
            <span className="ml-auto text-xs text-muted-foreground">máx. {exp.available_spots}</span>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-5 py-4 bg-background/90 backdrop-blur-sm border-t border-border/40">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">Total estimado</span>
          <span className="font-display text-xl">R$ {total.toFixed(0)}</span>
        </div>
        <button
          onClick={() => book.mutate()}
          disabled={book.isPending || exp.available_spots === 0}
          className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 transition-opacity"
        >
          {book.isPending ? "Solicitando…" : exp.available_spots === 0 ? "Esgotado" : "Solicitar experiência"}
        </button>
      </div>
    </MobileShell>
  );
}
