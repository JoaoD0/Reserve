import { createFileRoute, Outlet, useNavigate, Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, LayoutDashboard, LogOut, Menu, Settings, Sparkles, Ticket, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/owner")({
  component: OwnerLayout,
});

const NAV = [
  { to: "/owner", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/owner/reservas", label: "Reservas", icon: CalendarCheck, exact: false },
  { to: "/owner/experiencias", label: "Club", icon: Sparkles, exact: false },
  { to: "/owner/cupons", label: "Cupons", icon: Ticket, exact: false },
  { to: "/owner/configuracoes", label: "Configurações", icon: Settings, exact: false },
] as const;

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function OwnerLayout() {
  const { isOwner, loading, signOut, user, profile, restaurantId } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: restaurant } = useQuery({
    queryKey: ["owner", "restaurant-name", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data } = await supabase!.from("restaurants").select("name").eq("id", restaurantId!).single();
      return data;
    },
  });

  useEffect(() => {
    if (loading) return;
    if (!user) { window.location.replace("/login"); return; }
    if (!isOwner) { window.location.replace("/"); }
  }, [loading, user, isOwner]);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  if (loading || !isOwner) return null;

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="flex flex-col gap-1">
          <Logo size={28} showText={false} />
          <div className="min-w-0 mt-1">
            <p className="truncate font-display text-sm font-semibold">
              {restaurant?.name ?? "Reservê"}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Proprietário</p>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="flex md:hidden h-8 w-8 items-center justify-center rounded-full border border-border/60 text-muted-foreground"
        >
          <X size={14} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                active
                  ? "bg-primary/15 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground"
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2.3 : 1.8} className="shrink-0" />
              {label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-border/60 p-3 space-y-1">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[11px] font-bold text-primary">
            {profile?.full_name ? initials(profile.full_name) : "?"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium leading-tight">{profile?.full_name}</p>
            <p className="truncate text-[10px] text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={15} />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background text-foreground">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-60 flex-col border-r border-border/60 bg-card">
        <SidebarContent />
      </aside>

      {/* ── Mobile: top bar ── */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-border/60 bg-card/95 px-4 backdrop-blur-md md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 text-foreground"
        >
          <Menu size={18} />
        </button>
        <Logo size={22} showText={false} />
        <span className="font-display text-sm font-semibold truncate">
          {restaurant?.name ?? "Painel"}
        </span>
      </header>

      {/* ── Mobile: sidebar overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              key="sidebar"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border/60 bg-card md:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <main className="flex-1 min-h-screen pt-14 md:pt-0 md:ml-60">
        <Outlet />
      </main>
    </div>
  );
}
