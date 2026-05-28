import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouterState } from "@tanstack/react-router";

type Msg = { role: "user" | "assistant"; content: string };

const INITIAL: Msg = {
  role: "assistant",
  content: "Oi! Sou o Breno, assistente do Reservê. Como posso te ajudar? 😊",
};

const SUGGESTIONS = [
  "Como faço uma reserva?",
  "Como cancelo minha reserva?",
  "Como funciona o sistema de pontos?",
  "Como ganho pontos de recompensa?",
];

function ChatUI({ onClose }: { onClose?: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([INITIAL]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isClube = pathname.startsWith("/clube");
  const context = isClube ? "clube" : "default";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  async function send(text = input.trim()) {
    if (!text || loading) return;

    const userMsg: Msg = { role: "user", content: text };
    const next = [...msgs, userMsg];
    setMsgs(next);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase!.functions.invoke("chat-support", {
        body: { messages: next.map((m) => ({ role: m.role, content: m.content })), context },
      });
      if (error) throw error;
      setMsgs([...next, { role: "assistant", content: data.reply }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: "Desculpe, algo deu errado. Tente novamente." }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function sendSuggestion(q: string) {
    setInput("");
    send(q);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
            <span className="text-[11px] font-bold text-primary">B</span>
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Breno</p>
            <p className="text-[10px] text-emerald-400 mt-0.5">● online</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-surface/60 transition-colors">
            <X size={15} className="text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-surface border border-border/60 text-foreground rounded-bl-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface border border-border/60 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="block h-1.5 w-1.5 rounded-full bg-muted-foreground"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pt-3 pb-3 border-t border-border/60 shrink-0">
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendSuggestion(q)}
              disabled={loading}
              className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/20 transition-colors disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-surface/70 px-4 py-2.5">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input.trim())}
            placeholder="Digite sua dúvida..."
            disabled={loading}
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-50"
          />
          <button
            disabled={!input.trim() || loading}
            className="h-7 w-7 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-30 transition-opacity shrink-0"
            onClick={() => send(input.trim())}
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function BrenoChatEmbedded() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card" style={{ height: 420 }}>
      <ChatUI />
    </div>
  );
}

export function BrenoChatFloating() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-5 z-50 h-13 w-13 flex items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30"
        whileTap={{ scale: 0.92 }}
        animate={{ scale: open ? 0 : 1 }}
        style={{ width: 52, height: 52 }}
      >
        <span className="text-base font-bold text-primary-foreground">B</span>
      </motion.button>

      {/* Chat drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl border-t border-border/60 flex flex-col"
              style={{ height: "70vh" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              <ChatUI onClose={() => setOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
