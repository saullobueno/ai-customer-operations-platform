# 0005 — SLA como política fixa por prioridade, não configurável por organização

## Contexto

"SLA" é um feature explicitamente pedido. A implementação completa (padrão
de produtos como Intercom) permite que cada organização configure sua
própria política de SLA por prioridade/horário comercial/calendário de
feriados. Isso é uma feature de administração inteira por si só, e não é o
foco da fase 3 (fluxo vertical de ticket ponta a ponta).

## Decisão

`computeSlaDueAt` (`src/server/services/sla.ts`) usa uma tabela fixa de
minutos até o vencimento por prioridade (`urgent`/`high`/`medium`/`low`),
igual para todas as organizações. O campo `ticket.slaDueAt` é calculado na
criação do ticket e exibido/usado para alertas de "SLA vencido" na UI —
o comportamento observável de "ter SLA" existe; o que não existe ainda é
uma tela de configuração por organização.

## Consequências

- Zero UI de administração de SLA necessária na fase 3.
- Se o projeto evoluir para demonstrar customização multi-tenant mais a
  fundo, trocar por uma tabela `sla_policy` (organizationId, priority,
  minutes) é uma migração aditiva simples — a função `computeSlaDueAt`
  já isola essa regra em um único lugar.
