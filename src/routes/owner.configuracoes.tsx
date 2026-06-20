import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, MapPin, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/hooks/useAuth";

export const Route = createFileRoute("/owner/configuracoes")({
  component: OwnerConfiguracoes,
});

const PRICE_RANGES = ["R$", "R$R$", "R$R$R$", "R$R$R$R$"];

const CUISINES = [
  "Japonesa", "Italiana", "Brasileira", "Francesa", "Americana",
  "Mediterrânea", "Mexicana", "Árabe", "Indiana", "Contemporânea",
  "Frutos do Mar", "Churrasco", "Pizzaria", "Sushi", "Vegana",
];

type Form = {
  name: string;
  description: string;
  cuisine: string;
  price_range: string;
  opening_time: string;
  closing_time: string;
  cep: string;
  address: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
};

const EMPTY: Form = {
  name: "", description: "", cuisine: "", price_range: "R$R$",
  opening_time: "", closing_time: "", cep: "", address: "",
  location: "", latitude: null, longitude: null,
};

function OwnerConfiguracoes() {
  const { restaurantId } = useAuth();
  const qc = useQueryClient();

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ["owner", "restaurant-full", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data } = await supabase!
        .from("restaurants")
        .select("name, description, cuisine, price_range, opening_time, closing_time, address, location, latitude, longitude")
        .eq("id", restaurantId!)
        .single();
      return data;
    },
  });

  const [form, setForm] = useState<Form>(EMPTY);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepOk, setCepOk] = useState(false);

  useEffect(() => {
    if (!restaurant) return;
    setForm({
      name: restaurant.name ?? "",
      description: restaurant.description ?? "",
      cuisine: restaurant.cuisine ?? "",
      price_range: restaurant.price_range ?? "R$R$",
      opening_time: restaurant.opening_time ?? "",
      closing_time: restaurant.closing_time ?? "",
      cep: "",
      address: restaurant.address ?? "",
      location: restaurant.location ?? "",
      latitude: restaurant.latitude ?? null,
      longitude: restaurant.longitude ?? null,
    });
  }, [restaurant]);

  const field =
    (key: keyof Form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const lookupCep = async (raw: string) => {
    const masked = raw.replace(/\D/g, "").slice(0, 8);
    const display = masked.length > 5 ? `${masked.slice(0, 5)}-${masked.slice(5)}` : masked;
    setForm((prev) => ({ ...prev, cep: display }));
    if (masked.length !== 8) { setCepOk(false); return; }

    setCepLoading(true);
    setCepOk(false);
    try {
      // 1. ViaCEP → endereço
      const r1 = await fetch(`https://viacep.com.br/ws/${masked}/json/`);
      const d1 = await r1.json();
      if (d1.erro) { toast.error("CEP não encontrado"); return; }

      const street = d1.logradouro
        ? `${d1.logradouro}, ${d1.bairro}`
        : d1.bairro;
      const fullAddress = `${street}, ${d1.localidade} - ${d1.uf}`;
      const locationStr = `${d1.localidade}, ${d1.uf}`;

      // 2. Nominatim → lat/lng
      const query = encodeURIComponent(
        `${d1.logradouro || ""} ${d1.bairro}, ${d1.localidade}, ${d1.uf}, Brasil`.trim()
      );
      const r2 = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=br`,
        { headers: { "Accept-Language": "pt-BR", "User-Agent": "Reservê/1.0" } }
      );
      const d2 = await r2.json();
      const geo = (d2 as any[])[0] ?? null;

      setForm((prev) => ({
        ...prev,
        address: fullAddress,
        location: locationStr,
        latitude: geo ? parseFloat(geo.lat) : null,
        longitude: geo ? parseFloat(geo.lon) : null,
      }));
      setCepOk(true);
    } catch {
      toast.error("Erro ao buscar CEP. Tente novamente.");
    } finally {
      setCepLoading(false);
    }
  };

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase!
        .from("restaurants")
        .update({
          name: form.name,
          description: form.description,
          cuisine: form.cuisine,
          price_range: form.price_range,
          opening_time: form.opening_time,
          closing_time: form.closing_time,
          address: form.address,
          location: form.location,
          latitude: form.latitude,
          longitude: form.longitude,
        })
        .eq("id", restaurantId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["owner"] });
      qc.invalidateQueries({ queryKey: ["restaurants"] });
      qc.invalidateQueries({ queryKey: ["restaurant"] });
      toast.success("Configurações salvas!");
    },
    onError: () => toast.error("Erro ao salvar configurações"),
  });

  const inp = "w-full rounded-xl border border-border/60 bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary/60 transition-colors";
  const lbl = "block text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-medium">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Informações do seu restaurante</p>
      </div>

      <div className="space-y-6">
        {/* Informações básicas */}
        <section className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Informações básicas</p>

          <div>
            <label className={lbl}>Nome do restaurante</label>
            <input value={form.name} onChange={field("name")} className={inp} placeholder="Nome do restaurante" />
          </div>

          <div>
            <label className={lbl}>Descrição</label>
            <textarea
              value={form.description}
              onChange={field("description")}
              rows={3}
              className={inp + " resize-none"}
              placeholder="Breve descrição do seu restaurante..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Culinária</label>
              <select value={form.cuisine} onChange={field("cuisine")} className={inp}>
                <option value="">Selecione...</option>
                {CUISINES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Faixa de preço</label>
              <select value={form.price_range} onChange={field("price_range")} className={inp}>
                {PRICE_RANGES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Horário de abertura</label>
              <input type="time" value={form.opening_time} onChange={field("opening_time")} className={inp} />
            </div>
            <div>
              <label className={lbl}>Horário de fechamento</label>
              <input type="time" value={form.closing_time} onChange={field("closing_time")} className={inp} />
            </div>
          </div>
        </section>

        {/* Localização */}
        <section className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Localização</p>

          <div>
            <label className={lbl}>CEP</label>
            <div className="relative">
              <input
                value={form.cep}
                onChange={(e) => lookupCep(e.target.value)}
                className={inp + " pr-9"}
                placeholder="00000-000"
                maxLength={9}
                inputMode="numeric"
              />
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                {cepLoading && <Loader2 size={15} className="animate-spin text-muted-foreground" />}
                {!cepLoading && cepOk && <CheckCircle2 size={15} className="text-emerald-400" />}
              </div>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Preencha o CEP para detectar o endereço e as coordenadas automaticamente.
            </p>
          </div>

          <div>
            <label className={lbl}>Endereço</label>
            <input
              value={form.address}
              onChange={field("address")}
              className={inp}
              placeholder="Rua, bairro, cidade — preenchido pelo CEP"
            />
          </div>

          {form.latitude && form.longitude && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2.5"
            >
              <MapPin size={13} className="text-emerald-400 shrink-0" />
              <p className="text-[11px] text-emerald-400">
                Coordenadas: {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
              </p>
            </motion.div>
          )}
        </section>

        {/* Salvar */}
        <div className="flex justify-end">
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending || !form.name}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 transition-opacity"
          >
            {save.isPending && <Loader2 size={14} className="animate-spin" />}
            Salvar configurações
          </button>
        </div>
      </div>
    </div>
  );
}
