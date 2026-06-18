# Emails e Notificações

---

## Visão geral

O projeto tem **dois sistemas de email separados** com requisitos diferentes:

| Sistema | Responsável | Precisa de domínio? | Status |
|---------|-------------|---------------------|--------|
| Auth (confirmação de conta, recuperar senha) | Supabase built-in / SMTP | ❌ Não | ✅ Funcional |
| Notificações de reserva (confirmada, recusada) | Edge Function + Resend | ✅ Sim | ⏳ Bloqueado |

---

## Sistema 1 — Emails de Auth (Supabase)

### O que envia
- **Confirm sign up** — link de confirmação de conta após cadastro
- **Reset password** — link para redefinir senha

### Como funciona
1. Supabase envia automaticamente ao chamar `signUp()` ou `resetPasswordForEmail()`
2. O link redireciona para `/auth/callback?code=xxx` (PKCE flow)
3. `auth.callback.tsx` troca o code por sessão via `onAuthStateChange`
4. Para senha: `__root.tsx` ouve `PASSWORD_RECOVERY` → redireciona para `/reset-password`

### Configuração necessária no Supabase Dashboard

#### URL Configuration (Authentication → URL Configuration)
Adicionar em **Redirect URLs**:
- `http://localhost:5173/auth/callback` ← desenvolvimento
- `https://seudominio.com/auth/callback` ← produção (quando houver)

#### SMTP (Authentication → Emails → SMTP Settings)
O plano free do Supabase tem rate limit baixo (~4 emails/hora). Para desenvolvimento sem limite, configurar Gmail SMTP:

| Campo | Valor |
|-------|-------|
| Host | `smtp.gmail.com` |
| Port | `587` |
| User | Gmail do projeto |
| Password | App Password (não a senha normal) |
| Sender name | `Reservê` |

**Gerar App Password:** myaccount.google.com → Segurança → Verificação em duas etapas → Senhas de app

#### Templates customizados (Authentication → Emails → Templates)
Templates com identidade visual do Reservê (fundo cinza, card branco, barra dourada) já criados para:
- ✅ Confirm sign up
- ✅ Reset password

Subject lines:
- Confirm sign up: `Confirme sua conta no Reservê`
- Reset password: `Redefina sua senha — Reservê`

---

## Sistema 2 — Notificações de Reserva (Resend + Edge Function)

### O que envia
- Email ao cliente quando owner **confirma** uma reserva
- Email ao cliente quando owner **recusa** uma reserva

### Arquitetura
```
Owner clica Confirmar/Recusar
  → UPDATE reservations SET status = 'confirmed'/'cancelled'
  → Edge Function notify-reservation disparada (via webhook ou chamada direta)
  → Resend API envia email para o cliente
```

### Status: ⏳ Bloqueado — aguardando domínio

O Resend exige domínio verificado para enviar FROM um endereço customizado (ex: `noreply@reserve.com.br`). Sem domínio:
- Só funciona no modo de teste do Resend
- Só envia para emails verificados manualmente na conta Resend

### O que já está pronto
- Edge Function `notify-reservation` deployada no Supabase
- Lógica de envio implementada

### O que falta
- Domínio próprio verificado no Resend
- Variável `RESEND_API_KEY` configurada nas Edge Functions
- Trigger ou chamada explícita ao atualizar status da reserva

---

## Para domínio próprio (futuro)

Quando o app for para produção com domínio (ex: `reserve.com.br`):

1. **Resend** — adicionar e verificar o domínio → desbloqueia notificações de reserva
2. **Supabase Redirect URLs** — adicionar `https://reserve.com.br/auth/callback`
3. **Supabase Site URL** — atualizar para `https://reserve.com.br`
4. **SMTP sender** — pode trocar de Gmail para `noreply@reserve.com.br`
