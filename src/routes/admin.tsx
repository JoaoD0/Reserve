import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";
import { LayoutDashboard, UtensilsCrossed, Users, CalendarCheck, LogOut } from "lucide-react";
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

  useEffect(() => {
    if (loading) return;
    if (!user) { window.location.replace("/login"); return; }
    if (!isAdmin) { window.location.replace("/"); }
  }, [loading, user, isAdmin]);

  if (loading || !isAdmin) return null;

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-56 bg-card border-r border-border/60 flex flex-col z-40">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border/60">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <span className="font-display text-sm font-bold text-primary-foreground">R</span>
          </div>
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold">Reservê</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Admin</p>
          </div>
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
      </aside>

      {/* Main content */}
      <main className="ml-56 flex-1 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
