# Reservas — Aba Club

**Rota:** `/reservas` → aba Club  
**Arquivo:** `src/routes/reservas.tsx`  
**Acesso:** Requer login

---

## Layout — Com bookings

```
┌─────────────────────────────┐
│ SUAS MESAS                  │
│ Reservê Club                │  ← "Club" itálico dourado com ✦
│                             │
│ [Próximas] [✦ Club●] [Histórico] │
│                             │
│ ┌─────────────────────────┐ │
│ │ [foto tipo — h-136]     │ │
│ │ [Mesa do Chef]  #AB3K7M │ │  ← badge tipo (cor accent) + código
│ │  Mesa do Chef — Outono  │ │  ← nome da experiência
│ │  Sakura Omakase         │ │  ← restaurante
│ ├────────┬────────┬────────┤ │
│ │ 📅15 jun│ 🕐20:00│ 👥 2 │ │
│ ├────────┴────────┴────────┤ │
│ │ Total estimado  R$ 700  │ │  ← 2 × R$350
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

## Layout — Estado vazio

```
┌─────────────────────────────┐
│                             │
│          ✦                  │  ← símbolo gold/60
│   Sem experiências          │
│  Você ainda não reservou    │
│  nenhuma experiência Club.  │
│                             │
│  [Explorar experiências]    │  ← navega para /clube
└─────────────────────────────┘
```

---

## Query

```js
supabase.from("experience_bookings")
  .select(`
    *,
    experiences(
      title, type, event_date, event_time, price_per_person,
      restaurants(name, location, image_url)
    )
  `)
  .eq("user_id", user.id)
  .order("created_at", { ascending: false })
```

---

## ExperienceBookingCard

### Imagem
Usa mapa `TYPE_IMAGES` por tipo — imagem padrão do Unsplash para cada categoria de experiência. Sem depender de `image_url` do banco.

### Badge de tipo
Cor e label automáticos pelo `TYPE_ACCENT` e `TYPE_LABELS` mapeados por tipo:
- `chef_table` → "Mesa do Chef" — dourado `#D4A853`
- `private_dinner` → "Jantar Privado" — rosê `#C17B7B`
- `harmonization` → "Harmonização" — lilás `#9B7EC8`
- `tasting_menu` → "Menu Degustação" — verde `#6BAF8E`
- `blind_dinner` → "Mesa às Cegas" — azul `#7B9FC1`

### Código de confirmação
`#AB3K7M` exibido no canto superior direito do hero com fundo preto/40 semi-transparente.

### Total estimado
`party_size × price_per_person` — calculado no client, não armazenado.
