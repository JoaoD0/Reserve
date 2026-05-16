import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { X, MapPin, Loader2, AlertCircle } from "lucide-react";

export type UserLocation = {
  label: string;
  lat?: number;
  lng?: number;
};

const STORAGE_KEY = "reserve.location";

export function loadStoredLocation(): UserLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserLocation) : null;
  } catch {
    return null;
  }
}

function saveLocation(loc: UserLocation) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
}

function maskCep(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (loc: UserLocation) => void;
};

export function LocationSheet({ open, onClose, onConfirm }: Props) {
  const [cep, setCep] = useState("");
  const [freeText, setFreeText] = useState("");
  const [pending, setPending] = useState<UserLocation | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");

  useEffect(() => {
    if (open) {
      setCep("");
      setFreeText("");
      setPending(null);
      setCepError("");
    }
  }, [open]);

  async function handleGps() {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
          );
          const data = await res.json();
          const neighbourhood =
            data.address?.neighbourhood ||
            data.address?.suburb ||
            data.address?.district ||
            "";
          const city = data.address?.city || data.address?.town || "";
          const label = [neighbourhood, city].filter(Boolean).join(", ") || "Minha localização";
          setPending({ label, lat: pos.coords.latitude, lng: pos.coords.longitude });
        } catch {
          setPending({ label: "Minha localização", lat: pos.coords.latitude, lng: pos.coords.longitude });
        }
        setGpsLoading(false);
      },
      () => setGpsLoading(false)
    );
  }

  async function handleCep() {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    setCepError("");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) throw new Error("not found");
      const label = [data.bairro, data.localidade].filter(Boolean).join(", ");
      setPending({ label });
    } catch {
      setCepError("CEP não encontrado.");
    }
    setCepLoading(false);
  }

  function handleConfirm() {
    const loc = pending || (freeText.trim() ? { label: freeText.trim() } : null);
    if (!loc) return;
    saveLocation(loc);
    onConfirm(loc);
    onClose();
  }

  const hasSelection = !!pending || !!freeText.trim();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-background/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px] rounded-t-3xl border border-border/60 bg-surface-elevated"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-border/60" />
            </div>

            <div className="flex items-center justify-between px-5 py-3">
              <h2 className="font-display text-xl font-medium">Sua localização</h2>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-surface text-muted-foreground"
              >
                <X size={14} />
              </button>
            </div>

            <div className="px-5 pb-8 flex flex-col gap-4">
              {/* GPS */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleGps}
                disabled={gpsLoading}
                className="flex w-full items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3.5 text-left transition-colors"
              >
                {gpsLoading ? (
                  <Loader2 size={18} className="animate-spin text-primary" />
                ) : (
                  <MapPin size={18} className="text-primary" />
                )}
                <div>
                  <p className="text-sm font-medium text-primary">
                    Usar localização atual
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Via GPS do dispositivo
                  </p>
                </div>
              </motion.button>

              {/* Selected preview */}
              <AnimatePresence>
                {pending && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2.5">
                      <MapPin size={13} className="text-primary shrink-0" />
                      <span className="text-sm text-primary">{pending.label}</span>
                      <button onClick={() => setPending(null)} className="ml-auto text-muted-foreground">
                        <X size={13} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Separator */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border/60" />
                <span className="text-[11px] text-muted-foreground">ou</span>
                <div className="h-px flex-1 bg-border/60" />
              </div>

              {/* CEP */}
              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  CEP
                </label>
                <div className="flex gap-2">
                  <input
                    value={cep}
                    onChange={(e) => {
                      setCep(maskCep(e.target.value));
                      setCepError("");
                    }}
                    placeholder="00000-000"
                    className="flex-1 rounded-xl border border-border/60 bg-surface px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none"
                  />
                  <button
                    onClick={handleCep}
                    disabled={cepLoading || cep.replace(/\D/g, "").length !== 8}
                    className="rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
                  >
                    {cepLoading ? <Loader2 size={14} className="animate-spin" /> : "Buscar"}
                  </button>
                </div>
                <AnimatePresence>
                  {cepError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-1.5 flex items-center gap-1 text-[11px] text-red-400"
                    >
                      <AlertCircle size={11} /> {cepError}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Free text */}
              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Ou digite seu endereço
                </label>
                <input
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder="Ex: Jardins, São Paulo"
                  className="w-full rounded-xl border border-border/60 bg-surface px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none"
                />
              </div>

              {/* Confirm */}
              <button
                onClick={handleConfirm}
                disabled={!hasSelection}
                className="mt-1 flex w-full items-center justify-center rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-40"
              >
                Confirmar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
