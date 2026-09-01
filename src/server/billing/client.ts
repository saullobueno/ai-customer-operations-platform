import Stripe from "stripe";
import { env } from "@/lib/env";

/**
 * `null` sem STRIPE_SECRET_KEY — quem chama trata como "modo mock" (ver
 * docs/decisions/0011-stripe-billing-mocked.md), mesmo padrão de
 * `resend`/`enqueueAiTriage`.
 */
export const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;
