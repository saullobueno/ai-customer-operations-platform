import { headers } from "next/headers";
import { auth } from "./config";

export async function getCurrentSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function getFullOrganization(organizationId: string) {
  return auth.api.getFullOrganization({
    headers: await headers(),
    query: { organizationId },
  });
}
