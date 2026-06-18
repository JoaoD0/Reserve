# Home — Descoberta

**Rota:** `/`  
**Arquivo:** `src/routes/index.tsx`  
**Acesso:** Público (funciona logado ou não)

---

## Layout

```
┌─────────────────────────────┐
│ R Reservê    [SP▼] [🔔 2]   │  ← logo + chip de localização + sino com badge
│                             │
│ BOM DIA, JOÃO               │  ← saudação por horário + primeiro nome
│ Onde você quer              │
│ reservar?          ✨       │  ← título display + "reservar?" itálico dourado
│                             │
│ 🔍 Buscar restaurante...⌘K  │  ← search decorativo
│                             │
│ [✨Tudo][🐟Japonês][🍝...] → │  ← chips de categoria (scroll horizontal)
│                             │
│ ┌─────────────────────────┐ │
│ │  🔥 Curadoria           │ │  ← hero card (restaurante destaque)
│ │                         │ │  ← h-230px, foto full
│ │  Esta semana            │ │
│ │  Maré Alta          ⭐4.9│ │
│ │  Frutos do mar · R$200+ │ │
│ │              Reservar → │ │
│ └─────────────────────────┘ │
│                             │
│ Em destaque                 │
│ Casas com horário limitado  │
│ ┌────────┐ ┌────────┐ →     │  ← carrossel horizontal de cards w-230
│ │  foto  │ │  foto  │       │
│ │ Nome   │ │ Nome   │       │
│ │ ⭐ tag │ │ ⭐ tag │       │
│ │ Hoje🕐 │ │       │       │
│ └────────┘ └────────┘       │
│                             │
│ Perto de você               │
│ Em até 15 minutos a pé      │
│ ┌──────────────────────┐    │
│ │[foto] Nome      ⭐ ♡ │    │  ← lista vertical
│ │       tag · preço    │    │
│ │       🚶dist  [Mesas]│    │
│ └──────────────────────┘    │
│                             │
│ ┌ ✦ Reservê Club ─────────┐ │
│ │ Acesso a chefs convidados│ │  ← promo strip com shimmer
│ │ [Conhecer →]            │ │
│ └─────────────────────────┘ │
│                             │
│ [Início●][Reservas][Rec.][👤]│  ← bottom nav
└─────────────────────────────┘
```

---

## Saudação dinâmica

Calculada por hora do sistema:
- `>= 18h` ou `< 5h30` → "Boa noite"
- `>= 12h` → "Boa tarde"
- Resto → "Bom dia"

Usa `user?.user_metadata?.full_name` → pega apenas o primeiro nome (`.split(" ")[0]`). Se não logado: "você".

---

## Categorias de filtro

| Label | Ícone |
|---|---|
| Tudo | Sparkles |
| Japonês | Fish |
| Italiano | UtensilsCrossed |
| Bistrô | Wine |
| Bar | Martini |
| Brunch | Coffee |
| **Próximos a mim** | Navigation (só aparece com GPS ativo) |

O filtro "Próximos a mim" usa a fórmula Haversine para calcular distância em km entre o GPS do usuário e `restaurants.latitude/longitude`. Filtra até 10km.

---

## Cards de restaurante

**Featured card** (carrossel horizontal, w-230px):
- Foto h-150px
- Badge de rating no canto superior direito
- Botão de coração (favoritar) no canto superior esquerdo
- Próximo horário disponível em dourado (`Hoje 20:30`)
- Badge "Reservar" arredondado

**Nearby card** (lista vertical):
- Foto 88×88px, rounded-xl
- Nome, tag, preço
- Distância em texto e badge "Ver mesas"
- `whileTap={{ scale: 0.98 }}` para feedback tátil

---

## Drawers e sheets

**NotificationsDrawer** — abre da direita ao clicar no sino. Contador de não lidos zerado após ver.

**LocationSheet** — bottom sheet para selecionar localização:
- Campo de texto para cidade manual
- Botão "Usar minha localização" (GPS browser)
- Salva em `localStorage` para persistir entre sessões
- Ao confirmar com cidade (sem GPS): categoria "Próximos a mim" fica oculta
- Ao confirmar com GPS: "Próximos a mim" aparece nos chips

---

## Loading state

Dois skeletons animados (`animate-pulse`):
- `FeaturedSkeleton` — 2 cards horizontais com cinza pulsando
- `NearbySkeleton` — 2 cards verticais com cinza pulsando

---

## Navegação de saída

| Elemento | Destino |
|---|---|
| Card de restaurante | → `/restaurante/:id` |
| Link "Conhecer →" (Club) | → `/clube` |
| Bottom nav | → `/`, `/reservas`, `/recompensas`, `/perfil` |
