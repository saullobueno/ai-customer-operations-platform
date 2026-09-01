import { EMAIL_FROM, resend } from "./client";

export async function sendTicketAssignedEmail(input: {
  to: string;
  ticketSubject: string;
  ticketUrl: string;
}) {
  if (!resend) {
    console.log(
      `[email] (sem RESEND_API_KEY, mock) ticket atribuído → ${input.to}: ${input.ticketSubject}`,
    );
    return;
  }

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: input.to,
      subject: `Ticket atribuído a você: ${input.ticketSubject}`,
      html: `<p>Um ticket foi atribuído a você.</p><p><a href="${input.ticketUrl}">${input.ticketSubject}</a></p>`,
    });
  } catch (error) {
    console.error(`[email] falha ao enviar notificação de atribuição para ${input.to}:`, error);
  }
}
