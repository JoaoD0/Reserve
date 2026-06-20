import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, UtensilsCrossed, Users, CalendarCheck, LogOut, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/hooks/useAuth";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/restaurantes", label: "Restaurantes", icon: UtensilsCrossed, exact: false },
  { to: "/admin/proprietarios", label: "Proprietários", icon: Users, exact: false },
  { to: "/admin/reservas", label: "Reservas", icon: CalendarCheck, exact: false },
] as const;

function AdminLayout() {
  const { isAdmin, loading, signOut, user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { window.location.replace("/login"); return; }
    if (!isAdmin) { window.location.replace("/"); }
  }, [loading, user, isAdmin]);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  if (loading || !isAdmin) return null;

  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between px-5 py-5 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <span className="font-display text-sm font-bold text-primary-foreground">R</span>
          </div>
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold">Reservê</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Admin</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="flex md:hidden h-8 w-8 items-center justify-center rounded-full border border-border/60 text-muted-foreground"
        >
          <X size={14} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                active
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground"
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-5 border-t border-border/60 pt-3">
        <p className="px-3 text-[11px] text-muted-foreground mb-2 truncate">{user?.email}</p>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-surface hover:text-destructive transition-colors"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background text-foreground">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:fixed md:top-0 md:left-0 md:h-full md:w-56 md:flex flex-col bg-card border-r border-border/60 z-40">
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
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary">
          <span className="font-display text-xs font-bold text-primary-foreground">R</span>
        </div>
        <span className="font-display text-sm font-semibold">Admin</span>
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
      <main className="flex-1 min-h-screen pt-14 md:pt-0 md:ml-56">
        <Outlet />
      </main>
    </div>
  );
}
