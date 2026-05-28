import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, ChevronDown, MessageCircle, Mail } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";

export const Route = createFileRoute("/perfil/ajuda")({
  component: PerfilAjuda,
  head: () => ({ meta: [{ title: "Ajuda & suporte — Reservê" }] }),
});

const FAQ = [
  {
    section: "Reservas",
    items: [
      {
        q: "Como faço uma reserva?",
        a: "Acesse a página do restaurante, escolha data, horário e número de pessoas, preencha seu telefone e confirme. Você receberá um código de confirmação.",
      },
      {
        q: "Posso cancelar minha reserva?",
        a: "Sim. Entre em 'Minhas reservas', encontre a reserva desejada e toque em 'Cancelar'. O cancelamento deve ser feito com pelo menos 2 horas de antecedência.",
      },
      {
        q: "O que fazer se eu me atrasar?",
        a: "Entre em contato diretamente com o restaurante pelo telefone informado na reserva. A maioria guarda a mesa por até 15 minutos.",
      },
      {
        q: "Posso alterar o número de pessoas?",
        a: "Cancele a reserva atual e faça uma nova com o número correto de pessoas. Garanta a disponibilidade antes de cancelar.",
      },
    ],
  },
  {
    section: "Conta e dados",
    items: [
      {
        q: "Como altero minha senha?",
        a: "Vá na tela de login e toque em 'Esqueci minha senha'. Um link será enviado para seu e-mail cadastrado.",
      },
      {
        q: "Meus dados estão seguros?",
        a: "Sim. Usamos criptografia de ponta a ponta e nunca compartilhamos seus dados com terceiros sem sua autorização explícita.",
      },
      {
        q: "Como excluo minha conta?",
        a: "Entre em contato com nosso suporte pelo WhatsApp ou e-mail. A exclusão é irreversível e remove todos os seus dados em até 30 dias.",
      },
    ],
  },
  {
    section: "Notificações",
    items: [
      {
        q: "Por que não estou recebendo notificações?",
        a: "Verifique se as notificações estão ativadas em Configurações do celular > Aplicativos > Reservê. Também confira suas preferências em Perfil → Notificações.",
      },
      {
        q: "Como desativo e-mails de promoções?",
        a: "Vá em Perfil → Notificações e desative 'Promoções e descontos'. Também há um link de descadastro no rodapé de cada e-mail enviado.",
      },
      {
        q: "Com que frequência recebo lembretes de reserva?",
        a: "Enviamos um lembrete 24 horas antes e outro 2 horas antes da sua reserva, se você tiver essa preferência ativada.",
      },
    ],
  },
  {
    section: "Sobre o app",
    items: [
      {
        q: "O Reservê é gratuito?",
        a: "Sim, o app é completamente gratuito para usuários. Cobramos uma pequena comissão dos restaurantes parceiros, não dos clientes.",
      },
      {
        q: "Em quais cidades o Reservê está disponível?",
        a: "Atualmente operamos em São Paulo, Rio de Janeiro e Curitiba. Em breve, mais cidades serão adicionadas.",
      },
      {
        q: "Como um restaurante pode se cadastrar?",
        a: "Restaurantes interessados podem entrar em contato pelo e-mail parceiros@reserve.app. Nossa equipe fará uma curadoria e retornará em até 5 dias úteis.",
      },
    ],
  },
];

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/60 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left"
      >
        <span className="text-sm font-medium leading-snug">{q}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 mt-0.5"
        >
          <ChevronDown size={15} className="text-muted-foreground" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as const }}
            className="overflow-hidden"
          >
            <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PerfilAjuda() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [brenoGlobal, setBrenoGlobal] = useState(() =>
    typeof localStorage !== "undefined" && localStorage.getItem("breno_global") === "true"
  );

  function toggleBreno() {
    const next = !brenoGlobal;
    setBrenoGlobal(next);
    localStorage.setItem("breno_global", String(next));
    window.dispatchEvent(new Event("breno-toggle"));
  }

  const filtered = FAQ.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) =>
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter((section) => section.items.length > 0);

  return (
    <MobileShell>
      <header className="flex items-center gap-3 px-5 pt-6">
        <button
          onClick={() => navigate({ to: "/perfil" })}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-surface/60"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="font-display text-lg">Ajuda & suporte</h1>
      </header>

      <div className="px-5 pt-5 pb-24 space-y-5">
        {/* Search */}
        <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-surface/70 px-4 py-3">
          <Search size={15} className="text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar na ajuda..."
            className="w-full bg-transparent text-sm placeholder:text-muted-foreground/60 focus:outline-none"
          />
        </div>

        {/* FAQ */}
        {filtered.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm text-muted-foreground">Nenhum resultado para "{search}"</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((section) => (
              <div key={section.section}>
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-2 px-1">
                  {section.section}
                </h2>
                <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
                  {section.items.map((item) => (
                    <AccordionItem key={item.q} q={item.q} a={item.a} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Toggle Breno global */}
        <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card px-5 py-4">
          <div>
            <p className="text-sm font-medium">Breno em todo o app</p>
            <p className="text-xs text-muted-foreground mt-0.5">Botão flutuante disponível em todas as telas</p>
          </div>
          <button
            onClick={toggleBreno}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${brenoGlobal ? "bg-primary" : "bg-muted"}`}
          >
            <span className={`absolute top-0.5 left-0.5 block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${brenoGlobal ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>

        {/* Contact */}
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card p-5">
          <h2 className="font-display text-base mb-1">Não encontrou o que procurava?</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Nossa equipe está pronta para te ajudar.
          </p>
          <div className="flex flex-col gap-2">
            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground font-semibold text-sm"
            >
              <MessageCircle size={16} /> Falar no WhatsApp
            </a>
            <a
              href="mailto:ajuda@reserve.app"
              className="flex h-11 items-center justify-center gap-2 rounded-full border border-border/60 text-foreground font-semibold text-sm"
            >
              <Mail size={16} /> Enviar e-mail
            </a>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
