# 0002 — Fixar TypeScript em 6.0.3 em vez da major 7 mais recente

## Contexto

No momento do scaffold (2026-09), `typescript@latest` resolve para `7.0.2`.
Porém `@typescript-eslint/parser` e `@typescript-eslint/eslint-plugin`
(via `typescript-eslint@8.69.0`, usado por `eslint-config-next`) declaram
`peerDependencies.typescript: ">=4.8.4 <6.1.0"` — TypeScript 7.x ainda não é
suportado pela cadeia de lint. Usar TS 7 quebraria o typecheck integrado ao
lint ou exigiria `--legacy-peer-deps`, mascarando incompatibilidades reais.

## Decisão

Fixar `typescript` em `6.0.3` — a versão estável mais recente ainda dentro
do range suportado por `typescript-eslint`. Revisitar quando
`typescript-eslint` publicar suporte a TS 7.

## Consequências

- Lint e typecheck permanecem consistentes sem flags de compatibilidade
  forçada.
- Será necessário atualizar este ADR e o `package.json` quando
  `typescript-eslint` liberar suporte a TS 7.x.
