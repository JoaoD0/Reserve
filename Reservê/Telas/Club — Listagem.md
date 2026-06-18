# Reservê Club — Listagem

**Rota:** `/clube`  
**Arquivo:** `src/routes/clube.index.tsx`  
**Acesso:** Público

---

## Layout

```
┌─────────────────────────────┐
│ ← Reservê Club              │  ← header com botão voltar
│                             │
│ ✦ EXPERIÊNCIAS              │  ← label gold uppercase
│ Uma noite             ✦     │
│ inesquecível                │  ← título display
│                             │
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │    [foto tall h-240]    │ │  ← imagem por tipo
│ │                         │ │
│ │  ██████████████████     │  ← gradiente escuro de baixo
│ │  [Mesa do Chef]         │ │  ← badge tipo (cor accent)
│ │  Mesa do Chef — Outono  │ │  ← título
│ │  Sakura Omakase         │ │  ← restaurante
│ │  2 vagas disponíveis    │ │
│ │  A partir de R$ 350/p   │ │  ← preço em dourado
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │    [foto tall h-240]    │ │
│ │  [Harmonização]         │ │
│ │  Noite de Borgonha      │ │
│ │  ...                    │ │
│ └─────────────────────────┘ │
│                             │
│ [Início][Reservas][Rec.][👤]│
└─────────────────────────────┘
```

---

## Query

```js
supabase.from("experiences")
  .select("*, restaurants(name, image_url, location, address)")
  .eq("is_active", true)
  .gte("event_date", hoje)
  .order("event_date", { ascending: true })
```

Só mostra experiências ativas com datas futuras.

---

## Cards

Cada card é totalmente clicável — navega para `/clube/:id`.

**Camadas visuais da imagem:**
1. Foto `object-cover` h-240
2. Gradiente `from-black/90 via-black/40 to-black/10` (de baixo para cima)
3. Gradiente adicional no topo `to-black/30` para legibilidade do badge

**Conteúdo sobreposto na imagem:**
- Badge de tipo (cor + borda accent, backdrop-blur)
- Título em branco, font display
- Nome do restaurante em branco/55 (opaco)

**Rodapé do card (fundo card):**
- Vagas disponíveis com ícone Users
- "A partir de R$ X/pessoa" em dourado

---

## Estado vazio

Se não há experiências ativas:
```
          ✦
  Nenhuma experiência
  disponível no momento.
  Novas experiências em breve.
```

---

## Navegação

| Ação | Destino |
|---|---|
| Clicar no card | → `/clube/:id` |
| Botão ← | → `/` |
