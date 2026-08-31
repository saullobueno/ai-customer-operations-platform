# 0003 — Usar PGlite (Postgres em WASM) para testes de integração, Docker Compose só para dev local

## Contexto

O projeto precisa de PostgreSQL (com `pgvector`) e Redis. A máquina de
desenvolvimento usada nesta sessão não tem Docker instalado (`docker` não
existe no PATH, nem via bash nem via PowerShell), então não é possível
subir os serviços via `docker-compose.yml` para rodar testes de integração
localmente nesta sessão. Não é razoável assumir que todo ambiente que rodar
`npm test` (incluindo máquinas de outros agentes/desenvolvedores) tem
Docker disponível, mas o CI (GitHub Actions) tem.

## Decisão

- `docker-compose.yml` continua sendo fornecido e documentado no README
  como forma padrão de rodar Postgres + Redis localmente para `npm run dev`
  (ambiente o mais próximo possível de produção).
- Testes automatizados (Vitest) que precisam de um banco relacional usam
  `@electric-sql/pglite`, um Postgres compilado para WASM que roda embutido
  no processo Node, sem Docker. Drizzle tem driver de primeira classe para
  PGlite (`drizzle-orm/pglite`).
- Código de acesso a Redis/BullMQ é testado com mock/fake de `ioredis` nos
  testes unitários; testes de integração de filas ficam restritos ao CI,
  que sobe Redis real como service container do GitHub Actions.

## Consequências

- `npm test` funciona em qualquer máquina sem exigir Docker.
- PGlite não é 100% idêntico ao Postgres real (algumas extensões e
  comportamentos de concorrência diferem), então testes de queries que
  usam `pgvector` precisam confirmar que a extensão está disponível no
  build do PGlite usado, ou ter um teste smoke equivalente rodando no CI
  contra Postgres real.
- CI é a fonte de verdade final para "os serviços reais funcionam juntos".
