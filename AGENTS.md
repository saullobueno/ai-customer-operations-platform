<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AI Customer Operations Platform

Peça de portfólio: plataforma de atendimento B2B multi-tenant (estilo
Intercom + Linear + agente de IA). Ticket entra, o sistema identifica o
cliente, busca histórico e documentação (RAG), classifica, sugere resposta,
prioriza e encaminha — tudo registrado em audit log.

Não é um produto real: sem dados de usuários reais, sem custo além de tiers
gratuitos. Ver `docs/decisions/` para o histórico de decisões de arquitetura
(ADRs).

## Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 6.0.3 (fixado
  abaixo da 6.1 porque `typescript-eslint` ainda não suporta a major 7 — ver
  [0002](docs/decisions/0002-typescript-6-pin.md)).
- **Estilo**: Tailwind CSS v4.
- **Dados**: PostgreSQL + `pgvector` via Drizzle ORM; Redis + BullMQ para
  filas assíncronas.
- **Auth**: Better Auth.
- **IA**: Vercel AI SDK + GroqCloud (`openai/gpt-oss-120b`, configurável via
  `AI_MODEL_ID`) — ver [0007](docs/decisions/0007-ai-provider-groq.md). RAG
  usa full-text search do Postgres, não embeddings — ver
  [0008](docs/decisions/0008-rag-full-text-search.md).
- **Pagamento/E-mail**: Stripe (modo teste) e Resend.
- **Package manager**: npm (ver [0001](docs/decisions/0001-package-manager-npm.md)).

## Comandos

```
npm run dev             # servidor de desenvolvimento
npm run typecheck       # tsc --noEmit
npm run lint            # eslint .
npm run format           # prettier --write .
npm run format:check     # prettier --check .
npm run test             # vitest run
npm run test:watch       # vitest (watch mode)
npm run test:coverage    # vitest run --coverage
npm run build             # next build
npm run worker            # processa a fila ai-triage (BullMQ) — rodar em paralelo ao `dev` para triagem automática
```

Rode `typecheck`, `lint`, `format:check`, `test` e `build` antes de
considerar qualquer fase concluída — é a mesma suíte que roda no CI
(`.github/workflows/ci.yml`).

## Banco de dados e testes — sem Docker nesta máquina

`docker-compose.yml` sobe Postgres (`pgvector/pgvector`) e Redis para uso
com `npm run dev`, mas Docker não está instalado nesta máquina de
desenvolvimento. Testes automatizados que precisam de Postgres usam
`@electric-sql/pglite` (Postgres em WASM, sem Docker) — ver
[0003](docs/decisions/0003-pglite-for-tests.md). Não assuma que Docker está
disponível ao escrever testes; se uma feature só pode ser validada contra
Postgres/Redis reais, isso fica para o CI (que sobe os serviços de verdade),
não para `npm test` local. Padrão para esse caso:
`describe.skipIf(!await isServiceAvailable())` no topo do arquivo de teste
(ver `src/server/queue/redis-integration.test.ts`) — pula localmente sem
quebrar, roda de verdade no CI.

## Estrutura de fases

O projeto é construído em fases sequenciais, cada uma terminando em commit
com a suíte de qualidade verde:

1. Scaffold e tooling (concluída)
2. Fundação técnica — schema multi-tenant, RBAC, auth, design system (concluída)
3. Fluxo vertical de tickets — inbox, comentários, SLA, realtime, audit log (concluída)
4. Camada de IA — classificação, sumarização, RAG, agente (concluída)
5. Polimento — filas, billing, e-mail, analytics, CI completo

## Camadas (`src/`)

```
src/app/                 # rotas (App Router) — composição de página, sem regra de negócio
src/app/api/              # route handlers (catch-all do Better Auth, SSE de eventos de ticket)
src/components/ui/        # design system: primitivos sem estado de negócio (Button, Input, Card…)
src/components/(feature)/ # componentes de feature (ex.: components/tickets), compostos a partir de components/ui
src/server/db/schema/     # tabelas Drizzle. auth.ts é gerado (não editar à mão — ver abaixo)
src/server/db/client.ts   # instância singleton do Drizzle (postgres-js)
src/server/db/test-utils.ts  # createTestDb() com PGlite, para testes
src/server/auth/          # config do Better Auth (config.ts), RBAC (permissions.ts), sessão/authorize
src/server/services/      # lógica de negócio pura (recebe `db` por parâmetro — ver AppDatabase em types.ts)
src/server/actions/       # Server Actions ("use server") — ponte fina entre forms e services, com checagem de RBAC
src/server/realtime/      # publisher/subscriber de eventos em processo (ver ADR 0006)
src/server/ai/            # client do provedor de IA (client.ts) + prompts/schemas (triage.ts) — sem `db`
src/server/queue/         # BullMQ: enqueueAiTriage (produtor) + workers/ (consumidor, roda via `npm run worker`)
src/lib/                  # utilitários puros sem I/O (cn(), env.ts) + client do Better Auth (auth-client.ts)
```

Regra de dependência: `app` pode importar de `components`, `server/actions`
e `server/auth/session`; `components/ui` não importa de `server` nem de
`components/(feature)`; `server/services` nunca importa de `app`,
`components` nem de `server/actions` (a lógica de negócio não sabe que
existe uma UI ou uma Server Action chamando ela — é só `db` + tipos de
domínio). `server/actions` é a única camada que faz RBAC
(`requireTicketPermission`) e chama `revalidatePath`/`publishTicketEvent`.

### Schema de auth é gerado, não editado

`src/server/db/schema/auth.ts` é produzido por
`npm run auth:generate` a partir de `src/server/auth/config.ts` (plugins do
Better Auth). Mudou a config de plugins (ex.: novo campo, novo plugin)?
Rode `npm run auth:generate` de novo — não edite `auth.ts` manualmente, a
próxima geração sobrescreve. Depois de gerar, rode `npm run db:generate`
para criar a migration SQL correspondente em `drizzle/`.

## Testes de IA não fazem chamada de rede

Toda chamada a `generateObject`/`generateText` (pacote `ai`) é mockada nos
testes via `vi.mock("ai", ...)` e `vi.mock("@/server/ai/client", ...)` — ver
`src/server/ai/triage.test.ts` e `src/server/services/ai-triage.test.ts`.
Isso valida o formato do prompt e o parsing da resposta, não se o modelo
está ativo ou aceita o schema — para isso, depois de qualquer mudança em
`src/server/ai/`, rode manualmente uma chamada real (script descartável com
`node --env-file=.env.local`, como feito para validar o [ADR 0007](docs/decisions/0007-ai-provider-groq.md))
antes de considerar a mudança pronta.

## Convenções

- Sem comentários explicando o óbvio; comente só quando o motivo não for
  derivável do código.
- Toda decisão de arquitetura/domínio não especificada pelo usuário vira um
  ADR em `docs/decisions/NNNN-titulo-curto.md`.
- Antes de adicionar qualquer dependência, confira a versão atual no
  registry (npm) — nunca assuma de memória.
