# Perfil — Notificações

**Rota:** `/perfil/notificacoes`  
**Arquivo:** `src/routes/perfil.notificacoes.tsx`  
**Acesso:** Requer login

---

## Layout

```
┌─────────────────────────────┐
│ ←  Notificações  Marcar lidas│
│                             │
│ PREFERÊNCIAS                │
│ ┌─────────────────────────┐ │
│ │🔔 Lembrete de reserva   │ │
│ │   Lembretes antes...    ● │ │  ← toggle ON (primary)
│ ├─────────────────────────┤ │
│ │🏷 Promoções e descontos  │ │
│ │   Ofertas exclusivas... ● │ │  ← toggle ON
│ ├─────────────────────────┤ │
│ │📍 Restaurantes novos    │ │
│ │   Quando novos lugares..○ │ │  ← toggle OFF
│ ├─────────────────────────┤ │
│ │✨ Novidades do app      │ │
│ │   Updates e funcion...  ○ │ │  ← toggle OFF
│ └─────────────────────────┘ │
│                             │
│ RECENTES                    │
│ ┌─────────────────────────┐ │
│ │🔔 Reserva confirmada!   ●│ │  ← não lida: bg primary/5 + dot
│ │   Sua reserva no Cipri..│ │
│ │                  há 5min│ │
│ ├─────────────────────────┤ │
│ │🏷 Oferta exclusiva      ●│ │
│ ├─────────────────────────┤ │
│ │📍 Novo restaurante      │ │  ← lida: sem destaque
│ ├─────────────────────────┤ │
│ │📢 Avalie sua última...  │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

## Preferências

4 toggles salvos em `profiles.notification_prefs` (coluna JSONB):

| Key | Label | Padrão |
|---|---|---|
| `reserva` | Lembrete de reserva | `true` |
| `promocoes` | Promoções e descontos | `true` |
| `novos` | Restaurantes novos | `false` |
| `novidades` | Novidades do app | `false` |

**Atualização otimista:** ao trocar o toggle, o estado local atualiza imediatamente via `qc.setQueryData` antes da query terminar. Se a query falhar, o erro aparece como toast.

**Persistência:** `upsert` em `profiles` com o objeto `notification_prefs` completo.

---

## Notificações recentes

Lista de 4 notificações **mockadas** (`SAMPLE_NOTIFICATIONS`). Não vêm do banco.

**Estado de leitura:**
- Não lidas: fundo `bg-primary/5`, título em `font-bold`, ponto laranja no canto
- Lidas: sem destaque visual
- Clicar marca como lida (atualiza `readIds` via `useState<Set<string>>`)
- "Marcar todas como lidas" → adiciona todos os IDs ao Set

⚠️ **As notificações são 100% mock** — não há entrega real de email/push ainda. As preferências são salvas mas ignoradas.

---

## Toggle

Componente `Toggle` interno: `role="switch"`, `aria-checked`. Transição CSS suave de posição (translateX) e cor de fundo.

---

## Navegação

| Ação | Destino |
|---|---|
| Botão ← | → `/perfil` |
