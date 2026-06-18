# Reservas — Aba Histórico

**Rota:** `/reservas` → aba Histórico  
**Arquivo:** `src/routes/reservas.tsx`  
**Acesso:** Requer login

---

## Layout — Com histórico

```
┌─────────────────────────────┐
│ SUAS MESAS                  │
│ Reservas histórico          │
│                             │
│ [Próximas] [✦ Club] [Histórico●] │
│                             │
│ ┌─────────────────────────┐ │
│ │ [foto]  Sakura Omakase  │ │
│ │  56×56  Sex, 3 jan 2025 │ │
│ │         20:30 · 2 pess. │ │
│ │                [Concluída]│ │  ← badge verde
│ │         ˅               │ │  ← chevron
│ └─────────────────────────┘ │
│ ┌─── expandido ───────────┐ │
│ │ ✦ Japonês contemporâneo │ │
│ │ 📍 Rua dos Pinheiros... │ │
│ │ 📞 +55 11 4002-8922     │ │
│ │ ✅ 150 pontos creditados │ │  ← só para "completed"
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ [foto]  Atelier Trufa   │ │
│ │         Sáb, 10 dez 24  │ │
│ │         [Cancelada]     │ │  ← badge vermelho
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

## Layout — Estado vazio

```
┌─────────────────────────────┐
│                             │
│          🍽️                 │
│    Sem histórico ainda      │
│  Suas reservas concluídas   │
│      aparecerão aqui.       │
│                             │
└─────────────────────────────┘
```

---

## Query — duas em paralelo + deduplicação

```js
const [byDate, byStatus] = await Promise.all([
  supabase.from("reservations")
    .select("*, restaurants(name, image_url, address, cuisine, rating)")
    .lt("reservation_date", hoje)
    .order("reservation_date", { ascending: false }),

  supabase.from("reservations")
    .select("*, restaurants(name, image_url, address, cuisine, rating)")
    .in("status", ["cancelled", "completed"])
    .order("reservation_date", { ascending: false }),
]);

// Deduplicação por Set de IDs
const seen = new Set();
return combined.filter(r => !seen.has(r.id) && seen.add(r.id));
```

**Por que duas queries?** Uma reserva cancelada antes da data apareceria nas duas se fizéssemos um único OR — o Set garante que cada reserva apareça só uma vez.

---

## PastReservationCard

Card compacto com imagem 56×56, clicável para expandir.

### Badges de status

| Status | Cor | Label |
|---|---|---|
| `completed` | Verde emerald | "Concluída" |
| `cancelled` | Vermelho | "Cancelada" |
| `confirmed` | Primary | "Confirmada" |
| `pending` | Âmbar | "Pendente" |

### Seção expandida (ao clicar)
Animação `height: 0 → auto` com Framer Motion AnimatePresence.

Exibe (se disponível):
- Culinária do restaurante (`✦ Japonês contemporâneo`)
- Endereço com ícone MapPin
- Telefone da reserva (`contact_phone`) com ícone Phone
- Para `completed`: badge verde "150 pontos creditados" com ícone Star
