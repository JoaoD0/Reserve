import { motion } from "framer-motion";

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <motion.div
        initial={{ rotate: -10, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
          <defs>
            <linearGradient id="logoG" x1="0" y1="0" x2="40" y2="40">
              <stop offset="0%" stopColor="oklch(0.92 0.10 85)" />
              <stop offset="100%" stopColor="oklch(0.72 0.16 55)" />
            </linearGradient>
          </defs>
          {/* Plate ring */}
          <circle cx="20" cy="20" r="18" stroke="url(#logoG)" strokeWidth="1.2" opacity="0.55" />
          <circle cx="20" cy="20" r="14" stroke="url(#logoG)" strokeWidth="1" opacity="0.35" />
          {/* Stylized R as fork-like serif mark */}
          <path
            d="M14 11 H22 C26 11 27.8 13 27.8 15.6 C27.8 18 26.2 19.7 23.6 20.1 L28 29 H24.4 L20.4 20.6 H17.4 V29 H14 Z M17.4 13.7 V18 H21.6 C23.2 18 24.2 17.2 24.2 15.85 C24.2 14.5 23.2 13.7 21.6 13.7 Z"
            fill="url(#logoG)"
          />
        </svg>
      </motion.div>
      <span className="font-display text-[18px] font-semibold tracking-tight text-foreground">
        Reservê
      </span>
    </div>
  );
}
