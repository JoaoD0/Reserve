import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Camera } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/perfil/dados")({
  component: PerfilDados,
  head: () => ({ meta: [{ title: "Meus dados — Reservê" }] }),
});

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function maskDate(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

function maskCPF(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "?";
}

function FloatingField({
  label, value, onChange, type = "text", readOnly = false, inputMode,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  type?: string; readOnly?: boolean; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const [focus, setFocus] = useState(false);
  const float = focus || value.length > 0;
  return (
    <label className="relative block">
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        inputMode={inputMode}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        className={`w-full h-14 px-4 pt-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors ${
          readOnly
            ? "bg-surface/30 border-border/40 text-muted-foreground cursor-default"
            : "bg-surface/60 border-border/60"
        }`}
      />
      <span
        className={`absolute left-4 transition-all pointer-events-none ${
          float
            ? "top-1.5 text-[10px] font-bold text-primary uppercase tracking-wider"
            : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </label>
  );
}

function FloatingSelect({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const float = value.length > 0;
  return (
    <label className="relative block">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-14 px-4 pt-4 rounded-xl bg-surface/60 border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none"
      >
        <option value="" disabled />
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <span
        className={`absolute left-4 transition-all pointer-events-none ${
          float
            ? "top-1.5 text-[10px] font-bold text-primary uppercase tracking-wider"
            : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </label>
  );
}

function PerfilDados() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!supabase || !user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user && !!supabase,
  });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [cpf, setCpf] = useState("");
  const [gender, setGender] = useState("");

  const savedRef = useRef({ fullName: "", phone: "", birthDate: "", cpf: "", gender: "" });

  useEffect(() => {
    const initial = {
      fullName: profile?.full_name ?? user?.user_metadata?.full_name ?? "",
      phone: profile?.phone ?? "",
      birthDate: profile?.birth_date ?? "",
      cpf: profile?.cpf ?? "",
      gender: profile?.gender ?? "",
    };
    savedRef.current = initial;
    setFullName(initial.fullName);
    setPhone(initial.phone);
    setBirthDate(initial.birthDate);
    setCpf(initial.cpf);
    setGender(initial.gender);
  }, [profile, user]);

  function discard() {
    const s = savedRef.current;
    setFullName(s.fullName);
    setPhone(s.phone);
    setBirthDate(s.birthDate);
    setCpf(s.cpf);
    setGender(s.gender);
    toast.info("Alterações descartadas");
  }

  const isDirty =
    fullName !== savedRef.current.fullName ||
    phone !== savedRef.current.phone ||
    birthDate !== savedRef.current.birthDate ||
    cpf !== savedRef.current.cpf ||
    gender !== savedRef.current.gender;

  const save = useMutation({
    mutationFn: async () => {
      if (!supabase || !user) throw new Error("Não autenticado");
      const [{ error: profileError }, { error: authError }] = await Promise.all([
        supabase.from("profiles").upsert({
          id: user.id,
          full_name: fullName,
          phone,
          birth_date: birthDate,
          cpf,
          gender,
          updated_at: new Date().toISOString(),
        }),
        supabase.auth.updateUser({ data: { full_name: fullName } }),
      ]);
      if (profileError) throw profileError;
      if (authError) throw authError;
    },
    onSuccess: () => {
      savedRef.current = { fullName, phone, birthDate, cpf, gender };
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Dados atualizados ✅");
      navigate({ to: "/perfil" });
    },
    onError: (e) => toast.error("Erro ao salvar", { description: (e as Error).message }),
  });

  const initials = getInitials(fullName || undefined, user?.email);

  return (
    <MobileShell>
      <header className="flex items-center gap-3 px-5 pt-6">
        <button
          onClick={() => navigate({ to: "/perfil" })}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-surface/60"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="font-display text-lg">Meus dados</h1>
      </header>

      <div className="px-5 pt-8 pb-48">
        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary via-gold to-primary opacity-70 blur-md" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-background bg-surface-elevated">
              <span className="font-display text-3xl text-gradient-gold">{initials}</span>
            </div>
            <button className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary border-2 border-background">
              <Camera size={13} className="text-primary-foreground" />
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-3"
        >
          <FloatingField label="Nome completo" value={fullName} onChange={setFullName} />
          <FloatingField label="E-mail" value={user?.email ?? ""} readOnly />
          <FloatingField
            label="Telefone"
            value={phone}
            inputMode="numeric"
            onChange={(v) => setPhone(maskPhone(v))}
          />
          <FloatingField
            label="Data de nascimento"
            value={birthDate}
            inputMode="numeric"
            onChange={(v) => setBirthDate(maskDate(v))}
          />
          <FloatingField
            label="CPF"
            value={cpf}
            inputMode="numeric"
            onChange={(v) => setCpf(maskCPF(v))}
          />
          <FloatingSelect
            label="Gênero"
            value={gender}
            onChange={setGender}
            options={[
              { value: "masculino", label: "Masculino" },
              { value: "feminino", label: "Feminino" },
              { value: "outro", label: "Prefiro não informar" },
            ]}
          />
        </motion.div>
      </div>

      {/* Sticky action bar — sits above the BottomNav (≈80px) */}
      <div className="fixed bottom-[84px] left-1/2 z-40 -translate-x-1/2 w-full max-w-[480px] px-5 pb-3 pt-3 bg-background/90 backdrop-blur border-t border-border/40">
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={discard}
            disabled={!isDirty || save.isPending}
            className="flex-1 h-12 rounded-full border border-border/60 bg-surface/60 font-semibold text-sm text-foreground disabled:opacity-40"
          >
            Descartar
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => save.mutate()}
            disabled={!isDirty || save.isPending}
            className="flex-[2] h-12 rounded-full bg-primary text-primary-foreground font-bold disabled:opacity-40 flex items-center justify-center"
          >
            {save.isPending ? "Salvando…" : "Salvar alterações"}
          </motion.button>
        </div>
      </div>
    </MobileShell>
  );
}
