# Arquitetura e Dados

## AI architecture

```text
Application
   ↓
AI Gateway
   ↓
Agent Orchestrator
   ├── Classification
   ├── Retrieval
   └── Generation
             ↓
        Models + pgvector
```

## RAG

Document → parser → chunking → embeddings → pgvector → retrieval → reranking → LLM.

Guardar em cada execução:

- sources
- model
- prompt/version
- confidence
- latency
- tokens/cost

## Entidades

Tenant, User, Role, Permission, Team, Customer, Company, Ticket, Conversation, Message, Attachment, Tag, CustomField, KnowledgeBase, Article, Embedding, AIAgent, AIAgentRun, AIUsage, Automation, SLA, Task, Notification, Webhook, Integration, AuditLog, Subscription, Invoice.

## API

/auth
/users
/teams
/customers
/companies
/tickets
/tickets/:id/messages
/tickets/:id/ai
/knowledge
/articles
/ai/agents
/ai/runs
/automations
/sla
/reports
/tasks
/notifications
/integrations
/webhooks
/billing
/audit-logs

## Realtime

WebSocket/SSE para:

- new ticket
- new message
- assignment
- status
- typing
- presence
- SLA
- notifications
