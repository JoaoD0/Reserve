# Sistema de Pontos e Recompensas

**Arquivo:** `src/routes/recompensas.tsx`

---

## Como funciona

O usuário acumula pontos ao usar o app. Com pontos, sobe de tier e resgata recompensas como descontos, mesa VIP e menu do chef.

---

## Tiers

| Tier | Faixa de pontos | Cor |
|---|---|---|
| Bronze | 0 – 499 | Laranja |
| Prata | 500 – 999 | Cinza claro |
| Ouro | 1.000 – 4.999 | Dourado |
| Diamante | 5.000+ | Ciano/azul |

O tier é calculado dinamicamente em dois lugares do app:
1. **`/recompensas`** — barra de progresso para o próximo tier, pontuação atual
2. **`/perfil`** — badge "Membro Bronze/Prata/Ouro/Diamante" via `getTier(points)`

Thresholds unificados em v2.7 — ambos os arquivos usam os mesmos valores.

---

## Como ganhar pontos

| Ação | Pontos |
|---|---|
| Reserva concluída | +150 pts |
| Avaliação | +50 pts (exibido na UI, ainda não implementado) |
| Indicação | +200 pts (exibido na UI, ainda não implementado) |

### Trigger automático de pontos (v2.4)

Os 150 pontos por reserva concluída **não** são creditados quando o usuário faz a reserva, nem quando é confirmada. São creditados quando o **restaurante muda o status para `completed`** — ou seja, quando a reserva foi efetivamente realizada e a mesa está liberada.

Isso foi uma decisão deliberada: pontos no `confirmed` incentivaria cancelamentos com reembolso de pontos. No `completed`, o ponto só cai depois que a pessoa foi ao restaurante de fato.

Implementado via trigger no Postgres:

```sql
CREATE OR REPLACE FUNCTION award_reservation_points()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    UPDATE profiles
    SET points = points + 150
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_award_points
AFTER UPDATE ON reservations
FOR EACH ROW EXECUTE FUNCTION award_reservation_points();
```

O `IS DISTINCT FROM` evita disparar novamente se o status já era `completed` e foi feito outro UPDATE sem mudar o status.

---

## Recompensas disponíveis

| ID | Nome | Pontos | Descrição |
|---|---|---|---|
| `priority` | Fila Prioritária | 300 pts | Pula a fila em qualquer restaurante parceiro |
| `discount10` | 10% de Desconto | 600 pts | Desconto na próxima reserva |
| `vip` | Mesa VIP | 1.200 pts | Mesa especial com atendimento dedicado |
| `discount20` | 20% de Desconto | 2.500 pts | Desconto premium |
| `chef` | Menu do Chef | 5.000 pts | Menu degustação cortesia da casa |

Recompensas bloqueadas (cinza com cadeado) até o usuário ter pontos suficientes.

---

## Resgate de cupom

Ao resgatar uma recompensa:
1. Gera código único: `RSV-TIPO-XXXXXX` (ex: `RSV-PRIO-AB3K7M`)
2. Insere em `user_rewards` com `expires_at = hoje + 30 dias`
3. Subtrai pontos de `profiles.points`
4. Invalida os caches `["points"]` e `["userRewards"]`

O código fica visível em "Meus cupons" no final da tela, com dois botões:
- **QR Code** (v2.12) — abre um bottom sheet com QR code grande (gerado de `react-qr-code`, valor = o código do cupom). Usuário mostra a tela ao atendente.
- **Copiar** — clipboard API, exibe checkmark por 2 segundos.

Validação pelo owner disponível em `/owner/cupons` (v2.11) — owner busca o código, vê recompensa + nome do cliente + validade, e marca como utilizado (`is_used = true`).

---

## Tela de Recompensas

**Layout:**

1. **Card de saldo** — número grande de pontos, tier atual, barra de progresso animada (Framer Motion, cresce de 0% ao % correto com delay)
2. **Como ganhar** — 3 cards (Reserva +150, Avaliação +50, Indicação +200)
3. **Disponíveis para resgatar** — lista de todas as recompensas com estado visual
4. **Meus cupons** — só aparece se tiver cupons resgatados
