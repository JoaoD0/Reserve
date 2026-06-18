# Perfil

**Rota:** `/perfil`  
**Arquivo:** `src/routes/perfil.tsx`  
**Acesso:** Requer login (mostra gate de login se não autenticado)

---

## Layout — Logado

```
┌─────────────────────────────┐
│ R Reservê                   │
│                             │
│         [blur glow]         │
│       ┌─────────┐           │
│       │  J V    │  ← avatar (iniciais ou foto)
│       └─────────┘           │
│          [📷]               │  ← botão câmera sobreposto (upload)
│                             │
│       João Vitor            │  ← full_name
│  joao@email.com             │  ← email muted
│                             │
│  🥉 Membro Bronze           │  ← badge tier dinâmico
│                             │
│ ┌────────┬────────┬────────┐ │
│ │   12   │   5    │  450   │ │  ← Reservas / Favoritos / Pontos
│ │RESERVAS│FAVORIT.│PONTOS  │ │
│ └────────┴────────┴────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 👤 Meus dados        ›  │ │
│ ├─────────────────────────┤ │
│ │ ♡ Restaurantes favorit.›│ │
│ ├─────────────────────────┤ │
│ │ 🔔 Notificações       › │ │
│ ├─────────────────────────┤ │
│ │ ❓ Ajuda & suporte    › │ │
│ ├─────────────────────────┤ │
│ │ 🚪 Sair                 │ │  ← vermelho
│ └─────────────────────────┘ │
│                             │
│       Reservê · v1.0        │
│                             │
│ [Início][Reservas][Rec.][👤●]│
└─────────────────────────────┘
```

---

## Avatar

- Se `profiles.avatar_url` existe → exibe `<img>` com `object-cover`
- Se não → exibe iniciais calculadas por `getInitials(fullName, email)`:
  - Nome com 2+ palavras: primeira letra + última letra (ex: "João Vitor" → "JV")
  - Nome com 1 palavra: primeiras 2 letras
  - Sem nome: primeira letra do email

Halo animado em volta do avatar: `bg-gradient-to-tr from-primary via-gold to-primary opacity-70 blur-md` com `position: absolute -inset-1`.

**Botão câmera** (posição `absolute bottom-0 right-0`):
- Ícone Camera pequeno em fundo primary
- Clique aciona `fileInputRef.current?.click()`
- Input hidden `type="file" accept="image/*"`
- Durante upload: spinner no lugar do ícone câmera

**Fluxo de upload:**
1. Usuário seleciona imagem da galeria
2. Upload para Supabase Storage `avatars/{user_id}/avatar.{ext}` (upsert)
3. Pega URL pública + adiciona `?t=timestamp` (cache bust)
4. `UPDATE profiles SET avatar_url = url`
5. Invalida `["profile", user.id]` → UI atualiza

---

## Badge de Tier

Dinâmico baseado em `profiles.points` (função `getTier()` em `perfil.tsx`):

| Tier | Pontos | Badge |
|---|---|---|
| Bronze 🥉 | 0–499 | `border-orange-700/40 bg-orange-900/20 text-orange-400` |
| Prata 🥈 | 500–999 | `border-slate-500/40 bg-slate-700/20 text-slate-300` |
| Ouro 🥇 | 1.000–4.999 | `border-yellow-600/40 bg-yellow-900/20 text-yellow-400` |
| Diamante 💎 | 5.000+ | `border-cyan-700/40 bg-cyan-900/20 text-cyan-400` |

Thresholds iguais ao `recompensas.tsx` — unificados em v2.7.

---

## Gate sem login

```
┌─────────────────────────────┐
│         ( R )               │
│   Faça login para continuar │
│  Acesse seu perfil e        │
│  gerencie suas reservas.    │
│                             │
│  [         Entrar         ] │
│  [      Criar conta       ] │
└─────────────────────────────┘
```

---

## Navegação

| Elemento | Destino |
|---|---|
| "Meus dados" | → `/perfil/dados` |
| "Restaurantes favoritos" | → `/perfil/favoritos` |
| "Notificações" | → `/perfil/notificacoes` |
| "Ajuda & suporte" | → `/perfil/ajuda` |
| "Sair" | `signOut()` → redireciona para `/` |
