import { motion } from "framer-motion";
import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-noir-gradient">
      <div className="mx-auto min-h-screen w-full max-w-[480px] pb-32">
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.main>
      </div>
      <BottomNav />
    </div>
  );
}
