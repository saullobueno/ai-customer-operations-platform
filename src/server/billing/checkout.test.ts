import { afterEach, describe, expect, it, vi } from "vitest";

const baseInput = {
  organizationId: "org_1",
  customerEmail: "dono@empresa.com",
  successUrl: "https://app.example.com/billing?success=1",
  cancelUrl: "https://app.example.com/billing",
};

describe("createProPlanCheckoutSession", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("./client");
    vi.doUnmock("@/lib/env");
  });

  it("retorna modo mock quando não há Stripe configurado", async () => {
    vi.doMock("./client", () => ({ stripe: null }));
    vi.doMock("@/lib/env", () => ({ env: { STRIPE_PRICE_ID_PRO: undefined } }));

    const { createProPlanCheckoutSession } = await import("./checkout");
    const result = await createProPlanCheckoutSession(baseInput);

    expect(result).toEqual({ mocked: true });
  });

  it("cria uma sessão de checkout real quando Stripe está configurado", async () => {
    const create = vi.fn(async () => ({ url: "https://checkout.stripe.com/session_123" }));
    vi.doMock("./client", () => ({ stripe: { checkout: { sessions: { create } } } }));
    vi.doMock("@/lib/env", () => ({ env: { STRIPE_PRICE_ID_PRO: "price_123" } }));

    const { createProPlanCheckoutSession } = await import("./checkout");
    const result = await createProPlanCheckoutSession(baseInput);

    expect(result).toEqual({ mocked: false, url: "https://checkout.stripe.com/session_123" });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        customer_email: "dono@empresa.com",
        metadata: { organizationId: "org_1" },
      }),
    );
  });
});
