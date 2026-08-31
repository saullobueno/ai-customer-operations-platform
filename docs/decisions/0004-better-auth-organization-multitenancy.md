# 0004 — Multi-tenancy e RBAC via Better Auth (plugin organization), sem tabelas próprias

## Contexto

O projeto precisa de multi-tenancy (organizations), users, teams e RBAC. Uma
opção seria modelar `organizations`/`teams`/`memberships` como tabelas de
domínio próprias, desacopladas de auth. Outra é usar o plugin `organization`
do Better Auth, que já modela exatamente esse domínio (organization, member,
team, teamMember, invitation) e integra nativamente com sessão/JWT
(`activeOrganizationId`, `activeTeamId` na sessão).

## Decisão

Usar o schema gerado pelo Better Auth (`better-auth generate`, plugin
`organization` com `teams: { enabled: true }`) como fonte única de verdade
para `user`, `organization`, `team`, `member` (vínculo user↔organization com
role) e `invitation`. Não duplicar esse conceito com tabelas de domínio
próprias.

RBAC é modelado com `createAccessControl` (`src/server/auth/permissions.ts`),
estendendo os statements padrão do plugin com um resource `ticket`
(`create/read/update/delete/assign`) e quatro roles: `owner`, `admin`
(herdam as permissões padrão do plugin + ticket completo), `agent` (role
nova, focada em atender tickets, sem gerência de org/membros/times) e
`member` (somente leitura, sem acesso a tickets). A tabela de tickets em si
só é criada na fase 3; a role já existe agora porque faz parte do
desenho de RBAC da fundação.

O schema gerado é tratado como código gerado (regenerado via
`npm run auth:generate` sempre que a configuração de plugins mudar), não
editado manualmente — exceto para reorganização de arquivo/import, que deve
ser reaplicada após cada regeneração.

## Consequências

- Menos código de domínio para manter; ganhamos hooks/endpoints prontos do
  Better Auth para convites, troca de organização ativa, e checagem de
  permissão (`auth.api.hasPermission`).
- Acoplamento entre o modelo de multi-tenancy e a biblioteca de auth: trocar
  de Better Auth no futuro exigiria migrar esse schema também.
- "Teams" do domínio de suporte (equipes que dividem a inbox) e "teams" do
  Better Auth são o mesmo conceito — evita um resource duplicado.
