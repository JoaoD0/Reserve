import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { MapPin, CalendarCheck, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
  head: () => ({ meta: [{ title: "Bem-vindo — Reservê" }] }),
});

const steps = [
  {
    Icon: MapPin,
    colorText: "text-primary",
    colorBg: "bg-primary/10",
    colorBorder: "border-primary/20",
    title: "Descubra restaurantes\nperto de você",
    description:
      "Explore os melhores restaurantes da cidade com avaliações reais, cardápios completos e localização precisa.",
  },
  {
    Icon: CalendarCheck,
    colorText: "text-gold",
    colorBg: "bg-gold/10",
    colorBorder: "border-gold/20",
    title: "Reserve sua mesa\nem segundos",
    description:
      "Escolha data, horário e número de pessoas. Confirmação imediata, sem filas e sem espera.",
  },
];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  function finish() {
    localStorage.setItem("reserve_onboarded", "1");
    navigate({ to: "/" });
  }

  function next() {
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      finish();
    }
  }

  const current = steps[step];

  return (
    <div className="min-h-screen bg-noir-gradient">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[480px] flex-col px-5">
        {/* Skip */}
        <div className="flex justify-end pt-14">
          <button
            onClick={finish}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Pular
          </button>
        </div>

        {/* Centered content */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 48 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -48 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center"
            >
              {/* Icon container */}
              <div
                className={`flex h-32 w-32 items-center justify-center rounded-3xl border ${current.colorBorder} ${current.colorBg}`}
              >
                <current.Icon
                  size={56}
                  className={current.colorText}
                  strokeWidth={1.4}
                />
              </div>

              {/* Title */}
              <h1 className="font-display mt-10 whitespace-pre-line text-center text-[1.75rem] leading-snug text-foreground">
                {current.title}
              </h1>

              {/* Description */}
              <p className="mt-4 max-w-[280px] text-sm leading-relaxed text-muted-foreground">
                {current.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom controls */}
        <div className="flex flex-col items-center gap-6 pb-14">
          {/* Step dots */}
          <div className="flex items-center gap-2">
            {steps.map((_, i) => (
              <motion.span
                key={i}
                animate={{
                  width: i === step ? 24 : 8,
                  backgroundColor:
                    i === step
                      ? "oklch(0.78 0.14 65)"
                      : "oklch(0.30 0.014 60 / 60%)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="block h-2 rounded-full"
                style={{ display: "block" }}
              />
            ))}
          </div>

          {/* CTA button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={next}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-4 text-sm font-semibold text-accent-foreground glow-primary"
          >
            {step < steps.length - 1 ? "Continuar" : "Começar"}
            <ChevronRight size={16} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
