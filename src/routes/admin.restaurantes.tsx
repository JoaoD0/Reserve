import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, X, Pencil, Star, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/restaurantes")({
  component: AdminRestaurantes,
});

type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  price_range: string;
  rating: number;
  image_url: string;
  address: string;
  location: string;
  description: string;
  opening_time: string;
  closing_time: string;
  latitude: number;
  longitude: number;
  is_featured: boolean;
};

const EMPTY_FORM: Omit<Restaurant, "id"> = {
  name: "", cuisine: "", price_range: "$$", rating: 4.5,
  image_url: "", address: "", location: "", description: "",
  opening_time: "12:00", closing_time: "23:00",
  latitude: 0, longitude: 0, is_featured: false,
};

function AdminRestaurantes() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Restaurant | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [cep, setCep] = useState("");
  const [geocoding, setGeocoding] = useState(false);

  async function lookupCep(rawCep: string) {
    const digits = rawCep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setGeocoding(true);
    try {
      const viaRes = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const via = await viaRes.json();
      if (via.erro) { toast.error("CEP não encontrado."); return; }

      setForm((f) => ({
        ...f,
        address: via.logradouro ? `${via.logradouro}, ${via.bairro}` : f.address,
        location: via.bairro ? `${via.bairro}, ${via.localidade}` : via.localidade,
      }));

      const query = `${via.logradouro ?? ""}, ${via.localidade}, ${via.uf}, Brasil`;
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { "User-Agent": "Reserve-App/1.0" } }
      );
      const nom = await nomRes.json();
      if (nom.length > 0) {
        setForm((f) => ({ ...f, latitude: parseFloat(nom[0].lat), longitude: parseFloat(nom[0].lon) }));
        toast.success("Localização encontrada!");
      } else {
        toast.warning("CEP encontrado, mas não foi possível obter coordenadas.");
      }
    } catch {
      toast.error("Erro ao buscar CEP.");
    } finally {
      setGeocoding(false);
    }
  }

  const { data: restaurants = [], isLoading } = useQuery<Restaurant[]>({
    queryKey: ["admin", "restaurants"],
    queryFn: async () => {
      const { data } = await supabase!.from("restaurants").select("*").order("name");
      return (data ?? []) as Restaurant[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        await supabase!.from("restaurants").update(form).eq("id", editing.id);
      } else {
        await supabase!.from("restaurants").insert(form);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "restaurants"] });
      qc.invalidateQueries({ queryKey: ["restaurants"] });
      toast.success(editing ? "Restaurante atualizado!" : "Restaurante criado!");
      closeModal();
    },
    onError: () => toast.error("Erro ao salvar restaurante."),
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, is_featured }: { id: string; is_featured: boolean }) => {
      await supabase!.from("restaurants").update({ is_featured: !is_featured }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "restaurants"] }),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setCep("");
    setModalOpen(true);
  }

  function openEdit(r: Restaurant) {
    setEditing(r);
    setForm({ name: r.name, cuisine: r.cuisine, price_range: r.price_range, rating: r.rating, image_url: r.image_url, address: r.address, location: r.location, description: r.description, opening_time: r.opening_time, closing_time: r.closing_time, latitude: r.latitude, longitude: r.longitude, is_featured: r.is_featured });
    setCep("");
    setModalOpen(true);
  }

  function closeModal() { setModalOpen(false); setEditing(null); }

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const val = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.type === "number" ? Number(e.target.value) : e.target.value;
      setForm((f) => ({ ...f, [key]: val }));
    };
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Restaurantes</h1>
          <p className="text-sm text-muted-foreground mt-1">{restaurants.length} cadastrados</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
          <Plus size={16} /> Adicionar
        </button>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40">
              {["Nome", "Culinária", "Preço", "Avaliação", "Destaque", ""].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Carregando…</td></tr>
            ) : restaurants.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Nenhum restaurante ainda</td></tr>
            ) : (
              restaurants.map((r) => (
                <tr key={r.id} className="border-b border-border/40 last:border-0 hover:bg-surface/40 transition-colors">
                  <td className="px-6 py-3.5 font-medium">{r.name}</td>
                  <td className="px-6 py-3.5 text-muted-foreground">{r.cuisine}</td>
                  <td className="px-6 py-3.5 text-muted-foreground">{r.price_range}</td>
                  <td className="px-6 py-3.5 text-muted-foreground">{r.rating}</td>
                  <td className="px-6 py-3.5">
                    <button onClick={() => toggleFeatured.mutate({ id: r.id, is_featured: r.is_featured })}>
                      <Star size={16} className={r.is_featured ? "fill-gold text-gold" : "text-muted-foreground"} />
                    </button>
                  </td>
                  <td className="px-6 py-3.5">
                    <button onClick={() => openEdit(r)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil size={13} /> Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4" onClick={closeModal}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border/60 bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg">{editing ? "Editar restaurante" : "Novo restaurante"}</h2>
              <button onClick={closeModal}><X size={18} className="text-muted-foreground" /></button>
            </div>

            <div className="space-y-3">
              {([
                ["Nome", "name", "text"],
                ["Culinária", "cuisine", "text"],
                ["URL da imagem", "image_url", "text"],
                ["Horário de abertura", "opening_time", "time"],
                ["Horário de fechamento", "closing_time", "time"],
                ["Avaliação (ex: 4.8)", "rating", "number"],
              ] as [string, keyof typeof form, string][]).map(([label, key, type]) => (
                <div key={key}>
                  <label className="block text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-1">{label}</label>
                  <input
                    type={type}
                    step={type === "number" ? "any" : undefined}
                    value={String(form[key])}
                    onChange={field(key)}
                    className="w-full rounded-xl border border-border/60 bg-surface px-3.5 py-2.5 text-sm focus:border-primary/60 focus:outline-none"
                  />
                </div>
              ))}

              {/* CEP com geocoding automático */}
              <div>
                <label className="block text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-1">CEP</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cep}
                    maxLength={9}
                    placeholder="00000-000"
                    onChange={(e) => setCep(e.target.value)}
                    onBlur={(e) => lookupCep(e.target.value)}
                    className="w-full rounded-xl border border-border/60 bg-surface px-3.5 py-2.5 pr-10 text-sm focus:border-primary/60 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {geocoding ? <Loader2 size={15} className="animate-spin" /> : <MapPin size={15} />}
                  </span>
                </div>
                {form.latitude !== 0 && (
                  <p className="mt-1 text-[11px] text-emerald-400">
                    Coordenadas encontradas: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-1">Endereço</label>
                <input type="text" value={form.address} onChange={field("address")} className="w-full rounded-xl border border-border/60 bg-surface px-3.5 py-2.5 text-sm focus:border-primary/60 focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-1">Bairro / Localização</label>
                <input type="text" value={form.location} onChange={field("location")} className="w-full rounded-xl border border-border/60 bg-surface px-3.5 py-2.5 text-sm focus:border-primary/60 focus:outline-none" />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-1">Faixa de preço</label>
                <select value={form.price_range} onChange={field("price_range")} className="w-full rounded-xl border border-border/60 bg-surface px-3.5 py-2.5 text-sm focus:border-primary/60 focus:outline-none">
                  {["$", "$$", "$$$", "$$$$"].map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-1">Descrição</label>
                <textarea value={form.description} onChange={field("description")} rows={3} className="w-full rounded-xl border border-border/60 bg-surface px-3.5 py-2.5 text-sm focus:border-primary/60 focus:outline-none resize-none" />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={field("is_featured")} className="sr-only peer" />
                <div className="relative h-5 w-9 rounded-full bg-surface border border-border/60 peer-checked:bg-primary transition-colors after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
                <span className="text-sm">Restaurante em destaque</span>
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={closeModal} className="flex-1 rounded-xl border border-border/60 py-2.5 text-sm text-muted-foreground">Cancelar</button>
              <button onClick={() => save.mutate()} disabled={save.isPending} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                {save.isPending ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
