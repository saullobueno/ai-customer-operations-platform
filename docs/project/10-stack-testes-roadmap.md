# Stack, Testes e Roadmap

## Stack

### Frontend

Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query/Table, Zustand, React Hook Form, Zod, ECharts.

### Backend

NestJS ou API do Next.js, PostgreSQL, Drizzle ORM, Redis, BullMQ, WebSockets/SSE.

### AI

Vercel AI SDK, Anthropic/OpenAI, pgvector, RAG, tool calling, agent orchestration.

### Infra

Docker, GitHub Actions, S3-compatible storage, OpenTelemetry, Sentry.

### Quality

Vitest, Playwright, Storybook, ESLint, Prettier, TypeScript strict.

## Segurança

- tenant isolation
- RBAC
- object-level authorization
- rate limiting
- validação Zod
- API key hashing
- audit logs
- signed URLs
- CSP/security headers
- secure file uploads

## Testes

### Unit

regras de negócio, validators, permissions, SLA, parsers.

### Integration

tickets, assignment, SLA, RAG, webhooks, billing.

### E2E

login, criação/resolução de ticket, AI suggestion, customer portal, RBAC, admin e billing.

## Observability

HTTP, DB, Redis, queues, AI, WebSockets e integrações.
Métricas: latency, count, errors, queue depth, AI latency/tokens/cost, resolution time e SLA breach.

## Roadmap

1. Foundation: monorepo, auth, DB, tenant isolation, UI, CI.
2. Core Support: customers, tickets, conversations, inbox, teams.
3. Knowledge: articles, search, embeddings, RAG.
4. AI: classification, summaries, suggestions, agents, handoff.
5. Automation: rules, triggers, actions, SLA.
6. Analytics: dashboard, reports, CSAT.
7. Integrations: Email, Slack, WhatsApp, webhooks, API.
8. Billing: plans, Stripe, usage, invoices.
9. Platform Admin.
10. Polish: accessibility, performance, mobile, PWA, security, observability.

## Ordem das telas

Login → Onboarding → Dashboard → Inbox → Ticket → Customer → Knowledge Base → AI Agent → Automations → Reports → Settings → Customer Portal → Super Admin.
