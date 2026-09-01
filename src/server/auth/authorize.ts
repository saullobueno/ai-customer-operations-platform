import { headers } from "next/headers";
import { auth } from "./config";
import type { TicketPermissionAction } from "./permissions";
import { getCurrentSession } from "./session";

export class ForbiddenError extends Error {
  constructor(message = "Você não tem permissão para executar esta ação.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "É necessário estar autenticado.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Garante que existe uma sessão com organização ativa e que o usuário tem
 * a permissão pedida nessa organização. Lança erro tipado em vez de
 * retornar boolean — quem chama não deve seguir em frente silenciosamente.
 */
export async function requireTicketPermission(permissions: {
  ticket: TicketPermissionAction[];
}): Promise<{ userId: string; organizationId: string }> {
  const session = await getCurrentSession();
  if (!session) throw new UnauthorizedError();

  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) throw new UnauthorizedError("Nenhuma organização ativa.");

  const result = await auth.api.hasPermission({
    headers: await headers(),
    body: { organizationId, permissions },
  });

  if (!result.success) throw new ForbiddenError();

  return { userId: session.user.id, organizationId };
}
