# AI Customer Operations Platform

Peça de portfólio: plataforma de atendimento B2B multi-tenant (na linha
Intercom + Linear + agente de IA). Um cliente abre um ticket, o sistema
identifica a organização, busca histórico e documentação relevante (RAG),
classifica o problema, sugere uma resposta, determina prioridade e
encaminha para a equipe certa — com tudo registrado em audit log.

> Projeto de demonstração: sem dados de usuários reais, sem serviços pagos.
> Integrações externas (IA, e-mail, pagamento) usam tiers gratuitos ou modo
> de teste/simulado. Decisões de arquitetura estão documentadas como ADRs em
> [`docs/decisions/`](docs/decisions/).

## Stack

| Camada      | Tecnologia                                        |
| ----------- | ------------------------------------------------- |
| Framework   | Next.js 16 (App Router), React 19, TypeScript     |
| Estilo      | Tailwind CSS v4                                   |
| Banco       | PostgreSQL + pgvector, via Drizzle ORM            |
| Cache/filas | Redis + BullMQ                                    |
| Auth        | Better Auth                                       |
| IA          | Vercel AI SDK + GroqCloud (`openai/gpt-oss-120b`) |
| Pagamento   | Stripe (modo teste, mockado sem chave)            |
| E-mail      | Resend (mockado sem chave)                        |
| Testes      | Vitest + Testing Library                          |
| CI          | GitHub Actions                                    |

## Rodando localmente

Pré-requisitos: Node.js 24+, npm, e Docker (para Postgres/Redis via
`docker-compose`) — ou aponte `DATABASE_URL`/`REDIS_URL` para instâncias
próprias.

```bash
cp .env.example .env.local   # preencha os valores necessários
docker compose up -d          # sobe Postgres (pgvector) + Redis
npm install
npm run dev
npm run worker                # em outro terminal — processa a triagem de IA em fila (BullMQ)
```

Abra [http://localhost:3000](http://localhost:3000).

### Sem Docker

Instale o PostgreSQL localmente (ex.: `winget install PostgreSQL.PostgreSQL.17`
no Windows) e aponte `DATABASE_URL` no `.env.local` para essa instância —
ver [ADR 0012](docs/decisions/0012-pglite-for-local-dev.md), que documenta
por que um Postgres real embutido no processo (PGlite) foi tentado e
descartado para o `npm run dev` nesta máquina. Redis é opcional: sem ele, a
triagem de IA automática (fila BullMQ) fica desativada, mas o restante do
app funciona normalmente e a triagem pode ser disparada manualmente pela
UI.

## Deploy (Vercel)

Ver [ADR 0014](docs/decisions/0014-vercel-deployment.md) para o raciocínio
completo. Passo a passo:

1. **Banco**: crie um projeto gratuito em [neon.tech](https://neon.tech) e
   copie a connection string.
2. **E-mail**: crie uma conta gratuita em [resend.com](https://resend.com)
   e gere uma API key — não precisa verificar domínio próprio, o remetente
   já usa o domínio sandbox `onboarding@resend.dev`.
3. **IA**: já existe uma `GROQ_API_KEY` (console.groq.com).
4. Rode as migrations contra o banco do Neon:
   ```bash
   DATABASE_URL="<connection string do Neon>" npx drizzle-kit migrate
   ```
5. Importe o repositório na Vercel (vercel.com → New Project → Import do
   GitHub) e configure as variáveis de ambiente:
   ```
   DATABASE_URL      = <connection string do Neon>
   BETTER_AUTH_SECRET = <gere um valor novo, ex.: openssl rand -base64 32 — nunca reaproveite o de dev>
   BETTER_AUTH_URL    = https://<seu-projeto>.vercel.app
   GROQ_API_KEY        = <sua chave>
   RESEND_API_KEY      = <sua chave>
   ```
6. Deploy. `REDIS_URL` e as chaves do Stripe ficam de fora de propósito —
   o app já funciona sem elas (triagem de IA fica manual via UI, billing
   fica em modo mock).

## Scripts

```bash
npm run dev             # servidor de desenvolvimento
npm run typecheck       # tsc --noEmit
npm run lint            # eslint .
npm run format           # prettier --write .
npm run format:check     # prettier --check .
npm run test             # vitest run
npm run test:coverage    # vitest run --coverage
npm run build             # next build
npm run worker             # worker BullMQ da fila ai-triage (processo separado do `dev`)

npm run auth:generate    # regenera src/server/db/schema/auth.ts a partir da config do Better Auth
npm run db:generate      # gera migration SQL a partir do schema Drizzle
npm run db:push          # aplica o schema direto no banco (dev)
npm run db:studio        # abre o Drizzle Studio
```

Testes que precisam de um banco relacional rodam contra
[PGlite](https://pglite.dev/) (Postgres em WASM), não exigindo Docker — ver
[ADR 0003](docs/decisions/0003-pglite-for-tests.md).

## Estrutura de fases

O projeto foi construído em fases sequenciais, cada uma terminando em um
commit com typecheck, lint, testes e build passando:

1. **Scaffold e tooling** ✅ — Next.js, lint, formatter, testes, CI básico.
2. **Fundação técnica** ✅ — schema multi-tenant (organization, user, team,
   member/RBAC via Better Auth), autenticação, design system base.
3. **Fluxo vertical de tickets** ✅ — cliente abre chamado em `/report`,
   equipe atende pela inbox (`/inbox` → `/tickets/[id]`): comentários
   públicos e notas internas, atribuição, status, tags, SLA, atualização em
   tempo real via SSE, notificações e audit log.
4. **Camada de IA** ✅ — classificação de tickets, sentimento, resumo e
   resposta sugerida via GroqCloud (`openai/gpt-oss-120b`); RAG via
   full-text search do Postgres sobre uma base de conhecimento
   (`/knowledge-base`); agente de triagem acionável pelo agente humano em
   `/tickets/[id]`. Validado com chamada real à API — ver
   [ADR 0007](docs/decisions/0007-ai-provider-groq.md).
5. **Polimento** ✅ — filas assíncronas (BullMQ processa a triagem de IA em
   background na criação do ticket, com fallback manual — ver
   [ADR 0010](docs/decisions/0010-bullmq-async-triage.md)), painel de
   analytics (`/analytics`), busca de tickets na inbox, notificação por
   e-mail na atribuição de ticket, anexos por URL, billing via Stripe
   Checkout (`/billing`, mockado sem chave — ver
   [ADR 0011](docs/decisions/0011-stripe-billing-mocked.md)) e CI com
   serviço Redis real validando a fila de ponta a ponta.

## O que está validado contra serviços reais vs. mockado

| Integração          | Status                                                                             |
| ------------------- | ---------------------------------------------------------------------------------- |
| GroqCloud (IA)      | ✅ Validado com chamada real à API (ver ADR 0007)                                  |
| Fila BullMQ + Redis | ✅ Validado no CI contra um serviço Redis real (`redis-integration.test.ts`)       |
| Postgres + Drizzle  | ✅ Validado via PGlite (Postgres real) em todos os testes de integração            |
| Stripe (billing)    | 🟡 Implementado, não validado contra API real — modo mock sem chave (ver ADR 0011) |
| Resend (e-mail)     | 🟡 Implementado, não validado contra API real — modo mock sem chave                |

## Documentação para agentes

Ver [`AGENTS.md`](AGENTS.md) (também referenciado por `CLAUDE.md`) para
convenções de código, comandos e o estado atual das fases.
