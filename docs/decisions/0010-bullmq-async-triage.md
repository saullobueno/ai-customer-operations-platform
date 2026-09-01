# 0010 — Triagem de IA assíncrona via BullMQ, best-effort na criação do ticket

## Contexto

O prompt-mestre pede filas assíncronas (BullMQ + Redis). O candidato óbvio
de trabalho assíncrono no domínio é a triagem de IA (fase 4): rodar
classificação + RAG + resposta sugerida toda vez que um ticket é criado,
sem bloquear a resposta ao cliente que está abrindo o chamado.

Sem Docker nesta máquina (ADR 0003), não dá para rodar Redis localmente
para testar a fila de ponta a ponta durante o desenvolvimento.

## Decisão

- `src/server/queue/ai-triage-queue.ts#enqueueAiTriage` enfileira um job
  `{ ticketId }` na fila `ai-triage` sempre que um ticket é criado pelo
  formulário público (`submitPublicTicketAction`).
- `src/server/queue/workers/ai-triage-worker.ts` roda um `Worker` do
  BullMQ que processa esses jobs chamando `runTicketTriage` — o mesmo
  agente da fase 4, só que disparado automaticamente em vez de manualmente
  pelo botão "Analisar com IA" (que continua existindo e funcionando).
- O processor (`processAiTriageJob`) é uma função isolada do BullMQ — dá
  para testar sem Redis, mockando `runTicketTriage`.
- `enqueueAiTriage` é **best-effort**: erro ao enfileirar (ex.: Redis fora
  do ar) é logado, não propagado — criar um ticket nunca deve falhar por
  causa da fila. O agente humano sempre pode rodar a triagem manualmente.
- O worker roda como processo separado (`npm run worker`, via `tsx`), fora
  do processo do Next.js — é assim que BullMQ funciona em produção (não dá
  para rodar um worker de fila dentro de uma função serverless de
  request/response).
- Validação real da mecânica de fila/worker (enfileirar → worker processar)
  fica no CI: `src/server/queue/redis-integration.test.ts` roda contra um
  serviço `redis:8-alpine` de verdade no GitHub Actions; localmente o
  describe é pulado (`describe.skipIf`) porque não há Redis disponível.

## Consequências

- A triagem automática na criação do ticket nunca foi validada
  manualmente de ponta a ponta nesta máquina (sem Redis local) — só a
  mecânica de fila (CI) e a lógica de triagem (testes mockados + chamada
  real à API, fase 4) foram validadas separadamente. Rodar
  `docker compose up -d && npm run worker` num ambiente com Docker fecha
  essa lacuna.
- `npm run dev` sozinho não processa triagens automáticas — é preciso
  também rodar `npm run worker` num terminal separado (documentado no
  README).
