import { Link, useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Home, CalendarCheck, Trophy, User, Sparkles } from "lucide-react";

const leftItems = [
  { to: "/reservas", label: "Reservas", icon: CalendarCheck },
  { to: "/clube", label: "Club", icon: Sparkles },
] as const;

const centerItem = { to: "/", label: "Início", icon: Home } as const;

const rightItems = [
  { to: "/recompensas", label: "Pontos", icon: Trophy },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

function NavItem({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}) {
  return (
    <Link to={to} className="flex flex-col items-center gap-0.5 px-2 py-2">
      <motion.div
        animate={active ? { scale: 1.12 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 24 }}
      >
        <Icon
          size={20}
          strokeWidth={active ? 2.4 : 1.8}
          className={active ? "text-primary" : "text-muted-foreground/60"}
        />
      </motion.div>
      <span
        className={`text-[9px] tracking-wide transition-colors ${
          active ? "text-primary font-semibold" : "text-muted-foreground/50"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

export function BottomNav() {
  const { pathname } = useLocation();

  const homeActive = pathname === "/";

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 px-5 pb-5">
      <div className="relative flex h-[60px] items-center justify-around rounded-[30px] border border-border/60 bg-surface-elevated/90 px-3 backdrop-blur-xl shadow-[0_8px_32px_-8px_oklch(0_0_0/0.55)]">

        {leftItems.map(({ to, label, icon }) => (
          <NavItem
            key={to}
            to={to}
            label={label}
            icon={icon}
            active={pathname === to || pathname.startsWith(to + "/")}
          />
        ))}

        {/* Center raised button */}
        <div className="flex flex-col items-center">
          <Link to={centerItem.to}>
            <motion.div
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={`
                -translate-y-[22px]
                flex h-[54px] w-[54px] items-center justify-center
                rounded-full border-[3.5px]
                shadow-lg
                ${homeActive
                  ? "bg-primary border-background shadow-primary/55"
                  : "bg-primary/85 border-background shadow-primary/35"
                }
              `}
            >
              <centerItem.icon
                size={22}
                strokeWidth={2}
                className="text-primary-foreground"
              />
            </motion.div>
          </Link>
          <span
            className={`-mt-[10px] text-[9px] tracking-wide transition-colors ${
              homeActive ? "text-primary font-semibold" : "text-muted-foreground/50"
            }`}
          >
            {centerItem.label}
          </span>
        </div>

        {rightItems.map(({ to, label, icon }) => (
          <NavItem
            key={to}
            to={to}
            label={label}
            icon={icon}
            active={pathname === to || pathname.startsWith(to + "/")}
          />
        ))}

      </div>
    </nav>
  );
}
