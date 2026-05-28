import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/hooks/useAuth";

export const Route = createFileRoute("/owner/experiencias")({
  component: OwnerExperiencias,
});

const TYPES = [
  { value: "chef_table", label: "Mesa do Chef" },
  { value: "private_dinner", label: "Jantar Privado" },
  { value: "harmonization", label: "Harmonização" },
  { value: "tasting_menu", label: "Menu Degustação" },
  { value: "blind_dinner", label: "Mesa às Cegas" },
];

const EMPTY = {
  title: "", description: "", type: "chef_table",
  price_per_person: "", max_spots: "4",
  event_date: "", event_time: "", image_url: "",
};

function OwnerExperiencias() {
  const { restaurantId } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data: experiences = [], isLoading } = useQuery({
    queryKey: ["owner", "experiences", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data } = await supabase!
        .from("experiences")
        .select("*")
        .eq("restaurant_id", restaurantId!)
        .order("event_date", { ascending: true });
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase!.from("experiences").insert({
        restaurant_id: restaurantId,
        title: form.title,
        description: form.description || null,
        type: form.type,
        price_per_person: parseFloat(form.price_per_person),
        max_spots: parseInt(form.max_spots),
        available_spots: parseInt(form.max_spots),
        event_date: form.event_date,
        event_time: form.event_time,
        image_url: form.image_url || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["owner", "experiences"] });
      setForm(EMPTY);
      setShowForm(false);
      toast.success("Experiência criada!");
    },
    onError: () => toast.error("Erro ao criar experiência."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await supabase!.from("experience_bookings").delete().eq("experience_id", id);
      const { error } = await supabase!.from("experiences").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["owner", "experiences"] });
      toast.success("Experiência removida.");
    },
  });

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Experiências</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie suas experiências exclusivas no Club</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          <Plus size={15} /> Nova experiência
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 rounded-2xl border border-border/60 bg-card p-6 space-y-4">
          <h2 className="font-display text-base font-medium">Nova experiência</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Título</label>
              <input value={form.title} onChange={f("title")} placeholder="Ex: Mesa do Chef — Outono 2026" className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
              <select value={form.type} onChange={f("type")} className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-primary">
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Preço por pessoa (R$)</label>
              <input value={form.price_per_person} onChange={f("price_per_person")} type="number" placeholder="350" className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Data</label>
              <input value={form.event_date} onChange={f("event_date")} type="date" className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Horário</label>
              <input value={form.event_time} onChange={f("event_time")} placeholder="20:00" className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Vagas</label>
              <input value={form.max_spots} onChange={f("max_spots")} type="number" className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Imagem (URL)</label>
              <input value={form.image_url} onChange={f("image_url")} placeholder="https://..." className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Descrição</label>
              <textarea value={form.description} onChange={f("description")} rows={3} placeholder="Descreva a experiência..." className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-primary resize-none" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => create.mutate()} disabled={create.isPending || !form.title || !form.price_per_person || !form.event_date} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {create.isPending ? "Salvando…" : "Salvar"}
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-xl border border-border/60 px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Carregando…</div>
      ) : experiences.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card px-6 py-12 text-center text-muted-foreground">
          Nenhuma experiência cadastrada ainda.
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40">
                {["Título", "Tipo", "Data", "Vagas", "Preço/pessoa", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(experiences as any[]).map((exp) => (
                <tr key={exp.id} className="border-b border-border/40 last:border-0">
                  <td className="px-5 py-3.5 font-medium">{exp.title}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{TYPES.find((t) => t.value === exp.type)?.label}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{new Date(exp.event_date + "T12:00:00").toLocaleDateString("pt-BR")} · {exp.event_time}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{exp.available_spots}/{exp.max_spots}</td>
                  <td className="px-5 py-3.5">R$ {Number(exp.price_per_person).toFixed(0)}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => remove.mutate(exp.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
