# Bugs e Pendências

---

## 🔴 Bugs funcionais ativos

Nenhum bug ativo no momento. `npx tsc --noEmit` passa sem erros.

---

## 🔵 Melhorias pendentes

### Notificações reais por email
**Situação:** Edge Function `notify-reservation` está deployada. Preferências de notificação são salvas em `profiles`. Mas nenhum email é entregue.
**Bloqueio:** Resend precisa de domínio verificado para enviar de email customizado. Opções:
- Usar Gmail SMTP direto (fácil, mas email aparece como @gmail)
- Registrar domínio `reserve.app` e verificar no Resend (recomendado para produção)

### Histórico — valor gasto real / pratos pedidos
A UI do histórico já mostra "Valor gasto: —" (v2.15). Para preencher de verdade precisaria de uma tabela `reservation_items` que registre os pratos e total de cada reserva. Sem dados reais por enquanto, mas o espaço já está preparado.

---

## 💡 Ideias futuras (não implementadas)

### Validação de cupons adaptativa para PC — câmera e bipador automáticos

**Contexto:** O painel owner (`/owner/cupons`) roda em PC nos caixas/recepções de restaurantes, não só em celular. O botão de câmera atual presume câmera disponível e usa `html5-qrcode`. Precisamos adaptar para o ambiente real de trabalho do restaurante.

**Comportamento ideal:**

Ao abrir `/owner/cupons`, o sistema detecta silenciosamente o hardware disponível e adapta a UI:

| Situação da máquina | Comportamento |
|---|---|
| Câmera detectada (webcam/integrada) | Botão 📷 aparece — abre scanner de câmera via `html5-qrcode` |
| Sem câmera | Botão 📷 não aparece — só campo de digitação |
| Bipador USB conectado | Campo de código já recebe o input automaticamente — sem nenhum botão extra |

**Como detectar câmera:**
```ts
const cameras = await navigator.mediaDevices.enumerateDevices();
const hasCamera = cameras.some(d => d.kind === "videoinput");
// Mostrar botão de câmera somente se hasCamera === true
```
Isso já resolve o problema de mostrar o botão só quando faz sentido.

**Como funcionar com bipadores/leitores USB:**

Leitores de código de barras e QR USB se comportam como teclado HID — eles "digitam" o conteúdo do código muito rápido e, na maioria, pressionam Enter automaticamente. O campo de texto já captura isso nativamente. O que falta é:

1. **Auto-submit ao detectar velocidade de bipador:** detectar se as teclas chegaram rápido demais para ser digitação humana (< 30ms entre caracteres) — se sim, considera como leitura de bipador e submete automaticamente sem o usuário precisar apertar "Buscar"
2. **Feedback visual:** enquanto o bipador envia os chars, mostrar um indicador "Lendo..." em vez do cursor parado

**Implementação do detector de bipador (rascunho):**
```ts
const lastKeyTime = useRef<number>(0);
const scanBuffer = useRef<string>("");

const handleKeyDown = (e: KeyboardEvent) => {
  const now = Date.now();
  const delta = now - lastKeyTime.current;
  lastKeyTime.current = now;

  if (e.key === "Enter" && delta < 50) {
    // Enter muito rápido = fim de leitura de bipador
    e.preventDefault();
    lookup.mutate(scanBuffer.current);
    scanBuffer.current = "";
    return;
  }

  if (delta < 30 && e.key.length === 1) {
    // Caractere chegando muito rápido = bipador digitando
    scanBuffer.current += e.key;
  } else {
    // Digitação normal — resetar buffer
    scanBuffer.current = e.key.length === 1 ? e.key : "";
  }
};
```

**Para o futuro mais distante:** WebHID API (`navigator.hid`) permite enumerar e conectar diretamente a dispositivos HID — poderia detectar um leitor específico pelo vendor ID/product ID e abrir comunicação direta, sem depender da emulação de teclado. Mas isso requer HTTPS e permissão explícita do usuário, e não é suportado em Firefox.

**Prioridade:** baixa — o fluxo atual (digitar o código) já funciona em PC. O bipador já funciona parcialmente (a maioria envia Enter e o form submete). A melhoria real é o auto-submit por velocidade e a detecção de câmera.

---

## ✅ Bugs já resolvidos (histórico)

| Bug | Versão | Descrição |
|---|---|---|
| Club page em branco ao clicar | v2.3.2 | `clube.tsx` não tinha `<Outlet />` — filhos nunca renderizavam |
| Crash `pastaImg` | v2.3.1 | Import removido mas `upcomingSeed` ainda referenciava a variável |
| `ReferenceError: past is not defined` | v2.3.2 | Array `past` removido mas JSX ainda o usava |
| Reservas passadas em "Próximas" | v2.4 | Query não filtrava `reservation_date >= hoje` |
| Datas stale na virada de ano | v2.4.2 | Constante de módulo substituída por `useMemo` |
| Race condition em vagas | v2.3 | Leitura + escrita client-side substituída por RPC com `GREATEST` |
| Booking duplicado de experiência | v2.3 | Guard que verifica existência antes de inserir |
| FK error ao deletar experiência | v2.6 | Delete de `experience_bookings` antes de deletar `experiences` |
| Tabelas sem RLS | pós-v2.3 | RLS habilitado nas 5 tabelas críticas com políticas por role |
| Cancelar reserva sem ação | v2.8 | `onCancel` com UPDATE status=cancelled + invalidateQueries |
| "Confirmar presença" sem onClick | v2.8 | UPDATE status=confirmed, fecha modal, toast — só aparece quando pending |
| Owner 400 em profiles join | v2.8 | FK hint `profiles!reservations_user_id_fkey` nos dois arquivos owner |
| Inconsistência de tier | v2.7 | Ouro unificado em 1000+ nos dois arquivos |
| avatar_url sem coluna | v2.7 | ALTER TABLE + bucket avatars + Storage policies |
| TypeScript errors (search param) | v2.9 | `search: { redirect }` adicionado em todos os links/navigates para /login e /signup |
| Mock data em reservas | v2.10 | `upcomingSeed` removido, auth gate universal, tela vazia para deslogado |
| Cupons sem validação | v2.11 | `/owner/cupons` com busca, badge de status e marcar como utilizado |
| QR code nos cupons | v2.12–v2.13 | Bottom sheet com QR no cliente, scanner de câmera no owner, modal redesenhado |
| Chunk size excessivo no owner | v2.16 | html5-qrcode (~300 kB) movido para import() dinâmico — só carrega quando owner abre a câmera |
| Contatos fictícios na ajuda | v2.14 | WhatsApp/email removidos, suporte redirecionado para o Breno (IA) |
| Histórico básico demais | v2.15 | Código de confirmação, stats row, "Valor gasto: —" preparado |
