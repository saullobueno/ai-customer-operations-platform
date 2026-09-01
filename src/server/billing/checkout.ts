import { env } from "@/lib/env";
import { stripe } from "./client";

export type CheckoutResult = { mocked: true } | { mocked: false; url: string };

export async function createProPlanCheckoutSession(input: {
  organizationId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<CheckoutResult> {
  if (!stripe || !env.STRIPE_PRICE_ID_PRO) {
    return { mocked: true };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: env.STRIPE_PRICE_ID_PRO, quantity: 1 }],
    customer_email: input.customerEmail,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: { organizationId: input.organizationId },
  });

  if (!session.url) throw new Error("Stripe não retornou uma URL de checkout.");

  return { mocked: false, url: session.url };
}
