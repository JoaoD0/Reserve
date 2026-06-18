# Restaurante — Detalhe e Booking

**Rota:** `/restaurante/:id`  
**Arquivo:** `src/routes/restaurante.$id.tsx`  
**Acesso:** Público para ver, requer login para reservar

---

## Layout

```
┌─────────────────────────────┐
│ [foto hero full-width]      │  ← imagem do restaurante
│ ←         [♡]              │  ← voltar flutuante + favoritar
│                             │
│ JAPONÊS CONTEMPORÂNEO       │  ← culinária uppercase gold
│ Sakura Omakase              │  ← nome display grande
│ ⭐4.9 · Jardins · R$300+   │  ← rating + bairro + preço
│                             │
│ ──────────────────────────  │
│                             │
│ 📅 Escolha uma data         │
│                             │
│ ┌ Jun 2026 ──── ‹  › ┐      │  ← MiniCalendar
│ │ D  S  T  Q  Q  S  S│      │
│ │ ..  2  3  4  5  6  7│      │
│ │  8  9 [10] 11 12 ...│      │  ← hoje destacado, selecionado preenchido
│ │ ...                 │      │
│ └─────────────────────┘      │
│ ⚠ Até 2 meses de antecedência│
│                             │
│ ⏰ Horários disponíveis     │  ← aparece ao selecionar data
│ ┌────┐ ┌────┐ ┌────┐        │
│ │19:00│ │─19:30─│ │20:00│  │  ← livre / ocupado riscado / disputa âmbar
│ └────┘ └────┘ └────┘        │
│                             │
│  Ocupado  Em disputa        │  ← legenda
│                             │
│ 👥 Quantas pessoas?         │
│    [−]    3    [+]          │  ← stepper
│                             │
│ 📱 Telefone para contato    │
│ ┌─────────────────────────┐ │
│ │ (11) 99999-9999         │ │
│ └─────────────────────────┘ │
│                             │
│ [    Confirmar reserva    ] │  ← fixo no bottom (fixed position)
└─────────────────────────────┘
```

---

## Calendário (`MiniCalendar`)

Componente interno ao arquivo. Grade mensal completa com navegação.

**Estados das datas:**
- **Passada** → texto cinza opaco, não clicável (`opacity-40`)
- **Hoje** → borda primary, texto primary
- **Selecionada** → fundo primary, texto branco
- **Além de 2 meses** → mesma aparência de passada, bloqueada
- **Normal disponível** → texto foreground, clicável

**Controles de navegação:**
- `canPrev` = false se `viewMonth === hoje.month && viewYear === hoje.year`
- `canNext` = false se o mês exibido já está 2 meses à frente do mês atual
- Botão ‹ / › ficam desabilitados e com `opacity-40` quando bloqueados

**Aviso fixo abaixo do calendário:**
> "Reservas disponíveis com até 2 meses de antecedência."

---

## Grade de Horários

Aparece apenas quando `selectedDate` está preenchida. Query dispara ao selecionar data:

```
supabase.from("reservations")
  .select("time_slot, status")
  .eq("restaurant_id", id)
  .eq("reservation_date", selectedDate)
  .in("status", ["confirmed", "pending"])
```

Resultado dividido em dois Sets: `confirmed` e `pending`.

| Estado | Visual | Comportamento |
|---|---|---|
| Livre | Botão normal, borda `border/60` | Clicável, selecionável |
| Confirmed | Texto riscado, cinza, "Ocupado" | Desabilitado |
| Pending | Fundo âmbar/10, texto âmbar, "Disputa ⚡" | Clicável → abre sheet |
| Selecionado | Fundo primary | — |

**Bottom sheet "Em Disputa":**
Ao clicar em horário pending, abre sheet explicando:
> "Este horário já tem uma reserva aguardando aprovação. Você pode entrar na fila e concorrer — a decisão fica com o restaurante."

Dois botões:
- "Tentar mesmo assim" → fecha sheet, seleciona o horário, permite reservar
- "Escolher outro horário" → fecha sheet

**Legenda abaixo da grade:**
- Quadradinho cinza: "Ocupado"
- Quadradinho âmbar: "Em disputa"

---

## Fluxo de reserva

1. Usuário seleciona data no calendário
2. Grade de horários carrega (loading state com spinner)
3. Seleciona horário → se pending, vê aviso; se livre, seleciona direto
4. Ajusta número de pessoas (stepper, mín 1)
5. Preenche telefone
6. Toca "Confirmar reserva"
7. `INSERT INTO reservations` com `status: "pending"`
8. Tela de confirmação com código `#XXXXXX`

---

## Navegação

| Ação | Destino |
|---|---|
| Botão ← | Volta para `/` (ou histórico) |
| Reserva confirmada | Tela de sucesso (mesmo componente) |
| "Voltar ao início" (sucesso) | → `/` |
