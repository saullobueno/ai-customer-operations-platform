import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  adminAc,
  ownerAc,
  memberAc,
} from "better-auth/plugins/organization/access";

/**
 * Estende as permissões padrão do plugin de organização com o resource
 * "ticket", usado pela role de atendimento (agent). A tabela de tickets só
 * chega na fase 3, mas a role já existe desde já — faz parte do desenho de
 * RBAC da fundação técnica (ver ADR 0004).
 */
export const statement = {
  ...defaultStatements,
  ticket: ["create", "read", "update", "delete", "assign"],
} as const;

export const ac = createAccessControl(statement);

const owner = ac.newRole({
  ...ownerAc.statements,
  ticket: ["create", "read", "update", "delete", "assign"],
});

const admin = ac.newRole({
  ...adminAc.statements,
  ticket: ["create", "read", "update", "delete", "assign"],
});

const agent = ac.newRole({
  organization: [],
  member: [],
  invitation: [],
  team: [],
  ac: [],
  ticket: ["create", "read", "update", "assign"],
});

const member = ac.newRole({
  ...memberAc.statements,
  ticket: [],
});

export const roles = { owner, admin, agent, member };
