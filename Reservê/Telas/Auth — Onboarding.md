# Onboarding

**Rota:** `/onboarding`  
**Arquivo:** `src/routes/onboarding.tsx`  
**Acesso:** Público — mostrado ao novo usuário na primeira vez

---

## Layout

```
┌─────────────────────────────┐
│                    Pular →  │  ← skip no canto superior direito
│                             │
│                             │
│      ┌──────────────┐       │
│      │              │       │  ← ícone 128×128, rounded-3xl
│      │    📍 / 📅   │       │     cor muda por step
│      │              │       │
│      └──────────────┘       │
│                             │
│   Descubra restaurantes     │
│     perto de você           │  ← título display, whitespace-pre-line
│                             │
│  Explore os melhores        │
│  restaurantes da cidade...  │  ← descrição muted, max 280px
│                             │
│                             │
│          ●  ○               │  ← dots de progresso animados
│                             │
│ [      Continuar →        ] │  ← botão com glow primary
└─────────────────────────────┘
```

---

## Steps

| Step | Ícone | Cor | Título |
|---|---|---|---|
| 0 | `MapPin` | primary (laranja) | "Descubra restaurantes perto de você" |
| 1 | `CalendarCheck` | gold (dourado) | "Reserve sua mesa em segundos" |

---

## Animações

- Transição entre steps: slide horizontal — entra da direita (`x: 48 → 0`), sai pela esquerda (`x: 0 → -48`)
- `AnimatePresence mode="wait"` — garante que o step anterior sai antes do novo entrar
- Dots de progresso: o dot ativo expande de 8px para 24px de largura (spring animation)
- Botão: muda label "Continuar" → "Começar" no último step

---

## Comportamento

- Botão "Pular" → `localStorage.setItem("reserve_onboarded", "1")` + navega para `/`
- Último step "Começar" → mesma ação do "Pular"
- O app checa `localStorage("reserve_onboarded")` para decidir se exibe o onboarding

---

## Navegação

| Ação | Destino |
|---|---|
| Completar / Pular | → `/` |
