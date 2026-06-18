# Decisões Técnicas

A história de por que as coisas foram feitas do jeito que foram — problemas encontrados, soluções escolhidas e lições aprendidas.

---

## TanStack Router: o bug do `<Outlet />`

**Problema:** Ao clicar em uma experiência no Club, nada acontecia. A URL mudava para `/clube/abc-123` mas a tela continuava exibindo a listagem.

**Causa:** No TanStack Router file-based, quando um arquivo é pai de rotas filhas, ele **precisa renderizar `<Outlet />`**. O `clube.tsx` era tanto o layout pai quanto a listagem — sem `<Outlet />`, o filho nunca renderizava.

**Solução:** Dividir em três arquivos:
- `clube.tsx` → componente que só retorna `<Outlet />`
- `clube.index.tsx` → a listagem (rota index)
- `clube.$id.tsx` → o detalhe

**Lição:** Sempre que criar rotas filhas, o pai precisa ter `<Outlet />`. É a mesma convenção do React Router v6.

---

## Constante de módulo vs `useMemo` para datas

**Problema:** `RESCHEDULE_DAYS` era calculado uma vez quando o módulo carregava:
```js
const RESCHEDULE_DAYS = Array.from({ length: 60 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i + 1);
  // ...
});
```
Se o app ficasse aberto na virada de ano (31 dez → 1 jan), o array continuaria com as datas do ano anterior até o usuário dar F5.

**Solução:** Convertido para função `buildRescheduleDays()` chamada dentro de `useMemo(() => buildRescheduleDays(), [])` no componente `RescheduleModal`. Agora as datas são recalculadas sempre que o modal abre.

---

## Race condition no decremento de vagas

**Problema:** Se dois usuários tentam reservar a última vaga ao mesmo tempo:
1. Usuário A lê: `available_spots = 1`
2. Usuário B lê: `available_spots = 1`
3. Usuário A subtrai e escreve: `available_spots = 0`
4. Usuário B subtrai e escreve: `available_spots = 0` ✓ (deveria ter travado)

Na versão ingênua (`UPDATE SET available_spots = available_spots - qty`), isso resultaria em vagas negativas.

**Solução:** RPC com `GREATEST(..., 0)`:
```sql
UPDATE experiences
SET available_spots = GREATEST(available_spots - qty, 0)
WHERE id = exp_id;
```
A operação é atômica no Postgres — não há janela entre leitura e escrita. `GREATEST` garante o mínimo 0.

---

## Deduplicação de reservas no histórico

**Problema:** Uma reserva cancelada antes da data aparece tanto na query "passadas por data" quanto na query "por status cancelled" — resultando em duplicata.

**Solução:** Duas queries em paralelo (`Promise.all`) com deduplicação por Set:
```js
const seen = new Set<string>();
return combined.filter((r) => {
  if (seen.has(r.id)) return false;
  seen.add(r.id);
  return true;
});
```

Alternativa considerada: fazer uma única query com `OR` (data < hoje OR status IN cancelled,completed). O Supabase JS não tem suporte nativo a `OR` entre condições diferentes de maneira simples — daí a escolha de duas queries + merge client-side.

---

## Disponibilidade de horários: dois Sets separados

**Problema original:** A query de disponibilidade buscava só slots confirmados. Mas e os horários `pending`? Uma reserva pending ainda não foi aprovada pelo restaurante — se ignorarmos, dois usuários podem estar concorrendo pelo mesmo horário sem saber.

**Decisão (v2.6):** Separar em dois Sets:
```js
const confirmed = new Set<string>();
const pending = new Set<string>();
for (const r of data ?? []) {
  r.status === "confirmed" ? confirmed.add(r.time_slot) : pending.add(r.time_slot);
}
```

Horários `confirmed` ficam completamente bloqueados. Horários `pending` ficam "em disputa" — o usuário pode tentar, mas vê um aviso explicando a situação. Isso é mais honesto do que simplesmente bloquear ou ignorar.

---

## Por que pontos no `completed` e não no `confirmed`

**Opção 1 — Pontos no `confirmed`:** Usuário reserva, restaurante confirma, pontos caem.
- Problema: incentiva fazer reservas sem ir — "ganhou os pontos, cancela depois"

**Opção 2 — Pontos no `completed`:** Pontos só caem quando o restaurante marca a reserva como concluída.
- Isso significa que a pessoa foi ao restaurante de fato
- Faz sentido de produto: pontos de fidelidade por visitas reais, não por reservas

**Escolhida:** Opção 2. Implementada via trigger no Postgres para não depender do client.

---

## Segurança: anon key pública

**Contexto:** O usuário viu um vídeo mostrando alguém acessando dados de um Supabase usando a anon key exposta no JS.

**A verdade:** A `VITE_SUPABASE_ANON_KEY` é projetada para ser pública. O Supabase mesmo documenta isso. O problema do vídeo não era a key estar exposta — era não ter RLS configurado.

**O que fizemos:** Habilitamos RLS em todas as 5 tabelas críticas com políticas granulares por role. Agora, mesmo com a anon key em mãos, um atacante não consegue ver dados de outros usuários.

**O que não mudou:** A key continua visível no DevTools. Isso é normal e esperado.

---

## Por que não usar `useState` para dados do servidor

Todo fetch de dados usa TanStack Query (`useQuery`) em vez de `useEffect + useState`. Razões:
- Cache automático — segunda visita à mesma tela não refaz a query
- Invalidação declarativa — `queryClient.invalidateQueries(["chave"])` refaz exatamente o que precisa
- Loading/error states built-in
- Sem race conditions em `useEffect` com cleanup manual
- Stale-while-revalidate — mostra dado cacheado enquanto refetch acontece em background

---

## FK hint no PostgREST (resolvido em v2.8)

O join `.select("*, profiles(full_name)")` em `owner.index.tsx` e `owner.reservas.tsx` falhava com 400 porque o PostgREST não conseguia determinar automaticamente qual FK usar entre `reservations` e `profiles`.

**Solução aplicada:** hint explícito em ambos os arquivos:
```js
.select("*, profiles!reservations_user_id_fkey(full_name)")
```

**Lição:** sempre que um join entre duas tabelas for ambíguo (múltiplas FKs possíveis), usar o nome da FK como hint no PostgREST.
