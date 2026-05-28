import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Users, MapPin, CheckCircle, Minus, Plus } from "lucide-react";
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

const TYPE_IMAGES: Record<string, string> = {
  chef_table: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=85",
  private_dinner: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=85",
  harmonization: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=900&q=85",
  tasting_menu: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&q=85",
  blind_dinner: "https://images.unsplash.com/photo-1530469912745-a215c6b256ea?w=900&q=85",
};

const TYPE_ACCENT: Record<string, string> = {
  chef_table: "#D4A853",
  private_dinner: "#C17B7B",
  harmonization: "#9B7EC8",
  tasting_menu: "#6BAF8E",
  blind_dinner: "#7B9FC1",
};

const TYPE_ABOUT: Record<string, string> = {
  chef_table:
    "Acompanhe o chef ao vivo enquanto prepara cada prato diante de você. Uma experiência íntima e imersiva onde a cozinha se torna palco e cada ingrediente conta uma história.",
  private_dinner:
    "Um salão reservado exclusivamente para você e seus convidados, com menu personalizado e serviço dedicado do início ao fim. A privacidade e o requinte de um jantar feito apenas para vocês.",
  harmonization:
    "Uma jornada sensorial conduzida pelo sommelier, explorando a sinergia perfeita entre vinhos selecionados e pratos elaborados. Cada taça escolhida para elevar o que está no prato.",
  tasting_menu:
    "Uma surpresa curada pelo chef — sequências de pequenos pratos exclusivos, fora do cardápio convencional. Cada etapa revela a identidade e a criatividade da cozinha.",
  blind_dinner:
    "Entregue-se completamente. Sem cardápio, sem expectativas — apenas a confiança no chef e a descoberta a cada prato que chega à mesa. Uma noite de revelações.",
};

const TYPE_HIGHLIGHTS: Record<string, string[]> = {
  chef_table: ["Frente à bancada do chef", "Conversa direta com a cozinha", "Menu exclusivo da noite"],
  private_dinner: ["Salão reservado", "Menu personalizado", "Serviço dedicado"],
  harmonization: ["Conduzida por sommelier", "Vinhos selecionados", "Pratos harmonizados"],
  tasting_menu: ["Fora do cardápio", "Sequência de pequenos pratos", "Surpresa a cada etapa"],
  blind_dinner: ["Sem cardápio revelado", "Confiança total no chef", "Experiência única"],
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
  const heroImg = exp.image_url ?? TYPE_IMAGES[exp.type] ?? restaurant?.image_url;
  const accent = TYPE_ACCENT[exp.type] ?? "#D4A853";
  const about = TYPE_ABOUT[exp.type] ?? exp.description;
  const highlights = TYPE_HIGHLIGHTS[exp.type] ?? [];
  const label = TYPE_LABELS[exp.type] ?? exp.type;

  if (booked) {
    return (
      <MobileShell>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center px-8 py-20 text-center"
        >
          <div className="h-16 w-16 rounded-full flex items-center justify-center mb-5"
            style={{ background: `${accent}22`, border: `1px solid ${accent}44` }}>
            <CheckCircle size={30} style={{ color: accent }} />
          </div>
          <p className="font-display text-2xl mb-1 tracking-tight">Solicitado</p>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            Sua experiência foi solicitada. O restaurante entrará em contato para confirmar.
          </p>

          <div className="w-full rounded-2xl border border-border/60 bg-card p-5 text-left mb-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4">Resumo</p>
            <p className="font-display text-base leading-tight">{exp.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{restaurant?.name}</p>
            <div className="mt-3 pt-3 border-t border-border/40 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Data</span>
                <span>{new Date(exp.event_date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "long" })}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Horário</span>
                <span>{exp.event_time}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Pessoas</span>
                <span>{partySize}</span>
              </div>
              <div className="flex justify-between text-xs font-medium pt-1">
                <span className="text-muted-foreground">Total estimado</span>
                <span>R$ {total.toFixed(0)}</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/40">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Código</p>
              <p className="font-display text-2xl tracking-[0.3em]" style={{ color: accent }}>
                #{confirmCode}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate({ to: "/" })}
            className="w-full h-12 rounded-2xl text-sm font-semibold transition-opacity"
            style={{ background: accent, color: "#000" }}
          >
            Voltar ao início
          </button>
        </motion.div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      {/* Hero image */}
      <div className="relative h-72 overflow-hidden">
        {heroImg ? (
          <img src={heroImg} alt={exp.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full bg-gradient-to-br from-primary/20 to-surface" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/15" />

        <button
          onClick={() => navigate({ to: "/clube" })}
          className="absolute top-5 left-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-sm"
        >
          <ArrowLeft size={16} className="text-white" />
        </button>

        <div className="absolute bottom-5 left-5 right-5">
          <span
            className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide mb-2 border"
            style={{ background: `${accent}22`, borderColor: `${accent}55`, color: accent }}
          >
            {label}
          </span>
          <h1 className="font-display text-2xl text-white leading-tight drop-shadow-lg">{exp.title}</h1>
          <p className="text-xs text-white/55 mt-0.5">{restaurant?.name}</p>
        </div>
      </div>

      <div className="px-5 pt-5 pb-36 space-y-4">
        {/* Date / spots row */}
        <div className="flex gap-3">
          <div className="flex-1 rounded-2xl border border-border/60 bg-card px-4 py-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Data & Horário</p>
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Clock size={13} style={{ color: accent }} />
              {new Date(exp.event_date + "T12:00:00").toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "short",
              })}{" · "}{exp.event_time}
            </p>
          </div>
          <div className="flex-1 rounded-2xl border border-border/60 bg-card px-4 py-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Vagas</p>
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Users size={13} style={{ color: accent }} />
              {exp.available_spots} disponíve{exp.available_spots !== 1 ? "is" : "l"}
            </p>
          </div>
        </div>

        {/* About this experience type */}
        <div className="rounded-2xl border border-border/60 bg-card px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Sobre esta experiência</p>
          <p className="text-sm text-foreground/80 leading-relaxed">{about}</p>
          {highlights.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {highlights.map((h) => (
                <li key={h} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-[10px]" style={{ color: accent }}>✦</span>
                  {h}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Custom description from DB if different */}
        {exp.description && exp.description !== about && (
          <div className="rounded-2xl border border-border/60 bg-card px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Detalhes da noite</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{exp.description}</p>
          </div>
        )}

        {/* Restaurant location */}
        {restaurant?.location && (
          <div className="flex items-center gap-2 px-1">
            <MapPin size={12} className="text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">{restaurant.location}</p>
          </div>
        )}

        {/* Party size selector */}
        <div className="rounded-2xl border border-border/60 bg-card px-5 py-4">
          <p className="text-sm font-medium mb-4">Quantas pessoas?</p>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPartySize(Math.max(1, partySize - 1))}
              className="h-10 w-10 rounded-full border border-border/60 flex items-center justify-center hover:bg-surface transition-colors disabled:opacity-40"
              disabled={partySize <= 1}
            >
              <Minus size={14} />
            </button>
            <div className="text-center">
              <span className="font-display text-3xl">{partySize}</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">pessoa{partySize !== 1 ? "s" : ""}</p>
            </div>
            <button
              onClick={() => setPartySize(Math.min(exp.available_spots, partySize + 1))}
              className="h-10 w-10 rounded-full border border-border/60 flex items-center justify-center hover:bg-surface transition-colors disabled:opacity-40"
              disabled={partySize >= exp.available_spots}
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="mt-4 pt-3 border-t border-border/40 flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              R$ {Number(exp.price_per_person).toFixed(0)}/pessoa × {partySize}
            </span>
            <span className="font-display text-xl" style={{ color: accent }}>
              R$ {total.toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-5 py-5 bg-background/95 backdrop-blur-sm border-t border-border/40">
        <button
          onClick={() => book.mutate()}
          disabled={book.isPending || exp.available_spots === 0}
          className="w-full h-13 rounded-2xl text-sm font-semibold transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: exp.available_spots === 0 ? undefined : accent, color: "#000", height: 48 }}
        >
          {book.isPending
            ? "Solicitando…"
            : exp.available_spots === 0
            ? "Esgotado"
            : `Solicitar · R$ ${total.toFixed(0)}`}
        </button>
      </div>
    </MobileShell>
  );
}
