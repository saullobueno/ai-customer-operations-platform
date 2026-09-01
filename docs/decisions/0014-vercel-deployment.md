# 0014 — Deploy na Vercel: Postgres hospedado (Neon), sem Redis, e-mail real

## Contexto

O app até aqui só rodou localmente (`npm run dev`), primeiro contra Docker,
depois contra Postgres instalado nativamente nesta máquina (ADR 0012). Para
publicar como peça de portfólio interativa, precisa rodar num host público
— Vercel, já que o projeto é Next.js. Vercel não hospeda serviços com
estado (Postgres, Redis): cada um precisa de um provedor externo, e alguns
recursos do app dependem de suposições que não valem no modelo serverless
da Vercel.

## Decisão

- **Postgres**: [Neon](https://neon.tech) (serverless, tier gratuito,
  integração oficial de um clique com a Vercel). Só troca `DATABASE_URL`;
  nenhum código muda — o app já usa `postgres-js` puro.
- **Redis / worker BullMQ**: **não configurado no lançamento inicial.** O
  botão "Analisar com IA" (`runAiTriageAction` →
  `src/server/services/ai-triage.ts`) chama a IA diretamente, sem fila —
  cobre toda a demonstração interativa. A fila só serve para a triagem
  automática ao criar um ticket, e já é best-effort
  (`enqueueAiTriage` — ver ADR 0010): sem `REDIS_URL` real, essa etapa
  simplesmente não acontece, sem erro visível para o usuário. Redis
  hospedado (ex. Upstash) e um host separado para `npm run worker`
  (funções serverless não sustentam processo de longa duração) ficam para
  se/quando fizer sentido ligar a triagem automática de verdade.
- **Realtime (SSE)**: mantido como está (ADR 0006), com uma ressalva nova
  agora que o alvo é Vercel: o `EventEmitter` em `publisher.ts` vive na
  memória de uma instância de servidor. Na Vercel, uma conexão SSE aberta
  e a ação que dispara o evento podem cair em instâncias serverless
  diferentes — o evento pode nunca chegar. Não quebra nada (a página
  sempre mostra dado fresco ao recarregar/navegar), só perde o
  "atualiza sozinho na tela" de forma consistente. Caminho de upgrade já
  documentado no ADR 0006 (trocar por Redis pub/sub) — natural de revisitar
  junto com a decisão de Redis acima.
- **E-mail (Resend)**: ativado de verdade. O remetente já é
  `onboarding@resend.dev` (domínio sandbox do próprio Resend — não exige
  comprar/verificar domínio próprio), então só precisa de uma
  `RESEND_API_KEY` de uma conta gratuita.
- **Stripe**: mantido mockado (ADR 0011) — `/billing` já deixa isso visível
  na UI; não há motivo de negócio para registrar conta Stripe só para o
  portfólio.
- **Auth**: `BETTER_AUTH_SECRET` de produção é um valor novo, gerado só
  para isso — nunca reaproveitar o placeholder de dev
  (`dev-only-secret-do-not-use-in-production-12345`) nem o valor usado em
  CI. `BETTER_AUTH_URL` vira a URL pública do deploy na Vercel.

## Variáveis de ambiente necessárias na Vercel

```
DATABASE_URL          # connection string do Neon
BETTER_AUTH_SECRET     # gerado novo — nunca o placeholder de dev
BETTER_AUTH_URL        # https://<projeto>.vercel.app (ou domínio próprio)
GROQ_API_KEY            # já existe, só precisa configurar
AI_MODEL_ID              # opcional — default já cobre (openai/gpt-oss-120b)
RESEND_API_KEY           # conta gratuita no Resend
```

`REDIS_URL`, `STRIPE_*` ficam de fora por decisão — o app já degrada bem
sem eles (mesmo padrão best-effort usado localmente).

## Consequências

- Nenhuma mudança de código foi necessária para viabilizar o deploy — só
  configuração de ambiente. Isso confirma que o desenho "modo mock por
  padrão" (ADRs 0010, 0011) pagou o investimento: o app funciona tanto sem
  quanto com os serviços externos configurados.
- Se a triagem automática (fila) ou realtime entre instâncias virarem
  prioridade depois, ambos compartilham a mesma dependência nova (Redis
  hospedado) — faz sentido resolver os dois juntos, não em momentos
  separados.
- Migrations (`drizzle-kit migrate`) precisam rodar manualmente contra o
  Neon antes do primeiro deploy funcionar (schema vazio não serve).
