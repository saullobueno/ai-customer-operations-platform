# AI Customer Operations Platform — Visão

## Produto

SaaS B2B multi-tenant de atendimento com tickets, inbox omnichannel, knowledge base, SLA, automações, analytics e IA.

## Fluxo principal

Cliente → Canal → Ticket → classificação IA → contexto (cliente/histórico/KB) → sugestão ou automação → agente humano → resolução → CSAT → analytics.

## Personas

- **Super Admin:** administra toda a plataforma.
- **Tenant Admin:** administra a empresa, usuários, canais, IA, SLA e billing.
- **Team Lead:** supervisiona equipes, SLA e distribuição.
- **Agent:** atende clientes.
- **Viewer:** leitura.
- **Customer:** abre e acompanha seus tickets.

## Princípios

- Tenant isolation obrigatório.
- RBAC + object-level authorization.
- Realtime para tickets, mensagens, presença e SLA.
- IA como parte do workflow, não como chatbot isolado.
- Interface B2B densa, limpa e baseada em shadcn/ui.
