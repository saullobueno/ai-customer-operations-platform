# Claude Code — Workflow de Desenvolvimento

## Arquivos de contexto

```text
CLAUDE.md
AGENTS.md
ARCHITECTURE.md
docs/decisions/
docs/ai/
```

## Workflow

```text
Requirement
  ↓
Claude Code analysis
  ↓
Implementation plan
  ↓
Human review
  ↓
Implementation
  ↓
Tests
  ↓
Code review
  ↓
Refinement
```

Trabalhar por vertical slices, por exemplo:

```text
Ticket creation
├── Database
├── API
├── Validation
├── Permissions
├── UI
├── Realtime
└── Tests
```

## Critério de sucesso

O GitHub deve transmitir:

- React avançado
- backend real
- SaaS architecture
- RAG/AI agents
- realtime
- testes
- segurança
- observability
- pensamento de produto

## Direção visual

Usar shadcn/ui como base, com linguagem próxima de Linear, Vercel, Intercom, Raycast, Stripe Dashboard e GitHub.

Evitar excesso de gradientes, glassmorphism e decoração. Priorizar densidade informacional, hierarquia, acessibilidade e consistência.

## Telas de referência

Foi gerada uma composição visual com Dashboard, Inbox, Ticket, Customers, Knowledge Base, Reports, Settings, Super Admin, Customer Portal e mobile.

Arquivo:
`a_high_resolution_ux_product_specification_dashboa.png`
