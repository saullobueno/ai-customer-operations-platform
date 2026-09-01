import { afterEach, describe, expect, it, vi } from "vitest";

describe("sendTicketAssignedEmail", () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("apenas loga (modo mock) quando não há RESEND_API_KEY configurada", async () => {
    vi.doMock("./client", () => ({ resend: null, EMAIL_FROM: "test@example.com" }));
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const { sendTicketAssignedEmail } = await import("./notifications");
    await sendTicketAssignedEmail({
      to: "agente@empresa.com",
      ticketSubject: "Sensor offline",
      ticketUrl: "https://app.example.com/tickets/1",
    });

    expect(logSpy).toHaveBeenCalledOnce();
  });

  it("envia o e-mail via Resend quando configurado", async () => {
    const send = vi.fn(async () => ({ data: { id: "email_1" }, error: null }));
    vi.doMock("./client", () => ({ resend: { emails: { send } }, EMAIL_FROM: "test@example.com" }));

    const { sendTicketAssignedEmail } = await import("./notifications");
    await sendTicketAssignedEmail({
      to: "agente@empresa.com",
      ticketSubject: "Sensor offline",
      ticketUrl: "https://app.example.com/tickets/1",
    });

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ to: "agente@empresa.com", from: "test@example.com" }),
    );
  });

  it("não propaga erro se o envio falhar", async () => {
    const send = vi.fn(async () => {
      throw new Error("Resend indisponível");
    });
    vi.doMock("./client", () => ({ resend: { emails: { send } }, EMAIL_FROM: "test@example.com" }));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { sendTicketAssignedEmail } = await import("./notifications");

    await expect(
      sendTicketAssignedEmail({
        to: "agente@empresa.com",
        ticketSubject: "Sensor offline",
        ticketUrl: "https://app.example.com/tickets/1",
      }),
    ).resolves.toBeUndefined();
  });
});
