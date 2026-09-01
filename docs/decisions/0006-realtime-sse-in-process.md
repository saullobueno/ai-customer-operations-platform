# 0006 — Realtime via SSE + EventEmitter em processo, não WebSockets + Redis pub/sub

## Contexto

O prompt do projeto lista "realtime updates" como feature e "WebSockets"
na stack. Um servidor WebSocket dedicado (ou Redis pub/sub alimentando
múltiplas instâncias) é a forma correta de fazer isso em produção com mais
de uma instância do servidor rodando — mas exige um processo Node de longa
duração fora do modelo request/response do Next.js App Router (ou um
servidor customizado), e testar a integração com Redis de verdade não é
possível nesta máquina de desenvolvimento (Docker não instalado — ver
[0003](docs/decisions/0003-pglite-for-tests.md)).

## Decisão

Implementar atualização em tempo real com **Server-Sent Events** (endpoint
`GET /api/tickets/[id]/events`, streaming via `ReadableStream`) alimentado
por um `EventEmitter` em processo (`src/server/realtime/publisher.ts`).
Toda mutação de ticket (comentário, atribuição, mudança de status) publica
um evento; o client component do ticket abre uma `EventSource` e recarrega
os dados do servidor ao receber um evento (em vez de tentar sincronizar
estado no client, mantendo o Server Component como fonte de verdade).

Isso funciona corretamente em uma única instância do servidor (o caso do
Vercel Hobby/dev local deste projeto). Não teria efeito de "tempo real"
entre instâncias diferentes de um deploy com múltiplas réplicas.

## Consequências

- Nenhuma dependência de Redis para a feature de realtime funcionar; dá
  para testar manualmente contra `npm run dev` sem Docker.
- Caminho de upgrade documentado: trocar o `EventEmitter` por Redis
  pub/sub (`ioredis`) publicando/assinando o mesmo formato de evento — o
  contrato do endpoint SSE não muda, só a implementação de
  `publishTicketEvent`/`subscribeTicketEvents`. Faz sentido revisitar
  quando BullMQ + Redis entrarem no projeto (fase 5) e houver Redis real
  disponível para testar.
- Cada instância de servidor mantém suas próprias conexões SSE em memória;
  reinício do processo derruba os streams abertos (o client deve
  reconectar, comportamento nativo do `EventSource`).
