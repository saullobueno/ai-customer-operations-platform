# 0001 — Usar npm como package manager

## Contexto

O prompt-mestre do projeto não especifica package manager. `pnpm` é comum
nesse tipo de stack (rápido, eficiente em disco), mas a máquina de
desenvolvimento não tem `pnpm` instalado globalmente, e `corepack enable`
falhou por exigir permissão de administrador para escrever em
`C:\Program Files\nodejs`. `npm` 11.18 já vem com o Node 24 instalado e
funciona sem fricção adicional.

## Decisão

Usar `npm` (versão que acompanha o Node instalado) como package manager do
projeto, com `package-lock.json` versionado.

## Consequências

- Nenhuma dependência extra de setup para rodar o projeto localmente ou em
  CI (GitHub Actions já tem npm disponível via `actions/setup-node`).
- Se no futuro for necessário um monorepo com múltiplos workspaces, pode
  valer a pena revisitar `pnpm` — hoje o projeto é um único app Next.js,
  então a vantagem de workspaces do pnpm não se aplica.
