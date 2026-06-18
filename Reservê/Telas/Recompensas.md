# Recompensas

**Rota:** `/recompensas`  
**Arquivo:** `src/routes/recompensas.tsx`  
**Acesso:** Público para ver, login para resgatar

---

## Layout

```
┌─────────────────────────────┐
│ Recompensas                 │
│ Troque pontos por           │
│ experiências exclusivas     │
│                             │
│ ┌─────────────────────────┐ │
│ │         [glow blur]     │ │  ← efeito de luz no card
│ │ Saldo atual             │ │
│ │                  🏆     │ │
│ │ 1.250               Ouro│ │  ← pontos grandes + tier
│ │ pontos acumulados       │ │
│ │ ─────────────────────── │ │
│ │ Faltam 250 pts p/ Ouro  │ │
│ │ [████████░░░░] 83%      │ │  ← barra de progresso animada
│ │ Prata              Ouro │ │
│ └─────────────────────────┘ │
│                             │
│ ┌────────┐┌────────┐┌──────┐│
│ │📅+150  ││⭐+50   ││👥+200││  ← como ganhar pontos
│ │Reserva ││Avaliação││Indicação│
│ └────────┘└────────┘└──────┘│
│                             │
│ DISPONÍVEIS PARA RESGATAR   │
│ ┌─────────────────────────┐ │
│ │ [⚡] Fila Prioritária   │ │
│ │      Pule a fila...     │ │
│ │      300 pts  [Resgatar]│ │  ← botão só ativo se pts >= 300
│ ├─────────────────────────┤ │
│ │ [%] 10% de Desconto     │ │
│ │      600 pts  [Resgatar]│ │
│ ├─────────────────────────┤ │
│ │ [🔒] Mesa VIP           │ │  ← cadeado se pts insuficientes
│ │      1.200 pts          │ │
│ └─────────────────────────┘ │
│                             │
│ MEUS CUPONS (se existirem)  │
│ ┌─────────────────────────┐ │
│ │ [⚡] Fila Prioritária   │ │
│ │ RSV-PRIO-AB3K7M         │ │  ← código em monospace primary
│ │ Válido até 10 jul 2026  │ │
│ │                    [📋] │ │  ← botão copiar
│ └─────────────────────────┘ │
│                             │
│ [Início][Reservas][Rec.●][👤]│
└─────────────────────────────┘
```

---

## Tiers e progresso

| Tier | Faixa | Cor |
|---|---|---|
| Bronze | 0–499 | Laranja |
| Prata | 500–999 | Cinza claro |
| Ouro | 1.000–4.999 | Dourado |
| Diamante | 5.000+ | Azul |

A barra de progresso é animada com Framer Motion — cresce de 0% até o % correto com delay de 0.2s após montar.

---

## Recompensas disponíveis

| ID | Nome | Pontos | Ícone |
|---|---|---|---|
| `priority` | Fila Prioritária | 300 | Zap (azul) |
| `discount10` | 10% de Desconto | 600 | Percent (verde) |
| `vip` | Mesa VIP | 1.200 | Crown (dourado) |
| `discount20` | 20% de Desconto | 2.500 | BadgePercent (primary) |
| `chef` | Menu do Chef | 5.000 | ChefHat (lilás) |

**Estado visual:**
- Pontos suficientes → ícone colorido, botão "Resgatar" em primary
- Pontos insuficientes → `opacity-50`, ícone substituído por cadeado, botão desabilitado
- Já resgatado → botão "Resgatado" cinza desabilitado

---

## Fluxo de resgate

1. Verifica `points >= reward.points`
2. Gera código: `RSV-TIPO-XXXXXX` via `Math.random()`
3. `INSERT INTO user_rewards` com `expires_at = hoje + 30 dias`
4. `UPDATE profiles SET points = points - reward.points`
5. Invalida caches `["points"]` e `["userRewards"]`

---

## Cupons

Exibidos em "Meus cupons" se `userRewards.length > 0`.  
Botão de copiar: `navigator.clipboard.writeText(code)` → ícone vira ✓ por 2 segundos.

⚠️ Os cupons são gerados mas **não têm validação pelo restaurante**. O campo `is_used` existe no banco mas nunca é marcado como `true`.
