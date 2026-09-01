# 0007 — Provedor de IA: GroqCloud, modelo `openai/gpt-oss-120b`

## Contexto

O prompt-mestre sugeria OpenAI/Anthropic via Vercel AI SDK. O usuário
preferiu usar uma chave que já tinha disponível. A primeira tentativa foi
uma API key da **xAI** (Grok) — mas a conta xAI retornou `permission-denied`
em `GET /v1/models` ("newly created team doesn't have any credits or
licenses yet"), então não dava para validar chamadas reais. O usuário então
forneceu uma chave da **GroqCloud** (infraestrutura de inferência rápida da
Groq, Inc. — empresa e produto completamente diferentes de "xAI/Grok",
apesar do nome parecido; a confusão de nomes foi esclarecida explicitamente
com o usuário antes de trocar).

`GET https://api.groq.com/openai/v1/models` com a chave fornecida respondeu
com sucesso, confirmando conta ativa. Modelos de texto disponíveis no
catálogo no momento da implementação: `allam-2-7b`, `groq/compound`,
`groq/compound-mini`, `openai/gpt-oss-120b`, `openai/gpt-oss-20b`,
`openai/gpt-oss-safeguard-20b`, `qwen/qwen3.6-27b`, `qwen/qwen3.8-27b`
(fora modelos de áudio/moderação, que não servem para o caso de uso).

## Decisão

- Usar `@ai-sdk/groq` (Vercel AI SDK) — `src/server/ai/client.ts`,
  `createGroq({ apiKey: env.GROQ_API_KEY })`.
- Modelo padrão: `openai/gpt-oss-120b` (configurável via `AI_MODEL_ID`) —
  modelo open-weight da OpenAI hospedado na Groq, bom equilíbrio entre
  qualidade de instruction-following/saída estruturada e velocidade/custo
  na infra da Groq.
- API é compatível com o formato OpenAI (`/openai/v1/...`), então
  `generateObject`/`generateText` do SDK funcionam sem adaptação.

## Consequências

- Diferente do episódio com xAI, a conta Groq está ativa. **Validado** com
  chamada real (`node --env-file=.env.local .tmp-ai-smoke-test.mjs`,
  script descartado após o teste): `generateObject` com o schema de
  triagem retornou JSON válido e `generateText` gerou uma resposta
  coerente em português — confirma que `openai/gpt-oss-120b` está ativo e
  aceita saída estruturada via Groq.
- Groq também não tem endpoint de embeddings de propósito geral no plano
  usado aqui — a decisão de RAG via full-text search
  ([ADR 0008](0008-rag-full-text-search.md)) continua válida
  independentemente do provedor de chat escolhido.
