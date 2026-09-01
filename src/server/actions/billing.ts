"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/auth/session";
import { createProPlanCheckoutSession } from "@/server/billing/checkout";

export async function createProPlanCheckoutSessionAction() {
  const session = await getCurrentSession();
  if (!session?.session.activeOrganizationId) redirect("/sign-in");

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? "http://localhost:3000";

  const result = await createProPlanCheckoutSession({
    organizationId: session.session.activeOrganizationId,
    customerEmail: session.user.email,
    successUrl: `${origin}/billing?success=1`,
    cancelUrl: `${origin}/billing`,
  });

  if (!result.mocked) {
    redirect(result.url);
  }

  redirect("/billing?mocked=1");
}
