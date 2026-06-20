import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Sparkles, Calendar, Users, DollarSign, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/hooks/useAuth";

export const Route = createFileRoute("/owner/experiencias")({
  component: OwnerExperiencias,
});

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const TYPES: { value: string; label: string; color: string; bg: string }[] = [
  { value: "chef_table",      label: "Mesa do Chef",      color: "text-amber-400",   bg: "bg-amber-500/10" },
  { value: "private_dinner",  label: "Jantar Privado",    color: "text-rose-400",    bg: "bg-rose-500/10" },
  { value: "harmonization",   label: "Harmonização",      color: "text-violet-400",  bg: "bg-violet-500/10" },
  { value: "tasting_menu",    label: "Menu Degustação",   color: "text-sky-400",     bg: "bg-sky-500/10" },
  { value: "blind_dinner",    label: "Mesa às Cegas",     color: "text-emerald-400", bg: "bg-emerald-500/10" },
];

const EMPTY = {
  title: "", description: "", type: "chef_table",
  price_per_person: "", max_spots: "4",
  event_date: "", event_time: "", image_url: "",
};

function typeInfo(value: string) {
  return TYPES.find((t) => t.value === value) ?? TYPES[0];
}

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
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const canSave = form.title && form.price_per_person && form.event_date && form.event_time;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Experiências</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie suas experiências exclusivas no Club</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-opacity hover:opacity-90"
        >
          <Plus size={15} /> Nova experiência
        </button>
      </div>

      {/* Create form modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="fixed inset-x-0 top-1/2 z-50 mx-auto w-full max-w-lg -translate-y-1/2 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
                <h2 className="font-display text-base font-semibold">Nova experiência</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <Field label="Título">
                  <input value={form.title} onChange={f("title")} placeholder="Ex: Mesa do Chef — Outono 2026" className={inputCls} />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tipo">
                    <select value={form.type} onChange={f("type")} className={inputCls}>
                      {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Vagas">
                    <input value={form.max_spots} onChange={f("max_spots")} type="number" min="1" className={inputCls} />
                  </Field>
                  <Field label="Data">
                    <input value={form.event_date} onChange={f("event_date")} type="date" className={inputCls} />
                  </Field>
                  <Field label="Horário">
                    <input value={form.event_time} onChange={f("event_time")} type="time" className={inputCls} />
                  </Field>
                  <Field label="Preço por pessoa (R$)" className="col-span-2">
                    <input value={form.price_per_person} onChange={f("price_per_person")} type="number" placeholder="350" className={inputCls} />
                  </Field>
                  <Field label="Imagem (URL)" className="col-span-2">
                    <input value={form.image_url} onChange={f("image_url")} placeholder="https://..." className={inputCls} />
                  </Field>
                </div>

                <Field label="Descrição">
                  <textarea value={form.description} onChange={f("description")} rows={3} placeholder="Descreva a experiência…" className={`${inputCls} resize-none`} />
                </Field>
              </div>

              <div className="flex gap-2 border-t border-border/60 px-6 py-4">
                <button
                  onClick={() => create.mutate()}
                  disabled={create.isPending || !canSave}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 transition-opacity hover:opacity-90"
                >
                  {create.isPending ? "Salvando…" : "Salvar experiência"}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-border/60 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground">Carregando…</div>
      ) : experiences.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface mb-4">
            <Sparkles size={24} className="text-muted-foreground" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium">Nenhuma experiência ainda</p>
          <p className="text-xs text-muted-foreground mt-1 mb-5">Crie sua primeira experiência exclusiva para o Club</p>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            <Plus size={14} /> Criar experiência
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {(experiences as any[]).map((exp, i) => {
            const type = typeInfo(exp.type);
            const date = new Date(exp.event_date + "T12:00:00").toLocaleDateString("pt-BR", {
              day: "numeric", month: "short", year: "numeric",
            });
            const spotsLeft = exp.available_spots;
            const spotsTotal = exp.max_spots;
            const pct = Math.round((spotsLeft / spotsTotal) * 100);

            return (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                className="overflow-hidden rounded-2xl border border-border/60 bg-card"
              >
                {/* Card header */}
                <div className={`px-5 py-4 ${type.bg} border-b border-border/40`}>
                  <div className="flex items-start justify-between">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${type.bg} ${type.color} border border-current/20`}>
                      <Sparkles size={10} /> {type.label}
                    </span>
                    <button
                      onClick={() => {
                        if (!window.confirm(`Excluir "${exp.title}"?\nTodos os bookings vinculados também serão removidos.`)) return;
                        remove.mutate(exp.id);
                      }}
                      disabled={remove.isPending}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-500/15 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <h3 className="font-display text-base font-semibold mt-3 leading-snug">{exp.title}</h3>
                  {exp.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{exp.description}</p>
                  )}
                </div>

                {/* Card body */}
                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={12} className={type.color} />
                      {date} · {exp.event_time}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <DollarSign size={12} className={type.color} />
                      R$ {Number(exp.price_per_person).toFixed(0)}/pessoa
                    </span>
                  </div>

                  {/* Spots progress */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users size={11} /> Vagas
                      </span>
                      <span className={`text-xs font-semibold ${spotsLeft === 0 ? "text-red-400" : type.color}`}>
                        {spotsLeft}/{spotsTotal} disponíveis
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/40">
                      <div
                        className={`h-full rounded-full transition-all ${spotsLeft === 0 ? "bg-red-400" : "bg-primary"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all";

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
