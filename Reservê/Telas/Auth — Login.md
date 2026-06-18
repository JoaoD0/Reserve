# Login

**Rota:** `/login`  
**Arquivo:** `src/routes/login.tsx`  
**Acesso:** Público — qualquer pessoa não autenticada

---

## Layout

```
┌─────────────────────────────┐
│ ←                           │  ← botão voltar (navega para /)
│                             │
│          ( R )              │  ← avatar inicial "R" em primary/20
│       Bem-vindo!            │  ← font display, grande
│  Entre para gerenciar       │
│     suas reservas           │  ← subtitle muted
│                             │
│ ┌─────────────────────────┐ │
│ │ E-MAIL          ↑float  │ │  ← FloatingInput (label flutua ao focar)
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ SENHA           ↑float  │ │
│ └─────────────────────────┘ │
│                             │
│ ☑ Manter conectado          │  ← checkbox custom
│              Esqueci senha → │  ← link primary
│                             │
│ [        Entrar           ] │  ← botão full-width pill laranja
│                             │
│  Novo? Criar conta          │  ← link para /signup
└─────────────────────────────┘
```

---

## Componente `FloatingInput`

Input com label animado: quando vazio e sem foco, label fica centralizado no input (placeholder visual). Ao focar ou digitar, label sobe e fica pequeno/uppercase/primary. Definido em `login.tsx` e **exportado** — reutilizado em `signup.tsx`.

---

## Validação

Usa **Zod** antes de chamar o Supabase:
- Email: obrigatório, formato válido, max 255 chars
- Senha: mínimo 6 chars, máximo 72

Erros aparecem como toast.

---

## Fluxo de autenticação

1. `supabase.auth.signInWithPassword({ email, password })`
2. Se erro "Email not confirmed" → toast específico pedindo confirmação de email
3. Salva preferência de sessão:
   - `localStorage("reserve.keepLoggedIn")` → persiste entre abas
   - `sessionStorage("reserve.sessionActive")` → marca sessão ativa
4. Busca `profiles.role` do usuário logado
5. **Redirecionamento por role:**
   - `admin` → `window.location.replace("/admin")`
   - `owner` → `window.location.replace("/owner")`
   - `customer` → navega para o `redirect` param (ou `/`)

O uso de `window.location.replace` (hard redirect) em vez de `navigate()` garante que o painel do owner/admin carregue com estado limpo.

---

## Parâmetro `redirect`

A rota aceita `?redirect=/destino`. Usado quando o usuário tenta acessar uma página protegida sem login — é redirecionado para `/login?redirect=/perfil` e após login vai direto para `/perfil`.

---

## Navegação de entrada/saída

| De onde vem | Para onde vai |
|---|---|
| Qualquer tela com "Entrar" | → login bem-sucedido → `/` ou redirect |
| `perfil.tsx` (não logado) | → `/login?redirect=/perfil` |
| Link "Criar conta" | → `/signup` |
| Link "Esqueci minha senha" | → `/forgot-password` |
| Botão ← | → `/` |
