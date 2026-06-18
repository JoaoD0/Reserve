# Stack e Arquitetura

## Visão geral

O Reservê é uma SPA (Single Page Application) mobile-first construída em React com roteamento client-side. O backend é inteiramente gerenciado pelo Supabase — sem servidor Node próprio.

---

## Stack completa

| Camada | Tecnologia | Por quê |
|---|---|---|
| Framework UI | **React 19** + TypeScript | Ecossistema maduro, tipagem forte |
| Build | **Vite** | Dev server rápido, HMR instantâneo |
| Roteamento | **TanStack Router** (file-based) | Type-safe, roteamento baseado em arquivos como Next.js, mas client-side |
| Fetch / Cache | **TanStack Query** | Cache automático, invalidação, loading states, sem Redux |
| Backend | **Supabase** | Postgres + Auth + Storage + Edge Functions num só lugar |
| Estilo | **Tailwind CSS v4** | Utilitários, sem CSS manual, dark mode nativo |
| Animações | **Framer Motion** | Transições fluidas, layout animations, AnimatePresence |
| Toasts | **Sonner** | Leve, estilizado, fácil |
| Ícones | **Lucide React** | Consistente, tree-shakeable |

---

## Estrutura de arquivos

```
c:\Users\joaov\Downloads\reservê\
├── src/
│   ├── routes/              ← cada arquivo = uma rota (TanStack Router)
│   ├── components/          ← componentes reutilizáveis
│   ├── lib/
│   │   ├── supabase.ts      ← client Supabase (retorna null se não configurado)
│   │   ├── data.ts          ← utilitários (haversineKm, etc.)
│   │   └── hooks/
│   │       ├── useAuth.ts   ← user, loading, signOut, role, restaurantId
│   │       ├── useFavorites.ts
│   │       └── useRestaurants.ts
│   └── assets/              ← imagens locais
├── supabase/
│   └── functions/           ← Edge Functions (Deno)
│       └── notify-reservation/
├── .env.local               ← VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
├── .gitignore
├── tsconfig.json
├── vite.config.ts
└── Reservê/                 ← este cofre Obsidian
```

---

## Rotas do app

### App mobile (usuário)
| Arquivo | Rota | Descrição |
|---|---|---|
| `index.tsx` | `/` | Home — descoberta de restaurantes |
| `restaurante.$id.tsx` | `/restaurante/:id` | Página do restaurante + booking |
| `reservas.tsx` | `/reservas` | Minhas reservas (3 abas) |
| `clube.tsx` | `/clube` | Layout pai do Club (só Outlet) |
| `clube.index.tsx` | `/clube` | Listagem de experiências |
| `clube.$id.tsx` | `/clube/:id` | Detalhe + booking da experiência |
| `recompensas.tsx` | `/recompensas` | Pontos, tiers, cupons |
| `perfil.tsx` | `/perfil` | Perfil (layout pai) |
| `perfil.dados.tsx` | `/perfil/dados` | Editar nome/email |
| `perfil.favoritos.tsx` | `/perfil/favoritos` | Restaurantes favoritados |
| `perfil.notificacoes.tsx` | `/perfil/notificacoes` | Preferências de notificação |
| `perfil.ajuda.tsx` | `/perfil/ajuda` | FAQ + contato + toggle Breno |

### Auth
| Arquivo | Rota |
|---|---|
| `login.tsx` | `/login` |
| `signup.tsx` | `/signup` |
| `onboarding.tsx` | `/onboarding` |
| `forgot-password.tsx` | `/forgot-password` |
| `reset-password.tsx` | `/reset-password` |
| `auth.callback.tsx` | `/auth/callback` |

### Painel Owner
| Arquivo | Rota |
|---|---|
| `owner.tsx` | `/owner` (layout) |
| `owner.index.tsx` | `/owner/` (dashboard) |
| `owner.reservas.tsx` | `/owner/reservas` |
| `owner.experiencias.tsx` | `/owner/experiencias` |

### Painel Admin
| Arquivo | Rota |
|---|---|
| `admin.tsx` | `/admin` (layout) |
| `admin.index.tsx` | `/admin/` |
| `admin.restaurantes.tsx` | `/admin/restaurantes` |
| `admin.reservas.tsx` | `/admin/reservas` |
| `admin.proprietarios.tsx` | `/admin/proprietarios` |

---

## Componentes globais

| Componente | Função |
|---|---|
| `MobileShell` | Wrapper de toda página mobile — `max-w-md`, `mx-auto`, safe areas do iOS |
| `BottomNav` | Barra de navegação inferior com 4 ícones (Home, Reservas, Club, Perfil) |
| `BrenoChat` | Assistente IA flutuante — botão no canto que abre um chat |
| `NotificationsDrawer` | Drawer lateral de notificações (abre da direita) |
| `LocationSheet` | Bottom sheet para selecionar cidade ou usar GPS |
| `Logo` | Logotipo "Reservê" reutilizável |

---

## Como o roteamento funciona (TanStack Router file-based)

Cada arquivo em `src/routes/` vira uma rota automaticamente:
- `index.tsx` → `/`
- `restaurante.$id.tsx` → `/restaurante/:id` (parâmetro dinâmico)
- `perfil.tsx` → layout pai de `/perfil/**`
- `perfil.dados.tsx` → rota filha `/perfil/dados`

**Regra crítica aprendida:** Se um arquivo é pai de rotas filhas (ex: `clube.tsx`), ele **precisa ter `<Outlet />`** no componente — caso contrário, as rotas filhas nunca renderizam. Foi exatamente o bug que fez `/clube/:id` não abrir nada quando clicado. A solução foi separar o `clube.tsx` em três arquivos:
- `clube.tsx` → só `<Outlet />` (layout puro)
- `clube.index.tsx` → listagem
- `clube.$id.tsx` → detalhe

---

## Fluxo de dados

```
Componente React
    ↓ useQuery / useMutation (TanStack Query)
    ↓ supabase.from("tabela")... (Supabase JS Client)
    ↓ HTTP para o endpoint REST do Supabase
    ↓ PostgREST → Postgres
    ↓ RLS filtra as linhas conforme o JWT do usuário
    ↓ dados voltam → cache do TanStack Query → re-render
```

---

## Variáveis de ambiente

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

**A `anon key` é pública** — fica no bundle JS do browser por design do Supabase. A segurança dos dados não vem de esconder essa chave, mas das políticas RLS no banco. A `service_role` key (que bypassa RLS) fica apenas nas Edge Functions via `Deno.env.get()` e nunca chega ao client.

Ver [[Banco de Dados e Segurança]] para detalhes das políticas RLS.
