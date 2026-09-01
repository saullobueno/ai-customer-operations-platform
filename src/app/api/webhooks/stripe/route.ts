import { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { db } from "@/server/db/client";
import { stripe } from "@/server/billing/client";
import { recordAuditLog } from "@/server/services/audit";

export async function POST(request: NextRequest) {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Stripe não configurado.", { status: 501 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Assinatura ausente.", { status: 400 });

  const rawBody = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("[stripe-webhook] assinatura inválida:", error);
    return new Response("Assinatura inválida.", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const organizationId = session.metadata?.organizationId;

    if (organizationId) {
      await recordAuditLog(db, {
        organizationId,
        action: "billing.checkout_completed",
        entityType: "organization",
        entityId: organizationId,
        metadata: { stripeSessionId: session.id },
      });
    }
  }

  return new Response(null, { status: 200 });
}
