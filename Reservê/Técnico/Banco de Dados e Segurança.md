# Banco de Dados e Segurança

Backend: **Supabase (Postgres)**. Sem servidor Node próprio — toda a lógica de dados fica no banco ou em Edge Functions.

---

## Tabelas

### `profiles`
Criada automaticamente por trigger quando um usuário faz signup. Espelha `auth.users`.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | Igual ao `auth.users.id` |
| `role` | text | `'customer'` / `'owner'` / `'admin'` |
| `restaurant_id` | uuid FK | Preenchido só para owners |
| `points` | int | Padrão 0. Incrementado por trigger |
| `avatar_url` | text | URL pública no bucket `avatars` com cache-bust `?t=timestamp` |
| `full_name` | text | Nome completo |

### `restaurants`
| Coluna | Tipo |
|---|---|
| `id` | uuid PK |
| `name` | text |
| `image_url` | text |
| `address` | text |
| `location` | text (bairro curto) |
| `cuisine` | text |
| `rating` | numeric |
| `description` | text |
| `opening_hours` | text |
| `phone` | text |
| `latitude`, `longitude` | numeric (para filtro de proximidade) |
| `is_featured` | bool (aparece no carrossel da home) |
| `price` | text (ex: "R$ 180–250/pessoa") |

### `reservations`
| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → profiles | |
| `restaurant_id` | uuid FK → restaurants | |
| `reservation_date` | date | formato `yyyy-mm-dd` |
| `time_slot` | text | ex: `"20:00"` |
| `party_size` | int | |
| `status` | text | `pending` / `confirmed` / `cancelled` / `completed` |
| `contact_phone` | text | telefone informado pelo usuário na reserva |
| `confirmation_code` | text | gerado no client com `Math.random().toString(36)` |

**Ciclo de vida do status:**
```
pending → confirmed → completed  (fluxo normal)
pending → cancelled              (cancelado pelo restaurante)
confirmed → cancelled            (cancelado após confirmação)
```
Quando status muda para `completed`: trigger dispara e credita 150 pts ao usuário.

### `experiences`
Experiências do Reservê Club.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `restaurant_id` | uuid FK | |
| `title` | text | |
| `description` | text | texto do restaurante (complementa o automático) |
| `type` | text | `chef_table` / `private_dinner` / `harmonization` / `tasting_menu` / `blind_dinner` |
| `price_per_person` | numeric | |
| `max_spots` | int | vagas totais |
| `available_spots` | int | decrementado via RPC na reserva |
| `event_date` | date | |
| `event_time` | text | |
| `image_url` | text | opcional — app usa imagens por tipo se null |
| `is_active` | bool | padrão true |

### `experience_bookings`
| Coluna | Tipo |
|---|---|
| `id` | uuid PK |
| `user_id` | uuid FK → profiles |
| `experience_id` | uuid FK → experiences |
| `party_size` | int |
| `confirmation_code` | text |
| `created_at` | timestamptz |

### `menu_items`
| Coluna | Tipo |
|---|---|
| `id` | uuid PK |
| `restaurant_id` | uuid FK |
| `name` | text |
| `description` | text |
| `price` | numeric |
| `category` | text |

### `favorites`
| Coluna | Tipo |
|---|---|
| `user_id` | uuid FK |
| `restaurant_id` | uuid FK |

### `user_rewards`
| Coluna | Tipo |
|---|---|
| `id` | uuid PK |
| `user_id` | uuid FK |
| `reward_id` | text (ex: `"discount10"`) |
| `coupon_code` | text |
| `redeemed_at` | timestamptz |
| `expires_at` | timestamptz |
| `is_used` | bool |

---

## Segurança — RLS (Row Level Security)

### Por que isso importa

A `VITE_SUPABASE_ANON_KEY` fica no bundle JavaScript do browser — qualquer pessoa pode ver abrindo o DevTools. Isso é **design intencional do Supabase**: a anon key é pública por natureza. O que protege os dados são as políticas RLS no Postgres.

Sem RLS: qualquer pessoa com a anon key consegue fazer `SELECT * FROM reservations` e ver todas as reservas de todos os usuários.

Com RLS: a query retorna apenas o que as políticas permitem para o JWT do usuário atual.

### O que havia antes (problema)

Apenas 3 tabelas tinham RLS: `profiles`, `favorites`, `user_rewards`. As demais — `reservations`, `experiences`, `experience_bookings`, `restaurants`, `menu_items` — estavam abertas.

### Políticas implementadas

#### `restaurants`
```sql
-- Qualquer pessoa pode ler
CREATE POLICY "Public pode ler restaurantes" ON restaurants
  FOR SELECT USING (true);

-- Owner só atualiza o próprio restaurante
CREATE POLICY "Owner atualiza próprio restaurante" ON restaurants
  FOR UPDATE USING (
    id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- Admin faz tudo
CREATE POLICY "Admin acesso total" ON restaurants
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
```

#### `reservations`
```sql
-- Usuário vê só as próprias
CREATE POLICY "Usuário vê próprias reservas" ON reservations
  FOR SELECT USING (auth.uid() = user_id);

-- Usuário cria só para si
CREATE POLICY "Usuário cria própria reserva" ON reservations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Owner vê e gerencia reservas do seu restaurante
CREATE POLICY "Owner acessa reservas do restaurante" ON reservations
  FOR ALL USING (
    restaurant_id IN (
      SELECT restaurant_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Admin acesso total" ON reservations
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
```

#### `experiences`
```sql
-- Público lê experiências ativas
CREATE POLICY "Public vê experiências ativas" ON experiences
  FOR SELECT USING (is_active = true);

-- Owner gerencia as do seu restaurante
CREATE POLICY "Owner gerencia próprias experiências" ON experiences
  FOR ALL USING (
    restaurant_id IN (
      SELECT restaurant_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );
```

#### `experience_bookings`
```sql
-- Usuário vê/cria/atualiza os próprios bookings
CREATE POLICY "Usuário vê próprios bookings" ON experience_bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuário cria próprio booking" ON experience_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Owner vê bookings das experiências do seu restaurante
CREATE POLICY "Owner vê bookings do restaurante" ON experience_bookings
  FOR SELECT USING (
    experience_id IN (
      SELECT e.id FROM experiences e
      JOIN profiles p ON p.restaurant_id = e.restaurant_id
      WHERE p.id = auth.uid() AND p.role = 'owner'
    )
  );
```

#### `menu_items`
```sql
-- Público lê
CREATE POLICY "Public vê itens de menu" ON menu_items
  FOR SELECT USING (true);

-- Owner gerencia o próprio menu
CREATE POLICY "Owner gerencia menu do restaurante" ON menu_items
  FOR ALL USING (
    restaurant_id IN (
      SELECT restaurant_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );
```

---

## Funções SQL

### `decrement_experience_spots(exp_id uuid, qty int)`
RPC chamada pelo client ao reservar uma experiência. Resolve race condition: se dois usuários tentam reservar ao mesmo tempo, uma leitura do `available_spots` seguida de subtração no client poderia resultar em vagas negativas. A função resolve isso com operação atômica:

```sql
CREATE OR REPLACE FUNCTION decrement_experience_spots(exp_id uuid, qty int)
RETURNS void AS $$
  UPDATE experiences
  SET available_spots = GREATEST(available_spots - qty, 0)
  WHERE id = exp_id;
$$ LANGUAGE sql SECURITY DEFINER;
```

`GREATEST(..., 0)` garante que o campo nunca vai abaixo de zero mesmo em condições de alta concorrência.

### `award_reservation_points()` — trigger
Dispara após UPDATE em `reservations`. Credita 150 pontos quando status muda **para** `completed`:

```sql
CREATE OR REPLACE FUNCTION award_reservation_points()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    UPDATE profiles SET points = points + 150 WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_award_points
AFTER UPDATE ON reservations
FOR EACH ROW EXECUTE FUNCTION award_reservation_points();
```

O `IS DISTINCT FROM` é importante: se `OLD.status` for `NULL` (sem histórico), a comparação `<>` retornaria NULL em vez de TRUE. `IS DISTINCT FROM` trata NULL corretamente.

---

## Storage

### Bucket `avatars`
- **Tipo:** público (URLs acessíveis sem autenticação)
- **Path por upload:** `{user_id}/avatar.{ext}` (ex: `abc-123/avatar.jpg`)
- **Upsert:** ao trocar foto, sobrescreve o arquivo anterior no mesmo path
- **Cache bust:** URL salva inclui `?t=timestamp` para forçar o browser a recarregar a imagem após troca
- **Coluna:** `profiles.avatar_url` — adicionar com `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;` se não existir

---

## Edge Functions

### `notify-reservation`
Deployada no Supabase. Chamada no painel owner quando o status de uma reserva muda:
```js
supabase.functions.invoke("notify-reservation", {
  body: { reservationId: id, status }
})
```
Usa `service_role` key internamente (via `Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")`) para acessar dados sem restrição de RLS, e Resend para enviar o email.

**Status atual:** deployada mas parada — aguardando decisão sobre domínio de email (Gmail SMTP vs domínio próprio no Resend).
