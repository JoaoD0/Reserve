# Signup — Criar Conta

**Rota:** `/signup`  
**Arquivo:** `src/routes/signup.tsx`  
**Acesso:** Público

---

## Layout — Formulário

```
┌─────────────────────────────┐
│ ←                           │
│                             │
│          ( R )              │
│      Crie sua conta         │
│  Reserve em segundos.       │
│  Cancele quando quiser.     │
│                             │
│ ┌─────────────────────────┐ │
│ │ NOME COMPLETO   ↑float  │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ E-MAIL          ↑float  │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ SENHA           ↑float  │ │
│ └─────────────────────────┘ │
│  ⚠ A senha deve ter 8+      │  ← erro inline (vermelho), só se senha < 8
│                             │
│ [      Criar conta        ] │
│                             │
│   Já tem conta? Entrar      │
└─────────────────────────────┘
```

---

## Layout — Confirmação de email (após submit)

```
┌─────────────────────────────┐
│                             │
│       ✉️ (animado)          │  ← ícone Mail em spring animation
│   Verifique seu e-mail      │
│                             │
│  Enviamos um link para      │
│  usuario@email.com          │  ← email em negrito
│  Clique para ativar.        │
│                             │
│ [  ✉ Abrir meu e-mail    ]  │  ← abre mailto:
│                             │
│    Reenviar e-mail          │  ← chama supabase.auth.resend()
└─────────────────────────────┘
```

---

## Validação

- Nome: obrigatório (trim)
- Senha: mínimo 8 chars — erro inline aparece enquanto digita (não espera submit)
- Email: validado pelo Supabase

---

## Fluxo

1. `supabase.auth.signUp({ email, password, options: { data: { full_name } } })`
2. `full_name` vai para `user_metadata` do Supabase Auth → trigger cria `profiles` com esse nome
3. Se `data.session` retornado (email confirmation desativado no Supabase) → navega direto para `/perfil`
4. Se não → mostra tela de "Verifique seu e-mail" com botão de reenvio

---

## Navegação

| Ação | Destino |
|---|---|
| Conta criada com sessão | → `/perfil` (ou redirect param) |
| Sem sessão (email pendente) | → tela de confirmação (mesmo componente, `emailSent = true`) |
| Link "Já tem conta?" | → `/login` |
| Botão ← | → `/` |
