# 0012 — PGlite para `npm run dev` sem Docker: tentado e descartado; Postgres nativo é a solução

## Contexto

O [ADR 0003](0003-pglite-for-tests.md) já usa PGlite (Postgres em WASM) para
testes automatizados sem exigir Docker, mas mantinha `docker-compose.yml`
como forma padrão de rodar Postgres/Redis para `npm run dev`. Nesta máquina
de desenvolvimento, Docker não está disponível, então `npm run dev` não
conseguia abrir conexão nenhuma com `DATABASE_URL` — sign-up e login
falhavam sempre, mesmo com a UI funcionando normalmente.

## Decisão final

`npm run dev` continua exigindo um Postgres real (Docker via
`docker-compose.yml`, **ou** uma instância instalada nativamente — nesta
máquina, `winget install PostgreSQL.PostgreSQL.17` seguido de `CREATE
DATABASE ai_customer_operations` e `npm run db:migrate`).
`src/server/db/client.ts` permanece exatamente como era antes deste ADR:
só `postgres-js`, sem branch condicional nenhum.

O motivo de não usar PGlite embutido no `npm run dev`, apesar de já ser
usado com sucesso em testes (ADR 0003): três abordagens diferentes foram
tentadas e todas apresentaram falhas reais, não apenas de configuração —
ver seção abaixo. Depois de gastar esforço desproporcional tentando
estabilizar cada uma, a conclusão foi que Postgres nativo (zero WASM, zero
empacotamento por bundler, o mesmo binário que roda em produção) é a via
mais confiável quando Docker não está disponível — mesmo custando uma
instalação de software real em vez de um mock "zero-install".

## Tentativas descartadas

**1. PGlite embutido no processo do Next, sem ajuste nenhum.**
`@electric-sql/pglite` localiza seu binário `.wasm` via `import.meta.url`
relativo a si mesmo — funciona só com resolução de módulo nativa do Node.
Empacotado pelo Turbopack, isso quebra de duas formas: no `next build`, a
fase "Collecting page data" (que importa `db/client.ts` mesmo para rotas
que nunca consultam o banco, ex. `/api/webhooks/stripe`) falhava com
`instantiateWasm is not a function`; no `next dev`, a primeira query
falhava com `TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be
of type string ... Received an instance of URL`.

**2. PGlite embutido + `serverExternalPackages` + guarda de fase de
build.** Corrigindo os dois problemas acima (`serverExternalPackages:
["@electric-sql/pglite"]` no `next.config.ts` para usar `require`/`import`
nativo do Node nesse pacote; `process.env.NEXT_PHASE ===
PHASE_PRODUCTION_BUILD` para pular a inicialização durante o build) e
cacheando a promise de inicialização em `globalThis` para sobreviver ao
Fast Refresh — funcionou de forma confiável por várias sequências completas
de sign-up → onboarding → sign-in → reinício do servidor → login de novo,
validadas via requisições HTTP reais. Mas voltou a falhar de forma
imprevisível mais tarde na mesma sessão, ao abrir `/tickets/[id]` pela
primeira vez: `CREATE SCHEMA IF NOT EXISTS "drizzle"` falhou e o app entrou
num loop infinito de retry (a cada ~5s, via reconexão do SSE de eventos do
ticket — ver ADR 0006) tentando reabrir o PGlite e falhando pra sempre, sem
nenhuma edição de arquivo ter acontecido nesse meio tempo. Padrão errático,
sem gatilho determinístico no código — consistente com antivírus/Windows
Defender interferindo em tempo real nas muitas escritas de arquivo pequenas
que o PGlite faz (não confirmado a fundo, dado o custo de investigar).

**3. PGlite como processo separado, falando o protocolo real do Postgres**
via `@electric-sql/pglite-socket` (`PGLiteSocketServer`), com `npm run dev`
apontando `DATABASE_URL` para `postgresql://localhost:5432/...` como se
fosse Postgres de verdade — eliminaria de vez qualquer problema de
empacotamento do WASM, já que `postgres-js` não muda nada. Descartada:
mesmo com um único cliente `postgres-js` (`?max=1`), uma sessão criada numa
requisição (sign-up) não ficava visível de forma confiável numa leitura em
requisição seguinte (`ERROR [Better Auth]: Failed query: select ... from
"session"` logo após um sign-up bem-sucedido) — o próprio README do
`pglite-socket` avisa que o multiplexador de conexões "é diferente de uma
instalação normal do Postgres, então nem todo caso de uso tem garantia de
funcionar". Reproduzido em teste isolado com duas conexões `postgres-js`
sequenciais contra o mesmo servidor.

## Efeito colateral encontrado, independente do PGlite: schema de auth desatualizado

Ao validar sign-up de ponta a ponta (em qualquer uma das tentativas acima),
o Better Auth falhava com `BetterAuthError: The field "issuer" does not
exist in the "account" Drizzle schema` — reproduzível também contra
Postgres real, então não é causado por nada deste ADR. Causa:
`@better-auth/cli` (gerador do schema, `^1.4.21` fixado no `package.json`)
está desatualizado em relação ao core `better-auth` (`^1.7.2`) — não existe
versão publicada do CLI compatível com o core atual no momento (`npm view
@better-auth/cli version` → `1.4.21`, mesma versão instalada). Rodar `npm
run auth:generate` de novo não resolve porque o CLI antigo não conhece o
campo `issuer`, adicionado ao modelo `account` em uma versão mais recente
do core.

Correção (mantida, independente do resto deste ADR): `issuer` foi
adicionado manualmente em `src/server/db/schema/auth.ts`
(`text("issuer").notNull()`) e uma migration
(`drizzle/0003_flat_malcolm_colcord.sql`) foi gerada via `db:generate` — a
única exceção conhecida à regra "não editar `auth.ts` à mão" (ver
AGENTS.md), válida enquanto `@better-auth/cli` não publicar uma versão que
acompanhe o core.

## Consequências

- `npm run dev` sem Docker exige instalar Postgres nativamente — não é
  "zero instalação", mas é o caminho testado por milhões de devs Windows,
  sem surpresas de empacotamento/WASM. Documentado no README.
- `src/server/db/client.ts` e `next.config.ts` permanecem simples, sem
  nenhum branch condicional para ambiente local — reduz superfície de bugs
  específicos de dev.
- Fica uma dependência de fato desalinhada (`@better-auth/cli` atrás de
  `better-auth`) que precisa de atenção manual a cada mudança de
  plugin/campo até o upstream corrigir — checar `npm view @better-auth/cli
version` ao investigar qualquer erro de "campo não existe no schema
  Drizzle".
- Se uma versão futura de `@electric-sql/pglite`/`pglite-socket` corrigir
  os problemas de empacotamento e de consistência entre conexões descritos
  acima, vale reconsiderar — mas não retomar sem reproduzir os dois testes
  que causaram o descarte (nova rota compilada pela primeira vez com o
  servidor já de pé; duas conexões `postgres-js` sequenciais).
