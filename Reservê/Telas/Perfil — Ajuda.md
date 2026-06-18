# Perfil — Ajuda & Suporte

**Rota:** `/perfil/ajuda`  
**Arquivo:** `src/routes/perfil.ajuda.tsx`  
**Acesso:** Público

---

## Layout

```
┌─────────────────────────────┐
│ ←  Ajuda & suporte          │
│                             │
│ 🔍 Buscar na ajuda...       │  ← filtra FAQ em tempo real
│                             │
│ RESERVAS                    │
│ ┌─────────────────────────┐ │
│ │ Como faço uma reserva?↓ │ │  ← AccordionItem fechado
│ ├─────────────────────────┤ │
│ │ Com quanto tempo de     │ │
│ │ antecedência?          ↑│ │  ← AccordionItem aberto
│ │ Você pode agendar com   │ │
│ │ até 2 meses...          │ │
│ ├─────────────────────────┤ │
│ │ Posso cancelar?        ↓│ │
│ └─────────────────────────┘ │
│                             │
│ CONTA E DADOS               │
│ ┌─────────────────────────┐ │
│ │ ...                     │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ Breno em todo o app  [●]│ │  ← toggle localStorage
│ │ Botão flutuante...      │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ Não encontrou?          │ │
│ │ Nossa equipe está pronta│ │
│ │ [💬 Falar no WhatsApp]  │ │  ← link wa.me (fictício)
│ │ [✉ Enviar e-mail]       │ │  ← mailto: (fictício)
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

## FAQ — Seções e perguntas

### Reservas
1. Como faço uma reserva?
2. Com quanto tempo de antecedência posso reservar? *(adicionada em v2.5.1)*
3. Posso cancelar minha reserva?
4. O que fazer se eu me atrasar?
5. Posso alterar o número de pessoas?

### Conta e dados
1. Como altero minha senha?
2. Meus dados estão seguros?
3. Como excluo minha conta?

### Notificações
1. Por que não estou recebendo notificações?
2. Como desativo e-mails de promoções?
3. Com que frequência recebo lembretes?

### Sobre o app
1. O Reservê é gratuito?
2. Em quais cidades está disponível?
3. Como um restaurante pode se cadastrar?

---

## Busca

Filtra seções e perguntas em tempo real pela query de busca (case-insensitive, busca em `q` e `a`). Se nenhum resultado: emoji 🔍 + "Nenhum resultado para 'X'".

---

## AccordionItem

Componente `AccordionItem` com `useState(open)`. Animação de altura via Framer Motion `AnimatePresence` + `height: 0 → "auto"`. O chevron rota 180° quando aberto.

---

## Toggle Breno global

Salvo em `localStorage("breno_global")`. Ao trogar, dispara `window.dispatchEvent(new Event("breno-toggle"))` — os componentes que exibem o Breno ouvem esse evento para mostrar/ocultar o botão flutuante em todas as telas.

---

## Contatos (⚠️ fictícios)

- WhatsApp: `https://wa.me/5511999999999` — número falso
- Email: `mailto:ajuda@reserve.app` — domínio não existe
