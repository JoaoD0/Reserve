# Painéis Owner e Admin

---

## Painel Owner `/owner`

Acesso restrito a usuários com `role = 'owner'` em `profiles`. O layout (`owner.tsx`) redireciona quem não é owner. O `restaurantId` do owner vem de `profiles.restaurant_id` e é retornado pelo hook `useAuth()`.

### Dashboard `/owner/` — `owner.index.tsx`

**Cards de estatísticas (3 colunas):**
- Aguardando aprovação (reservas `status = pending` do restaurante)
- Reservas hoje (reservas com `reservation_date = hoje`)
- Total de reservas (todas as reservas do restaurante)

Cada card usa `{ count: "exact", head: true }` — query que retorna apenas o count, sem os dados, eficiente.

**Tabela de solicitações pendentes:**
Últimas 5 reservas `status = pending` ordenadas por data, com join em `profiles!reservations_user_id_fkey(full_name)` para mostrar o nome do cliente. O FK hint explícito é necessário para o PostgREST resolver a relação corretamente (corrigido em v2.8).

---

### Gestão de Reservas `/owner/reservas` — `owner.reservas.tsx`

**Filtros:** Pendentes / Confirmadas / Canceladas / Todas (botões de tab)

**Card por reserva:**
- Badge de status + código de confirmação
- Nome do cliente (join profiles) ou telefone como fallback
- Link `tel:` no telefone — ao clicar, abre o discador do dispositivo
- Data, horário, número de pessoas

**Ações (só para reservas pending):**
- ✅ **Confirmar** → UPDATE `status = 'confirmed'` + dispara Edge Function `notify-reservation`
- ❌ **Cancelar** → UPDATE `status = 'cancelled'` + dispara Edge Function `notify-reservation`

A Edge Function é chamada fire-and-forget (`.catch(() => {})`) para não bloquear a UI se falhar.

Quando o owner marca como `completed` (reserva realizada): o trigger `award_reservation_points` dispara automaticamente e credita 150 pontos ao usuário.

---

### Validação de Cupons `/owner/cupons` — `owner.cupons.tsx`

Owner digita o código apresentado pelo cliente (ex: `RSV-PRIO-AB3K7M`) **ou escaneia o QR code** direto no app. O sistema busca em `user_rewards`, exibe: recompensa, nome do cliente, data de resgate e validade, badge de status (Válido / Expirado / Utilizado). Se válido: botão "Marcar como utilizado" → `UPDATE user_rewards SET is_used = true`.

**Scanner de câmera (v2.13):** botão com ícone de câmera ao lado do campo — abre a câmera traseira do dispositivo via `html5-qrcode`. Ao detectar o QR, preenche o campo automaticamente, fecha a câmera e busca o cupom. Indicador vermelho piscando mostra que a câmera está ativa.

Requer políticas RLS em `user_rewards` que permitem owner ler e atualizar qualquer cupom (adicionadas junto com a feature).

---

### Gestão de Experiências `/owner/experiencias` — `owner.experiencias.tsx`

Lista todas as experiências Club do restaurante em tabela com: Título, Tipo, Data, Vagas disponíveis/total, Preço/pessoa, botão de deletar.

**Formulário "Nova experiência"** (toggle com botão no topo):
- Título
- Tipo (select com os 5 tipos)
- Preço por pessoa
- Data + Horário
- Vagas
- URL de imagem (opcional)
- Descrição (opcional)

Ao criar: `INSERT` em `experiences` com `available_spots = max_spots` (começa com todas as vagas livres).

**Ao deletar:**
```js
// Primeiro apaga os bookings filhos
await supabase.from("experience_bookings").delete().eq("experience_id", id);
// Depois apaga a experiência
await supabase.from("experiences").delete().eq("id", id);
```
A ordem importa — FK constraint impede deletar a experiência se houver bookings referenciando ela.

---

## Painel Admin `/admin`

Acesso restrito a `role = 'admin'`. Visão global de todo o sistema.

### Páginas do admin

- **`/admin/`** — dashboard global
- **`/admin/restaurantes`** — cadastrar e gerenciar restaurantes
- **`/admin/reservas`** — ver todas as reservas de todos os restaurantes
- **`/admin/proprietarios`** — gerenciar owners: criar conta, vincular a restaurante, promover role

### Onboarding de owner
O fluxo para ativar um owner é feito pelo admin:
1. Admin acessa `/admin/proprietarios`
2. Busca o usuário pelo email
3. Seta `role = 'owner'` e `restaurant_id` no `profiles` daquele usuário
4. A partir daí, quando o usuário logar, `useAuth()` retorna `role = 'owner'` e ele vê o menu do painel owner
