# Bugs e Pendências

---

## 🔴 Bugs funcionais

| Bug | Arquivo | Detalhe |
|-----|---------|---------|
| Busca na home não funciona | `index.tsx` | Input sem `onChange` — é decorativo, não filtra nada |
| `reservationCount` conta todos os usuários | `perfil.tsx:52` | Query sem `.eq("user_id", ...)` — exibe total global |
| Camera button na tela de dados é decorativo | `perfil.dados.tsx:232` | Botão Camera sem onClick |
| `bookedModal` nunca abre | `restaurante.$id.tsx:813` | State existe, modal existe, mas nada chama `setBookedModal(true)` — código morto |
| Reagendamento sem verificar disponibilidade | `reservas.tsx:203` | `reschedule()` atualiza direto no banco sem checar se horário está livre |
| Horário de experiência aceita texto livre | `owner.experiencias.tsx:157` | Campo sem `type="time"`, aceita "oito horas" |
| Exclusão de experiência sem confirmação | `owner.experiencias.tsx:80` | Remove experience_bookings de clientes silenciosamente |
| Ícone `Martini` inexistente no Lucide | `index.tsx:33` | Lucide 0.474 não tem `Martini` — pode quebrar em runtime |

---

## 🟡 Dados mock / hardcoded a substituir

| Item | Arquivo | Detalhe |
|------|---------|---------|
| Metadados globais "Lovable App" | `__root.tsx:83` | title, og:title, description, author são do template — nunca substituídos |
| `lang="en"` no HTML | `__root.tsx:103` | App é 100% pt-BR |
| Notificações 100% fake | `NotificationsDrawer.tsx`, `perfil.notificacoes.tsx` | Arrays estáticos com restaurantes fictícios; estado "lido" não persiste |
| Versão "v1.0" no perfil | `perfil.tsx:262` | Hardcoded; projeto já está em v2.19 |
| "+150 pontos" no histórico | `reservas.tsx:1012` | Número fixo; deveria vir do banco |
| "Valor gasto: —" sempre vazio | `reservas.tsx:1021` | Precisa de tabela `reservation_items` |
| Hero card fixo por ID `"mare-alta"` | `index.tsx:135` | Sem fallback se restaurante não existir |
| `unreadCount` começa em 2 | `index.tsx:99` | `useState(2)` — badge de notificação sempre mostra 2 ao carregar |
| Imagens do Clube hardcoded no Unsplash | `clube/index.tsx:23` | `TYPE_IMAGES` mapeia tipos para URLs Unsplash que ignoram `image_url` do banco |
| "Cidades disponíveis: SP, RJ, Curitiba" no FAQ | `perfil.ajuda.tsx:82` | Hardcoded — vai desatualizar |
| Admin mostra `restaurant_id` truncado | `admin.index.tsx:129` | Deveria mostrar nome do restaurante (falta join) |
| Admin reservas sem nome do cliente | `admin.reservas.tsx` | Falta join com `profiles` |
| `keepLoggedIn` não implementado | `login.tsx:38` | Flag salva no localStorage mas sessão Supabase não muda comportamento |

---

## 🟠 UX a melhorar

| Item | Arquivo | Detalhe |
|------|---------|---------|
| Dois botões de avançar na tela de reserva | `restaurante.$id.tsx` | Footer sticky duplica o botão "Próximo" que já existe em cada step |
| Footer mostra "Selecione um horário" no step 1 | `restaurante.$id.tsx:803` | Step 1 é data, não horário — mensagem confusa |
| Owner panel sem responsividade mobile | `owner.tsx` | Sidebar fixa 240px — inutilizável em celular |
| Admin panel sem responsividade mobile | `admin.tsx` | Mesmo problema |
| Botão voltar do Clube vai para home | `clube/index.tsx:67` | `navigate({ to: "/" })` em vez de `navigate({ back: true })` |
| Onboarding não redireciona novos usuários | `onboarding.tsx` | Flag `reserve_onboarded` salva mas nunca lida para redirecionar |
| Breno ativa globalmente ao clicar em "Conversar" | `perfil.ajuda.tsx:217` | UX indireta — deveria abrir o chat direto |
| FAQ instrui "Configurações do celular > Aplicativos" | `perfil.ajuda.tsx:62` | App é web/PWA, não app nativo |
| CPF aceita valores inválidos | `perfil.dados.tsx:258` | Só mascara, não valida dígito verificador |
| Data de nascimento salva como string `DD/MM/YYYY` | `perfil.dados.tsx:253` | Deveria ser ISO `DATE` para queries de idade |
| `window.location.replace` pós-login owner/admin | `login.tsx:48` | Reload desnecessário — deveria usar router.navigate |
| QR modal não bloqueia scroll do fundo | `recompensas.tsx:429` | Background scrollável ao abrir QR |
| Cor do botão CTA no Club fixada como `color: "#000"` | `clube/$id.tsx:314` | Pode ter contraste ruim com cores claras de accent |
| Favorito usa `r.name` como chave | `reservas.tsx:186` | Conflito se dois restaurantes tiverem o mesmo nome — deveria usar `r.id` |
| Owner stats "Hoje" inclui canceladas e pendentes | `owner.index.tsx:52` | Deveria contar só confirmadas |
| Gênero "outro" confundido com "prefiro não informar" | `perfil.dados.tsx:269` | `value="outro"` para "Prefiro não informar" — semanticamente errado |

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
