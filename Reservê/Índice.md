# Reservê — Documentação do Projeto

> App mobile-first de reservas em restaurantes premium com experiências exclusivas.

---

## 📱 Telas

### Autenticação
- [[Auth — Login]] — login com email/senha, redirecionamento por role
- [[Auth — Signup]] — cadastro + confirmação de email
- [[Auth — Onboarding]] — 2 slides de boas-vindas para novos usuários

### App principal
- [[Home]] — descoberta de restaurantes, filtros, localização GPS
- [[Restaurante]] — detalhe do restaurante, calendário, horários, booking
- [[Reservas — Próximas]] — reservas ativas com reagendamento e detalhes
- [[Reservas — Histórico]] — reservas passadas expandíveis com pontos
- [[Reservas — Club]] — bookings de experiências do usuário
- [[Club — Listagem]] — catálogo de experiências exclusivas
- [[Club — Detalhe e Booking]] — detalhe + fluxo de reserva de experiência
- [[Recompensas]] — pontos, tiers, resgatar cupons

### Perfil
- [[Perfil]] — avatar, tier, stats, menu
- [[Perfil — Notificações]] — preferências de notificação + histórico mock
- [[Perfil — Ajuda]] — FAQ, busca, toggle Breno, contatos

---

## ⚙️ Técnico
- [[Stack e Arquitetura]] — stack completa, estrutura de pastas, roteamento
- [[Banco de Dados e Segurança]] — tabelas, RLS, triggers, funções SQL
- [[Decisões Técnicas]] — por que cada escolha foi feita
- [[Bugs e Pendências]] — bugs ativos, SQL pendente, melhorias
- [[Emails e Notificações]] — dois sistemas de email, SMTP, Resend, templates, configuração Supabase
- [[Localização e Navegação]] — estratégia de mapa embutido + deep link para GPS nativo (Google Maps / Apple Maps / Waze)

---

## 🍽️ Sistemas
- [[Reservê Club]] — visão completa do sistema de experiências
- [[Sistema de Pontos e Recompensas]] — tiers, trigger, resgates
- [[Painéis Owner e Admin]] — gestão pelo restaurante e admin global

---

## Resumo do projeto

| | |
|---|---|
| Última versão | **v2.24** |
| Status | Funcional — desenvolvimento ativo |
| Deploy | Não deployado em produção |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions) |
| Stack | React 19 + TypeScript + Vite + TanStack Router/Query + Tailwind |

## Fluxo de versões

| Versão | O que entrou |
|---|---|
| v1.x | Base completa — home, auth, perfil, owner, admin |
| v2.0–2.3 | Reservê Club completo — listagem, detalhe, booking, histórico real |
| v2.4 | Reagendamento real no banco, disponibilidade real por data |
| v2.5 | Calendário mensal com navegação de 2 meses |
| v2.6 | Horários em disputa (pending em amarelo com aviso) |
| v2.7 | Tier dinâmico, avatar upload, histórico expandido |
| v2.8 | Cancelar reserva funcional, confirmar presença, FK hint owner |
| v2.9 | TypeScript limpo — search param em todos os links para /login e /signup |
| v2.10 | Remove mock data, auth gate universal, reagendar invalida query |
| v2.11 | Validação de cupons pelo owner — busca, detalhes, marcar como usado |
| v2.12 | QR code nos cupons — botão QR em cada cupom, bottom sheet com QR code |
| v2.13 | Scanner de câmera no owner — escaneia QR do cliente direto no app |
| v2.14 | Ajuda: contatos falsos removidos, suporte redirecionado para o Breno (IA) |
| v2.15 | Histórico de reservas: código de confirmação, stats row, valor gasto (—) |
| v2.16 | html5-qrcode carregado via import() dinâmico — chunk owner.cupons: 991 kB → 9 kB |
| v2.17 | Recuperação de senha: listener PASSWORD_RECOVERY no root redireciona para /reset-password |
| v2.18–2.19 | Owner redesign completo: dashboard, sidebar, reservas, experiências, cupons |
| v2.20 | Logo real (R + garfo dourado, gerada no Pippit) integrada ao app e componente Logo.tsx |
| v2.21 | Favicon SVG com logo + metadados corrigidos (título, description, theme-color) |
| v2.22 | Busca funcional na home, contagem de reservas por usuário, favoritos por ID, badge zerado, ícone Bar corrigido |
| v2.23 | Upload de avatar em Meus Dados funcional; confirmação antes de excluir experiência |
| v2.24 | Fluxo de reserva sem botões duplicados, bottom bar com lógica correta por step, navigate() no login, versão atualizada |
| v2.25 | auth/callback: race condition PKCE corrigida com onAuthStateChange + timeout fallback |
| v2.26 | Recuperar senha: botão reenviar com countdown 15s + mensagem amigável no rate limit |
