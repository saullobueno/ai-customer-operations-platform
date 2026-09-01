# 0009 — Paleta de dados do painel de analytics

## Contexto

O painel `/analytics` (`src/app/(dashboard)/analytics/page.tsx`) mostra a
distribuição de tickets por status e por prioridade. Cores escolhidas "no
olho" são um erro comum (ver skill `dataviz`): precisam ser
colorblind-safe e ter o job certo (categórico vs. sequencial/ordinal).

## Decisão

- **Status** (open/pending/resolved/closed) é categórico sem ordem — usa os
  4 primeiros slots da paleta categórica validada do skill `dataviz`
  (`references/palette.md`): azul, laranja, aqua, amarelo. Validado com
  `scripts/validate_palette.js` (todos os checks PASS; contraste abaixo de
  3:1 em aqua/amarelo é esperado e mitigado por rótulo direto + swatch ao
  lado do texto, nunca cor isolada).
- **Prioridade** (low/medium/high/urgent) é ordinal — usa a rampa
  sequencial azul claro→escuro (steps 250/350/450/600 da rampa do skill),
  não cores categóricas distintas, porque a ordem importa (urgente é "mais"
  que alta, não só "diferente").
- Cores ficam fora do design system de UI (não usam os tokens
  `--color-*` do Tailwind) porque são um canal de codificação de dados, não
  de interface — mesma distinção que o skill `dataviz` faz entre "text
  tokens" e "series color".

## Consequências

- Se o produto ganhar modo escuro de verdade (hoje `.dark` existe no CSS
  mas não é alternado por nenhuma UI — decisão da fase 2), essas cores
  precisam da variante dark da mesma paleta (já documentada em
  `references/palette.md`, não implementada aqui ainda).
