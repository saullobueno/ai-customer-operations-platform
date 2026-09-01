# 0011 — Billing via Stripe (modo teste) implementado, sem chave configurada nesta instância

## Contexto

O prompt-mestre pede Stripe em modo teste. Diferente da situação de IA
(ADR 0007), criar uma conta Stripe de teste é gratuito e não pede cartão —
mas pedir mais uma chave ao usuário nesta sessão (depois de duas trocas de
provedor de IA) teria custo desproporcional ao valor de "billing" como
feature secundária de um portfólio focado em atendimento ao cliente.

## Decisão

Implementar a integração de verdade (`src/server/billing/`,
`src/app/api/webhooks/stripe/route.ts`), mas deixá-la em **modo mock por
padrão**, sem pedir a chave ao usuário:

- `src/server/billing/client.ts`: `stripe` é `null` sem
  `STRIPE_SECRET_KEY` — mesmo padrão de `resend` (e-mail) e
  `enqueueAiTriage` (fila): quem chama trata a ausência como estado
  esperado, não como erro.
- `createProPlanCheckoutSession` retorna `{ mocked: true }` sem
  `STRIPE_SECRET_KEY`/`STRIPE_PRICE_ID_PRO`; com as duas configuradas, cria
  uma sessão de Stripe Checkout real (modo assinatura) e retorna a URL.
- O webhook (`checkout.session.completed`) verifica a assinatura
  (`stripe.webhooks.constructEvent`) e registra um audit log — não há
  campo `plan` na organização (schema gerado pelo Better Auth, ADR 0004);
  adicionar isso é aditivo e fica para quando a integração for validada de
  verdade.
- `/billing` mostra plano "Free" fixo e um botão de upgrade que, em modo
  mock, só volta para a mesma página com uma explicação visível.

## Consequências

- **Não validado contra a API real da Stripe** — diferente da camada de
  IA (ADR 0007), que foi validada com chamada real assim que uma chave
  funcional apareceu. Os testes (`checkout.test.ts`) mockam o SDK da
  Stripe inteiro; nada aqui prova que `stripe.checkout.sessions.create`
  aceita exatamente esse payload.
- Para ativar de verdade: criar conta Stripe (grátis, sem cartão em modo
  teste), configurar `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` e
  `STRIPE_PRICE_ID_PRO` no `.env.local`, e então validar manualmente um
  checkout de teste antes de considerar esta fase encerrada de fato —
  mesma disciplina do [ADR 0007](0007-ai-provider-groq.md).
