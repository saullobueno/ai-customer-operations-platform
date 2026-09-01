# 0013 — Documento mestre em `docs/project/` vs. escopo implementado

## Contexto

O usuário forneceu `docs/project/ai-customer-operations-platform/` (11
arquivos) e `docs/Document Project.png`: a especificação completa e
aspiracional do produto — um SaaS B2B de atendimento no nível de
Intercom/Zendesk, com Super Admin de plataforma, Agent Builder (canvas de
IA), motor de automação com triggers/actions, SLA com horário
comercial/escalonamento, Companies, Tasks, Teams com filas próprias,
múltiplos canais (email/chat/WhatsApp/API), integrações (Slack, Zapier,
Stripe, Mailchimp, Sentry), Customer Portal completo com app mobile/PWA, e
mais de uma dezena de módulos de Settings.

Esse documento já era, na prática, o "prompt-mestre" referenciado nos ADRs
anteriores (0007, 0011) — não é uma especificação nova, é a primeira vez
que ele foi anexado ao repositório por completo. O app já construído
(fases 1–5) sempre foi um subconjunto deliberadamente reduzido dessa visão,
e os ADRs anteriores já documentam vários desses cortes pontuais (RAG via
full-text search em vez de embeddings — ADR 0008; billing mockado — ADR
0011; realtime em processo em vez de infra dedicada — ADR 0006).

Pedido do usuário: "Analise tudo e implemente. Vou sair agora e faça o
máximo de coisas na minha ausência. Volto em 1h30m." — uma janela de tempo
real, não hipotética. Implementar a visão completa é trabalho de meses de
um time; não cabe no orçamento de tempo nem seria seguro entregar sem
revisão humana (o próprio documento, em `11-claude-code.md`, pede plano →
revisão humana → implementação, não implementação direta de tudo).

## Decisão

Nesta sessão, implementado apenas o que já vinha sendo discutido
diretamente com o usuário nas mensagens anteriores (as duas lacunas que
ele mesmo apontou) e que o documento mestre confirma como parte da visão:

1. **Portal do cliente — acompanhar tickets** (`06-ai-automation-sla.md`
   não, mas `08-admin-client.md § Customer Portal` e a tela 6.9 do PNG):
   `/report/track` (buscar por e-mail) e `/report/tickets/[id]` (thread
   somente com comentários públicos + resposta), usando o par
   (organização, e-mail do cliente) como credencial — não há sessão
   autenticada de cliente nesta versão, então não há "Account tab" nem
   histórico entre organizações diferentes.
2. **E-mails ao cliente**: confirmação de abertura e aviso de nova
   resposta do agente, ambos com link de acompanhamento — mockados sem
   `RESEND_API_KEY`, mesmo padrão do resto do projeto.
3. **Gestão de membros** (`07-reports-settings.md § Settings > Members`,
   `02-navegacao.md`): `/settings/members` lista membros e convites
   pendentes, convida por e-mail e cancela convite, usando a API de
   convite que o plugin de organização do Better Auth já expõe
   (`createInvitation`/`listInvitations`/`cancelInvitation`) — nenhuma
   tabela nova, o schema já suportava isso desde a fundação (ADR 0004).
   `/accept-invitation/[id]` aceita/recusa; login/cadastro ganharam
   `?next=` para voltar ao convite depois de autenticar.

## Fora do escopo desta sessão (não implementado)

Todo o resto do documento mestre continua não implementado — não é
esquecimento, é corte deliberado por tamanho:

- **Super Admin de plataforma** (`08-admin-client.md § Super Admin`):
  overview, tenants, impersonate, planos, AI usage cross-tenant. Este
  projeto sempre foi single-tenant-view-per-login (cada usuário só vê a
  própria organização) — dar a alguém visão de todos os tenants é um
  modelo de permissão inteiramente novo, não uma tela a mais.
- **Agent Builder / múltiplos AI Agents** (`06-ai-automation-sla.md`): hoje
  existe um fluxo de triagem fixo (ADR 0007). Canvas de configuração,
  múltiplos agentes (Triage/Knowledge/Escalation/QA) e handoff configurável
  não existem.
- **Motor de automação** (`WHEN/IF/THEN` triggers/actions) e **SLA com
  horário comercial/feriados/escalonamento**: hoje SLA é só um prazo fixo
  por prioridade (ADR 0005); não há regras configuráveis nem automações.
- **Companies, Tasks, Teams com filas/regras próprias**: não existem essas
  entidades; `team` já existe no schema (gerado pelo Better Auth) mas não é
  usado por nenhuma feature.
- **Canais** (chat/WhatsApp/API além do form web) e **integrações**
  (Slack, Zapier, Mailchimp, Sentry, Google Analytics): nada implementado.
- **Settings** além de Members: General, Security (2FA/SSO/IP allowlist),
  Custom Fields, Tags (gestão centralizada — hoje tag só existe por
  ticket), Canned Responses, Business Hours, Notifications, Integrations,
  Audit Logs (a tabela `audit_log` já é escrita por várias ações, mas não
  tem UI de leitura).
- **Mobile/PWA** do portal do cliente.

## Consequências

- O app entregue nesta sessão cobre um pouco mais do fluxo ponta-a-ponta
  "cliente abre ticket → acompanha → equipe convida colegas", mas
  continua sendo uma peça de portfólio focada, não uma implementação do
  documento mestre inteiro.
- Se o usuário quiser priorizar algum dos itens de "fora do escopo" listados
  acima, cada um é grande o suficiente para merecer sua própria decisão de
  escopo (e provavelmente seu próprio ADR) antes de começar — não são
  "só mais uma tela".
- `docs/project/` foi removido do repositório (decisão do usuário, depois
  desta sessão): o documento mestre não vai ser implementado aqui — fica
  para um projeto separado no futuro. Este ADR continua valendo como
  registro de que a visão completa existiu e de quais partes dela foram
  trazidas para este projeto.
