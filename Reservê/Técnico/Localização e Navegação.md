# Localização e Navegação dos Restaurantes

> Estratégia para mostrar a localização do restaurante e oferecer rota GPS ao usuário.

---

## Visão geral

O app tem duas necessidades distintas de localização:

| Necessidade | Onde | Prioridade |
|-------------|------|------------|
| Mostrar onde o restaurante fica | Tela do restaurante (`/restaurante/$id`) | Alta |
| Guiar o usuário até lá | Mesmo lugar + tela da reserva (`/reservas`) | Alta |

A abordagem escolhida é **híbrida**: um mapa estático embutido na tela do restaurante para contexto visual + botão para abrir o GPS nativo do celular do usuário.

---

## Estratégia adotada: Mapa estático + deep link para GPS nativo

### Por que não implementar GPS dentro do app?

- Navegação turn-by-turn dentro do browser exigiria uma API de rotas (Google Maps Platform, Mapbox) — tem custo e complexidade alta
- O usuário já tem Google Maps, Apple Maps ou Waze instalado — redirecionar é mais confiável e familiar
- Para um app mobile-first, o redirecionamento para o GPS nativo é a UX padrão do mercado (iFood, Uber Eats, Rappi fazem isso)

### O que será implementado

1. **Mapa estático embutido** — visualização da localização sem interação (só contexto)
2. **Botão "Como chegar"** — abre o GPS nativo do celular com destino pré-preenchido
3. **Fallback inteligente por OS** — Android abre Google Maps, iOS abre Apple Maps

---

## Banco de dados: o que adicionar na tabela `restaurants`

Adicionar duas colunas na tabela `restaurants`:

```sql
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS latitude  NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS address   TEXT;
```

- `latitude` e `longitude`: coordenadas precisas para o mapa e para o deep link
- `address`: endereço formatado ("Rua Augusta, 1492 — Consolação, São Paulo") para exibir na UI

**Alternativa sem coordenadas:** se só tiver o endereço textual, o deep link para Google Maps aceita busca por texto (`q=Rua+Augusta+1492+SP`). Funciona, mas menos preciso.

---

## Mapa embutido: OpenStreetMap via iframe (grátis, sem API key)

Para mostrar o mapa sem custo nenhum, usar o OpenStreetMap embed:

```tsx
function MapEmbed({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005},${lat - 0.005},${lng + 0.005},${lat + 0.005}&layer=mapnik&marker=${lat},${lng}`;
  return (
    <iframe
      src={src}
      title={`Localização de ${name}`}
      className="w-full h-48 rounded-2xl border border-border/40"
      loading="lazy"
    />
  );
}
```

**Alternativa gratuita:** Leaflet.js com tiles do OpenStreetMap — mais customizável, mas adiciona ~140 kB ao bundle. Usar import() dinâmico se adotar Leaflet.

---

## Botão "Como chegar": deep link inteligente por OS

```tsx
function getDirectionsUrl(lat: number, lng: number, name: string): string {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    // Apple Maps
    return `maps://maps.apple.com/?daddr=${lat},${lng}&q=${encodeURIComponent(name)}`;
  }
  // Google Maps — funciona em Android e desktop
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_name=${encodeURIComponent(name)}`;
}
```

Uso no componente:

```tsx
<a
  href={getDirectionsUrl(restaurant.latitude, restaurant.longitude, restaurant.name)}
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center gap-2 h-12 rounded-full bg-primary text-primary-foreground font-bold px-5"
>
  <Navigation size={16} /> Como chegar
</a>
```

**Deep links suportados:**
| App | URI | Funciona em |
|-----|-----|-------------|
| Apple Maps | `maps://` | iOS Safari |
| Google Maps | `https://maps.google.com/dir/` | Android, iOS, Desktop |
| Waze | `waze://` | Se Waze instalado |

Para Waze como terceira opção, adicionar botão separado:
```
https://waze.com/ul?ll={lat},{lng}&navigate=yes
```

---

## Fallback: só endereço textual (sem coordenadas)

Se o restaurante só tiver endereço (`address` como texto), o deep link vira busca por texto:

```tsx
function getDirectionsUrlFromAddress(address: string): string {
  const query = encodeURIComponent(address);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) return `maps://maps.apple.com/?q=${query}`;
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
```

Funciona bem para endereços únicos; pode ter ambiguidade em endereços genéricos.

---

## Onde colocar na UI

### Tela do restaurante (`/restaurante/$id`)

Logo abaixo das tabs (Cardápio / Reservar), antes do conteúdo principal:

```
┌─────────────────────────────┐
│ [Mapa 192px height]         │
│                             │
│ 📍 Rua Augusta, 1492 · SP  │
│ [  Como chegar  ] [  Waze  ]│
└─────────────────────────────┘
```

### Tela de reservas (`/reservas`) — card de reserva ativa

Adicionar um link discreto "Ver no mapa" ou "Como chegar" no card de cada reserva próxima.

---

## Passo a passo de implementação

1. **SQL:** rodar `ALTER TABLE restaurants ADD COLUMN latitude/longitude/address`
2. **Admin/Owner:** adicionar campos de lat/lng/address nos formulários do owner
3. **Componente `MapEmbed`:** criar `src/components/MapEmbed.tsx`
4. **Função `getDirectionsUrl`:** criar em `src/lib/utils/location.ts`
5. **Tela restaurante:** inserir mapa + botão na seção de detalhes
6. **Tela reservas:** adicionar link "Como chegar" nos cards de reservas próximas

---

## Custo e dependências

| Solução | Custo | Dependência externa |
|---------|-------|---------------------|
| OpenStreetMap iframe | Grátis | Nenhuma (API pública) |
| Leaflet.js + OSM tiles | Grátis | npm `leaflet` (~140 kB) |
| Google Maps Embed API | Grátis até 28k/mês | API key obrigatória |
| Google Maps Platform (rotas) | Pago por uso | API key + billing |

**Recomendação para MVP:** OpenStreetMap iframe + deep link para GPS nativo. Zero custo, zero dependências novas.
