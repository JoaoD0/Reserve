import { createFileRoute, Outlet, useNavigate, Link, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, LayoutDashboard, LogOut, Sparkles, Ticket } from "lucide-react";
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
] as const;

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function OwnerLayout() {
  const { isOwner, loading, signOut, user, profile, restaurantId } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

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

  if (loading || !isOwner) return null;

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border/60 bg-card">
        {/* Brand */}
        <div className="flex flex-col gap-1 border-b border-border/60 px-5 py-4">
          <Logo size={28} showText={false} />
          <div className="min-w-0 mt-1">
            <p className="truncate font-display text-sm font-semibold">
              {restaurant?.name ?? "Reservê"}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Proprietário</p>
          </div>
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
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
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
      </aside>

      <main className="ml-60 flex-1 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
