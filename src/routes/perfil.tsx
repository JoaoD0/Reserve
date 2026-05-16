import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Settings,
  Bell,
  HelpCircle,
  Award,
  ChevronRight,
  Heart,
  LogOut,
  User,
} from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/lib/hooks/useAuth";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/perfil")({
  component: Perfil,
  head: () => ({ meta: [{ title: "Perfil — Reservê" }] }),
});

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "?";
}

/* ── Main component ── */
function Perfil() {
  const { location } = useRouterState();
  const { user, loading, signOut } = useAuth();
  const { favorites } = useFavorites(user);
  const { data: reservationCount } = useQuery({
    queryKey: ["reservationCount", user?.id],
    queryFn: async () => {
      if (!supabase || !user) return null;
      const { count } = await supabase
        .from("reservations")
        .select("*", { count: "exact", head: true });
      return count ?? 0;
    },
    enabled: !!user && !!supabase,
  });

  if (location.pathname !== "/perfil") return <Outlet />;
  if (loading) return null;

  const fullName: string =
    user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Usuário";
  const initials = getInitials(user?.user_metadata?.full_name, user?.email);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-background">
        <span className="inline-flex size-16 rounded-full bg-primary/20 items-center justify-center font-display text-3xl text-primary mb-6">R</span>
        <h1 className="font-display text-2xl">Faça login para continuar</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs">Acesse seu perfil e gerencie suas reservas.</p>
        <Link to="/login" search={{ redirect: "/perfil" }}
          className="mt-8 w-full max-w-xs h-12 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center">
          Entrar
        </Link>
        <Link to="/signup" search={{ redirect: "/perfil" }}
          className="mt-3 w-full max-w-xs h-12 rounded-full border border-border/60 bg-surface/60 font-bold flex items-center justify-center text-sm">
          Criar conta
        </Link>
        <BottomNav />
      </div>
    );
  }

  const stats = [
    { label: "Reservas", value: reservationCount ?? "—" },
    { label: "Favoritos", value: favorites.length > 0 ? favorites.length : "—" },
    { label: "Pontos", value: "—" },
  ];

  const menuItems = [
    { icon: <User size={15} />, label: "Meus dados", to: "/perfil/dados" as const },
    { icon: <Heart size={15} />, label: "Restaurantes favoritos", to: "/perfil/favoritos" as const },
    { icon: <Bell size={15} />, label: "Notificações", to: "/perfil/notificacoes" as const },
    { icon: <HelpCircle size={15} />, label: "Ajuda & suporte", to: "/perfil/ajuda" as const },
  ];

  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 pt-6">
        <div className="flex items-center gap-2.5">
          {/* small R wordmark */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <span className="font-display text-sm font-bold text-primary-foreground">R</span>
          </div>
          <span className="font-display text-base font-semibold tracking-tight text-foreground">
            Reservê
          </span>
        </div>
        <button className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-surface/60">
          <Settings size={15} className="text-muted-foreground" />
        </button>
      </header>

      {/* Profile header */}
      <section className="px-5 pt-7">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center"
        >
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary via-gold to-primary opacity-70 blur-md" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-background bg-surface-elevated">
              <span className="font-display text-3xl text-gradient-gold">{initials}</span>
            </div>
          </div>
          <h1 className="font-display mt-4 text-2xl">{fullName}</h1>
          <p className="text-xs text-muted-foreground">{user?.email ?? ""}</p>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold">
            <Award size={11} /> Membro Gold
          </span>
        </motion.div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 overflow-hidden rounded-2xl border border-border/60 bg-card">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className={`flex flex-col items-center py-4 ${
                i < stats.length - 1 ? "border-r border-border/60" : ""
              }`}
            >
              <span className="font-display text-xl text-foreground">{s.value}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {s.label}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Menu */}
      <section className="mt-6 px-5">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          {menuItems.map((item, i) => (
            <Link
              key={item.label}
              to={item.to}
              className={`flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-surface/60 transition-colors ${
                i < menuItems.length - 1 ? "border-b border-border/60" : ""
              }`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {item.icon}
              </span>
              <span className="flex-1 text-sm">{item.label}</span>
              <ChevronRight size={15} className="text-muted-foreground" />
            </Link>
          ))}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={signOut}
            className="flex w-full items-center gap-3 border-t border-border/60 px-4 py-3.5 text-left"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <LogOut size={15} />
            </span>
            <span className="flex-1 text-sm text-destructive">Sair</span>
          </motion.button>
        </div>

        <p className="mt-6 text-center text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Reservê · v1.0
        </p>
      </section>
    </MobileShell>
  );
}
