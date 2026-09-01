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
| Pagamento   | Stripe (modo teste)                               |
| E-mail      | Resend                                            |
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
```

Abra [http://localhost:3000](http://localhost:3000).

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
5. **Polimento** — filas assíncronas, billing, e-mail transacional,
   analytics, CI completo.

## Documentação para agentes

Ver [`AGENTS.md`](AGENTS.md) (também referenciado por `CLAUDE.md`) para
convenções de código, comandos e o estado atual das fases.
