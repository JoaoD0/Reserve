# Reservê Club

A feature premium do app — experiências gastronômicas exclusivas que vão além de uma reserva comum.

---

## O que é

O Reservê Club é uma camada acima das reservas normais. Enquanto uma reserva normal é "quero uma mesa às 20h", uma experiência Club é "quero participar de um jantar privativo com menu degustação de 8 etapas conduzido pelo chef". São eventos com data, hora, número de vagas e preço por pessoa definidos pelo próprio restaurante.

---

## Tipos de experiência

| Tipo (DB) | Label | Cor accent |
|---|---|---|
| `chef_table` | Mesa do Chef | `#D4A853` (dourado) |
| `private_dinner` | Jantar Privado | `#C17B7B` (rosê) |
| `harmonization` | Harmonização | `#9B7EC8` (lilás) |
| `tasting_menu` | Menu Degustação | `#6BAF8E` (verde) |
| `blind_dinner` | Mesa às Cegas | `#7B9FC1` (azul) |

Cada tipo tem:
- Imagem padrão do Unsplash (usada quando o restaurante não cadastra imagem própria)
- Texto descritivo automático (`TYPE_ABOUT`) que explica o que é aquela experiência
- Lista de destaques (`TYPE_HIGHLIGHTS`) com 3 bullets do que esperar
- Cor accent usada em badges, preços, código de confirmação

---

## Telas

### `/clube` — Listagem

**Arquivo:** `src/routes/clube.index.tsx`

Busca todas as experiências `is_active = true` com `event_date >= hoje` com join em `restaurants`.

**Card de experiência:**
- Imagem tall (h-60) com gradiente multi-camada sobre ela
- Badge de tipo na cor accent do tipo
- Nome da experiência e restaurante
- Número de vagas disponíveis
- Preço "A partir de R$ X/pessoa" em dourado
- Toda a área é clicável → navega para `/clube/:id`

**Problema original que motivou a criação desta tela:** O arquivo `clube.tsx` era a página de listagem, mas também era pai de `clube.$id.tsx`. O TanStack Router precisava de `<Outlet />` no pai para renderizar o filho — como não tinha, clicar em uma experiência não mostrava nada. A solução foi dividir em 3 arquivos:
- `clube.tsx` → layout puro com apenas `<Outlet />`
- `clube.index.tsx` → listagem (rota index do Club)
- `clube.$id.tsx` → detalhe

### `/clube/:id` — Detalhe e Booking

**Arquivo:** `src/routes/clube.$id.tsx`

**Estrutura da tela:**
1. **Hero image** — h-72, gradiente escuro, botão voltar flutuante, badge de tipo e nome da experiência na parte de baixo
2. **Data e vagas** — dois cards lado a lado
3. **Sobre esta experiência** — texto `TYPE_ABOUT` automático + bullets `TYPE_HIGHLIGHTS`
4. **Detalhes da noite** — descrição customizada do banco (só aparece se diferente do texto automático)
5. **Localização** — endereço do restaurante
6. **Seletor de pessoas** — stepper com − / +, limitado por `available_spots`
7. **Total calculado** — `pessoas × preço_por_pessoa`
8. **CTA fixo no bottom** — "Solicitar · R$ X" na cor accent do tipo

**Proteção contra booking duplicado:**
Antes de inserir, faz:
```js
supabase.from("experience_bookings")
  .select("id")
  .eq("user_id", user.id)
  .eq("experience_id", id)
  .maybeSingle()
```
Se existir → erro "Você já tem uma reserva para esta experiência."

**Decremento atômico de vagas:**
Não lê `available_spots` e subtrai no client (race condition). Usa RPC:
```sql
UPDATE experiences
SET available_spots = GREATEST(available_spots - qty, 0)
WHERE id = exp_id;
```
`GREATEST(..., 0)` garante que não vai negativo mesmo com requisições simultâneas.

**Tela de confirmação:**
Após booking bem-sucedido, o componente troca para tela de confirmação (sem navegar — é `useState(booked)`):
- Ícone CheckCircle na cor accent
- Card resumo com data, horário, pessoas, total
- Código `#XXXXXX` colorido na cor accent do tipo
- Botão "Voltar ao início"

---

## Aba Club em `/reservas`

**Arquivo:** `src/routes/reservas.tsx`

A terceira aba das reservas mostra os `experience_bookings` do usuário com join nos dados da experiência e do restaurante. Cada card mostra a imagem do tipo, o badge, o código de confirmação, data/hora/pessoas e total estimado.

Se o usuário não tem nenhuma experiência: estado vazio com link "Explorar experiências" que navega para `/clube`.

---

## Gestão pelo Owner

**Arquivo:** `src/routes/owner.experiencias.tsx`

O painel do owner tem uma página exclusiva para gerenciar experiências Club do restaurante. Ver [[Painéis Owner e Admin]] para detalhes.

---

## Banco de dados

Duas tabelas envolvidas:

**`experiences`** — cadastro da experiência:
- `restaurant_id`, `title`, `description`, `type`
- `price_per_person`, `max_spots`, `available_spots` (decrementado na reserva)
- `event_date`, `event_time`, `image_url`, `is_active`

**`experience_bookings`** — reservas de experiência:
- `user_id`, `experience_id`, `party_size`, `confirmation_code`

**RLS:** Público lê experiências ativas. Só o dono do restaurante pode criar/editar/deletar. Usuário vê só os próprios bookings. Ver [[Banco de Dados e Segurança]].

**Detalhe importante sobre delete:** Ao deletar uma experiência no painel owner, o código primeiro deleta todos os `experience_bookings` daquela experiência, depois deleta a experiência. Isso porque há uma FK (`experience_bookings.experience_id → experiences.id`) que impede deletar experiência com bookings filhos.
