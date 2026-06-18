# Reservê Club — Detalhe e Booking

**Rota:** `/clube/:id`  
**Arquivo:** `src/routes/clube.$id.tsx`  
**Acesso:** Ver = público. Reservar = requer login

---

## Layout — Tela de detalhe

```
┌─────────────────────────────┐
│ [foto hero h-288]           │
│ ←                           │  ← botão voltar flutuante (preto/40)
│                             │
│ [Mesa do Chef]              │  ← badge tipo na cor accent
│ Mesa do Chef — Outono 2026  │  ← título display branco
│ Sakura Omakase              │  ← restaurante branco/55
│                             │
│ ┌──────────────┬───────────┐│
│ │ DATA & HORA  │ VAGAS     ││  ← dois cards lado a lado
│ │ 🕐 15 jun·20:00│👥 4 disp.││
│ └──────────────┴───────────┘│
│                             │
│ SOBRE ESTA EXPERIÊNCIA      │
│ Acompanhe o chef ao vivo... │  ← TYPE_ABOUT automático
│ ✦ Frente à bancada          │  ← TYPE_HIGHLIGHTS (bullets com cor accent)
│ ✦ Conversa direta           │
│ ✦ Menu exclusivo            │
│                             │
│ DETALHES DA NOITE           │  ← só se description ≠ TYPE_ABOUT
│ [descrição customizada DB]  │
│                             │
│ 📍 Rua dos Pinheiros, 1280  │
│                             │
│ QUANTAS PESSOAS?            │
│ [−]        2        [+]     │  ← limitado por available_spots
│ R$ 350/pessoa × 2           │
│                 R$ 700      │  ← total em cor accent
│                             │
│ ─────────── (fixed bottom)  │
│ [  Solicitar · R$ 700    ]  │  ← cor accent sólida, texto preto
└─────────────────────────────┘
```

---

## Layout — Tela de confirmação (após booking)

```
┌─────────────────────────────┐
│                             │
│      ┌───────────┐          │
│      │    ✓      │          │  ← CheckCircle na cor accent
│      └───────────┘          │
│         Solicitado          │
│  Sua experiência foi        │
│  solicitada. O restaurante  │
│  entrará em contato.        │
│                             │
│  ┌ Resumo ───────────────┐  │
│  │ Mesa do Chef — Outono │  │
│  │ Sakura Omakase        │  │
│  │ ───────────────────   │  │
│  │ Data       15 jun     │  │
│  │ Horário    20:00      │  │
│  │ Pessoas    2          │  │
│  │ Total est. R$ 700     │  │
│  │ ───────────────────   │  │
│  │ CÓDIGO                │  │
│  │ #AB3K7M               │  │  ← código em cor accent, tracking wide
│  └───────────────────────┘  │
│                             │
│  [     Voltar ao início   ] │
└─────────────────────────────┘
```

---

## Proteções implementadas

### Booking duplicado
Antes de inserir, verifica se já existe booking para `(user_id, experience_id)`:
```js
supabase.from("experience_bookings")
  .select("id")
  .eq("user_id", user.id)
  .eq("experience_id", id)
  .maybeSingle()
```
Se existir → toast de erro "Você já tem uma reserva para esta experiência."

### Vagas insuficientes
Verifica `partySize > available_spots` antes de submeter.

### Decremento atômico
Após inserir o booking, chama RPC:
```js
supabase.rpc("decrement_experience_spots", { exp_id: id, qty: partySize })
```
Evita race condition — ver [[Técnico/Decisões Técnicas]].

---

## Informações automáticas por tipo

O app não depende apenas do banco — cada tipo tem conteúdo embutido no código:

| Campo | Fonte |
|---|---|
| Imagem hero | `TYPE_IMAGES[type]` → Unsplash (fallback se sem `image_url`) |
| Cor accent | `TYPE_ACCENT[type]` |
| Badge label | `TYPE_LABELS[type]` |
| Texto "Sobre" | `TYPE_ABOUT[type]` |
| Bullets de destaque | `TYPE_HIGHLIGHTS[type]` |

---

## Navegação

| Ação | Destino |
|---|---|
| Botão ← | → `/clube` |
| "Voltar ao início" (sucesso) | → `/` |
