# AI, Automations e SLA

## AI Overview

KPIs:

- AI resolutions
- suggestions accepted
- automation rate
- deflection
- tokens
- cost
- accuracy feedback

## AI Agents

- Support Agent
- Triage Agent
- Knowledge Agent
- Escalation Agent
- QA Agent

## Agent Builder

Canvas:

```text
Trigger → Classify → Search KB → Confidence?
                         ├─ yes → Generate
                         └─ no  → Human handoff
```

Configuração:
system prompt, model, temperature, tools, knowledge sources, allowed actions, confidence threshold, max iterations, human approval.

## Automations

```text
WHEN ticket.created
IF priority = High
THEN assign Support L2
AND notify Slack
```

Triggers: ticket/customer/message/SLA events.
Actions: assign, status, priority, tag, email, Slack, webhook, task, AI agent.

## SLA

Políticas por prioridade:

- first response
- resolution
- business hours
- holidays
- timezone
- escalation

Exemplo: 80% consumido → aviso; 100% → escalonamento.
