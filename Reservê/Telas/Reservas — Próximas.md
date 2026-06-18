# Reservas — Aba Próximas

**Rota:** `/reservas` (aba padrão)  
**Arquivo:** `src/routes/reservas.tsx`  
**Acesso:** Público para ver (mostra mock se não logado), dados reais com login

---

## Layout — Com reservas

```
┌─────────────────────────────┐
│ R Reservê                   │
│                             │
│ SUAS MESAS                  │
│ Reservas próximas           │  ← "próximas" itálico dourado
│                             │
│ [Próximas●] [ ✦ Club ] [Histórico] │
│                             │
│ ┌─────────────────────────┐ │
│ │ [foto restaurante h-140]│ │
│ │              ●Confirmada│ │  ← badge verde
│ │              [♡]        │ │  ← favoritar
│ │ Sakura Omakase          │ │
│ │ Rua dos Pinheiros, Jard.│ │
│ ├──────────┬──────┬───────┤ │
│ │ 📅Sex 16 │ 🕐20:30│👥2 │ │  ← stats row
│ ├──────────┴──────┴───────┤ │
│ │ Pratos do restaurante ↓ │ │  ← expansível (só se dishes > 0)
│ ├─────────────────────────┤ │
│ │[Detalhes][Reagendar][···]│ │
│ └─────────────────────────┘ │
│                             │
│ [Início][Reservas●][Rec.][👤]│
└─────────────────────────────┘
```

---

## Layout — Estado vazio

```
┌─────────────────────────────┐
│ ...tabs...                  │
│                             │
│          🍽️                 │
│   Sem reservas próximas     │
│  Você ainda não tem nenhuma │
│    reserva agendada.        │
│                             │
│   [Explorar restaurantes]   │  ← navega para /
└─────────────────────────────┘
```

---

## Query

```js
supabase.from("reservations")
  .select("*, restaurants(name, image_url, address, cuisine, rating)")
  .in("status", ["confirmed", "pending"])
  .gte("reservation_date", hoje)   // ← filtro essencial, adicionado em v2.4
  .order("reservation_date", { ascending: true })
```

---

## ReservationCard

### Badges de status
| Status | Visual |
|---|---|
| `confirmed` | Fundo primary, texto branco — "● Confirmada" |
| `pending` | Fundo gold/20, borda gold, texto gold — "● Aguardando" |

### Menu `···` (MoreHorizontal)
Abre popover animado com 3 opções:
- Compartilhar (sem ação implementada)
- Lembrete (sem ação implementada)
- **Cancelar reserva** — fecha menu + `UPDATE status='cancelled'` + invalidate query + toast (v2.8)

### Modal de Detalhes
Bottom sheet com:
- Foto do restaurante h-200
- Culinária em gold, nome, rating, bairro
- Stats: data / hora / pessoas
- Endereço e telefone com ícones
- Lista de pratos (se existirem)
- **Confirmar presença** (v2.8): `UPDATE status='confirmed'` + fecha modal + toast — só aparece quando status é "Aguardando"; quando já confirmada exibe "✓ Confirmada" desabilitado

### Modal de Reagendamento
Bottom sheet com:
- Chips de data: gerados por `buildRescheduleDays()` via `useMemo` — até 60 dias / 2 meses
- Grade de horários fixos: `["19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"]`
- Resumo: data selecionada + horário em dourado
- Botão confirmar → UPDATE no banco + fecha modal

---

## Gate de autenticação

Se Supabase configurado + usuário não logado: mostra tela de login com botões "Entrar" e "Criar conta".

Se Supabase não configurado: mostra dados mock (`upcomingSeed`) com 2 restaurantes fictícios.
