# 0008 — RAG via full-text search do Postgres, não embeddings/pgvector

## Contexto

O prompt-mestre pede "semantic search" e "RAG" com `pgvector`. Isso
pressupõe um modelo de embeddings. O provedor de IA configurado
(GroqCloud — ver [ADR 0007](0007-ai-provider-groq.md)) não oferece
embeddings de propósito geral no plano usado. As alternativas eram:

1. Pedir uma segunda API key só para embeddings (OpenAI, Cohere etc.) —
   contraria a preferência do usuário por usar só a chave que ele forneceu.
2. Rodar um modelo de embeddings local (`@huggingface/transformers`,
   ONNX/WASM, sem custo nem API key) — tecnicamente viável, mas adiciona
   dependência nativa pesada, download de modelo (~90MB+) e mais uma
   variável de ambiente de teste (Docker não disponível para validar contra
   Postgres real, e a extensão `vector` do PGlite teria que ser carregada e
   testada do zero) para um ganho que, numa base de conhecimento com poucos
   artigos de exemplo, não se traduz em resultados de busca perceptivelmente
   melhores que full-text search.
3. Usar busca textual nativa do Postgres (`to_tsvector`/`plainto_tsquery`/
   `ts_rank`) — sem dependência nova, funciona idêntico em PGlite e Postgres
   real, zero custo, zero chave adicional.

## Decisão

RAG usa full-text search nativa do Postgres:
`src/server/services/knowledge-base.ts#searchKnowledgeBase` roda
`to_tsvector('portuguese', title || ' ' || content) @@ to_tsquery('portuguese', :orQuery)`
ordenado por `ts_rank`, sem coluna gerada nem índice GIN dedicado (poucos
artigos esperados; se a base crescer, adicionar coluna `tsvector` gerada +
índice GIN é uma migração aditiva simples).

`:orQuery` junta os termos da busca com `|` (OR) em vez de usar
`plainto_tsquery` (que faz AND entre todos os termos) — para recuperação de
contexto de RAG queremos o artigo mais relevante entre os que batem com
_algum_ termo, não só os que batem com todos.

`docker-compose.yml` continua usando a imagem `pgvector/pgvector` — não
custa nada mantê-la, e deixa a porta aberta para trocar por embeddings de
verdade no futuro sem reescrever a infra.

## Consequências

- "Busca semântica" no sentido estrito (por significado, não por palavra)
  não existe hoje — é busca textual com stemming/ranking do Postgres. Para
  os artigos de exemplo do seed, isso é suficiente para demonstrar o fluxo
  RAG (recuperar contexto relevante → injetar no prompt do agente).
- Caminho de upgrade documentado: trocar `searchKnowledgeBase` por uma
  query com `<=>` (distância de cosseno) sobre uma coluna `vector`,
  alimentada por `@huggingface/transformers` local ou por um provedor de
  embeddings, quando fizer sentido revisitar.
