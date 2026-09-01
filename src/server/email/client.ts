import { Resend } from "resend";
import { env } from "@/lib/env";

/**
 * `null` quando não há RESEND_API_KEY configurada — quem chama trata isso
 * como "modo mock" (loga em vez de enviar), nunca lança erro por causa
 * disso. Mesmo raciocínio best-effort da fila (ADR 0010).
 */
export const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export const EMAIL_FROM = "AI Customer Operations <onboarding@resend.dev>";
