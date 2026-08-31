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
- **IA**: Vercel AI SDK, com Anthropic/OpenAI plugáveis via env vars.
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
não para `npm test` local.

## Estrutura de fases

O projeto é construído em fases sequenciais, cada uma terminando em commit
com a suíte de qualidade verde:

1. Scaffold e tooling (concluída)
2. Fundação técnica — schema multi-tenant, RBAC, auth, design system (concluída)
3. Fluxo vertical de tickets — inbox, comentários, SLA, realtime, audit log
4. Camada de IA — classificação, sumarização, RAG, agente
5. Polimento — filas, billing, e-mail, analytics, CI completo

## Camadas (`src/`)

```
src/app/                 # rotas (App Router) — composição de página, sem regra de negócio
src/app/api/              # route handlers (ex.: catch-all do Better Auth)
src/components/ui/        # design system: primitivos sem estado de negócio (Button, Input, Card…)
src/components/(feature)/ # componentes de feature, compostos a partir de src/components/ui
src/server/db/schema/     # tabelas Drizzle. auth.ts é gerado (não editar à mão — ver abaixo)
src/server/db/client.ts   # instância singleton do Drizzle (postgres-js)
src/server/db/test-utils.ts  # createTestDb() com PGlite, para testes
src/server/auth/          # config do Better Auth (config.ts) + RBAC (permissions.ts)
src/lib/                  # utilitários puros sem I/O (cn(), env.ts)
```

Regra de dependência: `app` pode importar de `components` e `server`;
`components/ui` não importa de `server` nem de `components/(feature)`;
`server` nunca importa de `app` ou `components`. Lógica de negócio (ex.:
"criar ticket e disparar classificação") entra em `src/server/services/`
quando a fase 3 começar — ainda não existe.

### Schema de auth é gerado, não editado

`src/server/db/schema/auth.ts` é produzido por
`npm run auth:generate` a partir de `src/server/auth/config.ts` (plugins do
Better Auth). Mudou a config de plugins (ex.: novo campo, novo plugin)?
Rode `npm run auth:generate` de novo — não edite `auth.ts` manualmente, a
próxima geração sobrescreve. Depois de gerar, rode `npm run db:generate`
para criar a migration SQL correspondente em `drizzle/`.

## Convenções

- Sem comentários explicando o óbvio; comente só quando o motivo não for
  derivável do código.
- Toda decisão de arquitetura/domínio não especificada pelo usuário vira um
  ADR em `docs/decisions/NNNN-titulo-curto.md`.
- Antes de adicionar qualquer dependência, confira a versão atual no
  registry (npm) — nunca assuma de memória.
