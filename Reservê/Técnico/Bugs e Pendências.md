# Bugs e Pendências

---

## 🔴 Bugs funcionais

*(nenhum bug funcional pendente)*

---

## 🟡 Dados mock / hardcoded a substituir

| Item | Arquivo | Detalhe |
|------|---------|---------|

---

## 🟠 UX a melhorar

| Item | Arquivo | Detalhe |
|------|---------|---------|
| Owner panel sem responsividade mobile | `owner.tsx` | Sidebar fixa 240px — inutilizável em celular |
| Admin panel sem responsividade mobile | `admin.tsx` | Mesmo problema |
| Botão voltar do Clube vai para home | `clube/index.tsx` | `navigate({ to: "/" })` em vez de `navigate({ back: true })` |
| Onboarding não redireciona novos usuários | `onboarding.tsx` | Flag `reserve_onboarded` salva mas nunca lida para redirecionar |
| Breno ativa globalmente ao clicar em "Conversar" | `perfil.ajuda.tsx` | UX indireta — deveria abrir o chat direto |
| CPF aceita valores inválidos | `perfil.dados.tsx` | Só mascara, não valida dígito verificador |
| Data de nascimento salva como string `DD/MM/YYYY` | `perfil.dados.tsx` | Deveria ser ISO `DATE` para queries de idade |
| QR modal não bloqueia scroll do fundo | `recompensas.tsx` | Background scrollável ao abrir QR |
| Cor do botão CTA no Club fixada como `color: "#000"` | `clube/$id.tsx` | Pode ter contraste ruim com cores claras de accent |
| Owner stats "Hoje" inclui canceladas e pendentes | `owner.index.tsx` | Deveria contar só confirmadas |
| Gênero "outro" confundido com "prefiro não informar" | `perfil.dados.tsx` | `value="outro"` para "Prefiro não informar" — semanticamente errado |

---

## 🗺️ Mapa / Localização (v2.40)

- Tela do restaurante: mapa OSM embutido + botão "Como chegar" (Google Maps / Apple Maps por OS)
- Modal de detalhes de reserva: botão "Como chegar" via endereço
- `/owner/configuracoes`: owner preenche CEP → ViaCEP busca endereço → Nominatim geocoda lat/lng automaticamente
- SQL aplicado: `latitude NUMERIC(10,7)`, `longitude NUMERIC(10,7)` em `restaurants`

---

## 🔵 Melhorias de produto (backlog)

- **Busca funcional na home** — filtrar restaurantes por nome/culinária em tempo real
- **Owner panel responsivo** — sidebar colapsável em mobile (hamburger menu)
- **Aprovação/recusa de experience bookings no owner** — fluxo completo (hoje a experiência fica no limbo)
- **Edição de experiências** — hoje só cria e exclui, não edita
- **Paginação nas reservas do owner** — sem paginação, vai degradar com muitas reservas
- **Notificações reais** — Edge Function `notify-reservation` deployada mas bloqueada por domínio (Resend)
- **Persistência do histórico de chat do Breno** — reinicia ao fechar
- **Onboarding rico** — incluir Clube, Recompensas e Breno no fluxo; e auto-redirecionar novos usuários
- **`reservation_items`** — tabela para registrar pratos e total de cada reserva (habilita "Valor gasto")
- **Detecção de câmera no owner** — mostrar botão Camera só se `navigator.mediaDevices` detectar câmera
- **Meta `theme-color`** — barra do navegador em mobile sem cor definida
- **Histórico de chat do Breno** — contexto perdido ao fechar/reabrir

---

## 💡 Ideias futuras (não implementadas)

### Validação de cupons adaptativa para PC (bipador USB)
Detectar via `navigator.mediaDevices.enumerateDevices()` se há câmera, e mostrar botão só se sim. Para bipadores USB (emulam teclado), detectar velocidade de digitação (`< 30ms entre chars`) e auto-submeter. Ver detalhes completos no histórico de conversa.

---

## ✅ Resolvidos (histórico)

| Bug | Versão | Descrição |
|-----|---------|---------|
| Club page em branco ao clicar | v2.3.2 | `clube.tsx` sem `<Outlet />` |
| Crash `pastaImg` | v2.3.1 | Import removido mas variável ainda usada |
| `ReferenceError: past is not defined` | v2.3.2 | Array `past` removido mas JSX ainda o usava |
| Reservas passadas em "Próximas" | v2.4 | Query sem filtro `reservation_date >= hoje` |
| Datas stale na virada de ano | v2.4.2 | Constante de módulo → `useMemo` |
| Race condition em vagas | v2.3 | RPC com `GREATEST` |
| Booking duplicado de experiência | v2.3 | Guard antes do insert |
| FK error ao deletar experiência | v2.6 | Delete de `experience_bookings` antes de `experiences` |
| Tabelas sem RLS | pós-v2.3 | RLS habilitado nas 5 tabelas críticas |
| Cancelar reserva sem ação | v2.8 | UPDATE + invalidateQueries |
| "Confirmar presença" sem onClick | v2.8 | UPDATE status=confirmed |
| Owner 400 em profiles join | v2.8 | FK hint adicionado |
| Inconsistência de tier | v2.7 | Ouro unificado em 1000+ |
| avatar_url sem coluna | v2.7 | ALTER TABLE + bucket |
| TypeScript errors (search param) | v2.9 | `search: { redirect }` em todos os links |
| Mock data em reservas | v2.10 | `upcomingSeed` removido |
| Cupons sem validação | v2.11 | `/owner/cupons` com busca e marcar como usado |
| QR code nos cupons | v2.12–v2.13 | Bottom sheet com QR, scanner de câmera no owner |
| Contatos fictícios na ajuda | v2.14 | Redirecionado para o Breno |
| Histórico básico demais | v2.15 | Código de confirmação, stats row, valor gasto (—) |
| Chunk size excessivo no owner | v2.16 | `html5-qrcode` em import() dinâmico |
| Link de recuperação de senha ia para home | v2.17 | Listener `PASSWORD_RECOVERY` no root |
| Dashboard owner sem design | v2.18 | Saudação, cards coloridos, avatars, animações |
| Painel owner visualmente básico | v2.19 | Sidebar, reservas, experiências e cupons redesenhados |
| Busca na home não funciona | v2.22 | `onChange` + filtro por nome/culinária/bairro implementado |
| `reservationCount` conta todos os usuários | v2.22 | `.eq("user_id", user.id)` adicionado à query |
| Favoritos usando `r.name` como chave | v2.22 | Chave trocada para `r.id` |
| `unreadCount` badge começa em 2 | v2.22 | `useState(0)` |
| Ícone `Martini` inexistente no Lucide | v2.22 | Substituído por `GlassWater` |
| Metadados globais "Lovable App" | v2.21 | `title`, `og:title`, `description` corrigidos no `__root.tsx` |
| Camera button na tela de dados é decorativo | v2.23 | Upload de avatar implementado em `perfil.dados.tsx` |
| Exclusão de experiência sem confirmação | v2.23 | `window.confirm` adicionado antes do `remove.mutate` |
| Dois botões "Próximo" na tela de reserva | v2.24 | Botões inline removidos; bottom bar centraliza a navegação |
| Footer "Selecione um horário" no step 1 | v2.24 | Label e `disabled` do bottom bar corrigidos por step |
| `window.location.replace` pós-login owner/admin | v2.24 | Substituído por `navigate()` do TanStack Router |
| Versão "v1.0" no perfil | v2.24 | Atualizado para v2.24 |
| `bookedModal` nunca abre | v2.28 | Slots confirmados tornam-se clicáveis; `setBookedModal(true)` no onClick |
| Reagendamento sem verificar disponibilidade | v2.31 | `reschedule()` agora consulta conflitos antes de atualizar; toast de erro se slot ocupado |
| Horário de experiência aceita texto livre | v2.32 | `type="time"` adicionado ao campo; aceita apenas HH:MM |
| `lang="en"` + textos em inglês no 404/erro | v2.33 | `lang="pt-BR"`, páginas 404 e erro traduzidas |
| Hero card fixo por ID `"mare-alta"` | v2.34 | Usa primeiro `is_featured` do banco; removido ID hardcoded |
| Imagens do Clube ignoravam `image_url` do banco | v2.35 | Prioridade: `exp.image_url` → `restaurant.image_url` → Unsplash fallback |
| Cidades hardcoded no FAQ + instrução de app nativo | v2.36 | Resposta de cidades genérica; notificações corrigidas para web/PWA |
| Admin UUID truncado + sem nome do cliente | v2.37 | Join com `restaurants(name)` e `profiles(full_name)` nos dois painéis admin |
| `keepLoggedIn` sem efeito real | v2.38 | Root verifica flag no boot: se `false` e sem `sessionStorage`, faz signOut |
| Notificações 100% fake | v2.39 | Tabela `notifications` criada; drawer e tela conectados ao banco; estado "lido" persiste |
| +150 pontos fixo no histórico | v2.39 | Usa `reservations.points_earned` (default 150); coluna adicionada ao banco |
| "Valor gasto: —" sempre vazio | v2.39 | Usa `reservations.total_amount`; exibe valor quando preenchido pelo owner |
