import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, X, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/proprietarios")({
  component: AdminProprietarios,
});

type Owner = {
  id: string;
  full_name: string | null;
  restaurant_id: string | null;
  updated_at: string;
  restaurant?: { name: string } | null;
};

type Restaurant = { id: string; name: string };

function AdminProprietarios() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [successModal, setSuccessModal] = useState<{ name: string; email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", restaurantId: "" });

  const { data: owners = [], isLoading } = useQuery<Owner[]>({
    queryKey: ["admin", "owners"],
    queryFn: async () => {
      const { data } = await supabase!
        .from("profiles")
        .select("id, full_name, restaurant_id, updated_at")
        .eq("role", "owner")
        .order("full_name");
      return (data ?? []) as Owner[];
    },
  });

  const { data: restaurants = [] } = useQuery<Restaurant[]>({
    queryKey: ["admin", "restaurantsSelect"],
    queryFn: async () => {
      const { data } = await supabase!.from("restaurants").select("id, name").order("name");
      return (data ?? []) as Restaurant[];
    },
  });

  // Restaurant name lookup map
  const restaurantMap = Object.fromEntries(restaurants.map((r) => [r.id, r.name]));

  const create = useMutation({
    mutationFn: async () => {
      const { fullName, email, restaurantId } = form;
      if (!fullName || !email || !restaurantId) throw new Error("Preencha todos os campos.");

      const { data: { session } } = await supabase!.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-owner`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ fullName, email, restaurantId }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao criar proprietário.");
      return { ...json, name: fullName, email } as { tempPassword: string; name: string; email: string };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin", "owners"] });
      setModalOpen(false);
      setForm({ fullName: "", email: "", restaurantId: "" });
      setSuccessModal({ name: data.name, email: data.email, password: data.tempPassword });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function copyPassword() {
    if (!successModal) return;
    navigator.clipboard.writeText(successModal.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Proprietários</h1>
          <p className="text-sm text-muted-foreground mt-1">{owners.length} cadastrados</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
          <Plus size={16} /> Adicionar
        </button>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40">
              {["Nome", "Restaurante vinculado", "Atualizado em"].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">Carregando…</td></tr>
            ) : owners.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">Nenhum proprietário ainda</td></tr>
            ) : (
              owners.map((o) => (
                <tr key={o.id} className="border-b border-border/40 last:border-0 hover:bg-surface/40 transition-colors">
                  <td className="px-6 py-3.5 font-medium">{o.full_name ?? "—"}</td>
                  <td className="px-6 py-3.5 text-muted-foreground">
                    {o.restaurant_id ? (restaurantMap[o.restaurant_id] ?? o.restaurant_id.slice(0, 8) + "…") : "—"}
                  </td>
                  <td className="px-6 py-3.5 text-muted-foreground text-xs">
                    {new Date(o.updated_at).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg">Novo proprietário</h2>
              <button onClick={() => setModalOpen(false)}><X size={18} className="text-muted-foreground" /></button>
            </div>

            <div className="space-y-3">
              {[
                { label: "Nome completo", key: "fullName", type: "text" },
                { label: "E-mail", key: "email", type: "email" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full rounded-xl border border-border/60 bg-surface px-3.5 py-2.5 text-sm focus:border-primary/60 focus:outline-none"
                  />
                </div>
              ))}

              <div>
                <label className="block text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-1">Restaurante vinculado</label>
                <select
                  value={form.restaurantId}
                  onChange={(e) => setForm((f) => ({ ...f, restaurantId: e.target.value }))}
                  className="w-full rounded-xl border border-border/60 bg-surface px-3.5 py-2.5 text-sm focus:border-primary/60 focus:outline-none"
                >
                  <option value="">Selecione um restaurante…</option>
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <p className="mt-4 text-[11px] text-muted-foreground">
              Uma senha temporária será gerada automaticamente. Anote e envie ao proprietário.
            </p>

            <div className="mt-5 flex gap-3">
              <button onClick={() => setModalOpen(false)} className="flex-1 rounded-xl border border-border/60 py-2.5 text-sm text-muted-foreground">Cancelar</button>
              <button onClick={() => create.mutate()} disabled={create.isPending} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                {create.isPending ? "Criando…" : "Criar conta"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success modal with temp password */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 mb-3">
                <Check size={22} className="text-emerald-400" />
              </div>
              <h2 className="font-display text-lg">Conta criada!</h2>
              <p className="text-sm text-muted-foreground mt-1">Envie os dados abaixo ao proprietário.</p>
            </div>

            <div className="rounded-xl border border-border/60 bg-surface p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome</span>
                <span className="font-medium">{successModal.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">E-mail</span>
                <span className="font-medium">{successModal.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Senha temporária</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-primary">{successModal.password}</span>
                  <button onClick={copyPassword}>
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-muted-foreground" />}
                  </button>
                </div>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-muted-foreground text-center">
              O proprietário deverá trocar a senha no primeiro acesso.
            </p>

            <button onClick={() => setSuccessModal(null)} className="mt-5 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
