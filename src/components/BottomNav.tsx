import { Link, useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Home, CalendarCheck, User } from "lucide-react";

const items = [
  { to: "/", label: "Início", icon: Home },
  { to: "/reservas", label: "Reservas", icon: CalendarCheck },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 px-4 pb-4">
      <div className="relative rounded-[28px] border border-border/60 bg-surface-elevated/80 px-2 py-2 backdrop-blur-xl glow-soft">
        <ul className="relative grid grid-cols-3">
          {items.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <li key={item.to} className="relative">
                <Link
                  to={item.to}
                  className="relative flex flex-col items-center gap-1 py-2.5"
                >
                  {active && (
                    <motion.div
                      layoutId="navPill"
                      className="absolute inset-x-2 inset-y-0 rounded-2xl bg-primary/15 border border-primary/30"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <motion.div
                    className="relative z-10"
                    animate={active ? { y: -2, scale: 1.08 } : { y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  >
                    <Icon
                      size={22}
                      strokeWidth={active ? 2.4 : 1.8}
                      className={active ? "text-primary" : "text-muted-foreground"}
                    />
                  </motion.div>
                  <motion.span
                    className="relative z-10 text-[10.5px] font-medium tracking-wide"
                    animate={{
                      color: active
                        ? "oklch(0.72 0.16 55)"
                        : "oklch(0.68 0.018 75)",
                    }}
                  >
                    {item.label}
                  </motion.span>
                  {active && (
                    <motion.div
                      layoutId="navDot"
                      className="absolute bottom-1 z-10 h-1 w-1 rounded-full bg-primary"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
