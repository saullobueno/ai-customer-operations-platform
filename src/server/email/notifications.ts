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

export async function sendTicketCreatedEmail(input: {
  to: string;
  ticketSubject: string;
  trackingUrl: string;
}) {
  if (!resend) {
    console.log(
      `[email] (sem RESEND_API_KEY, mock) confirmação de abertura → ${input.to}: ${input.ticketSubject} (${input.trackingUrl})`,
    );
    return;
  }

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: input.to,
      subject: `Recebemos seu chamado: ${input.ticketSubject}`,
      html: `<p>Seu chamado foi aberto com sucesso. Nossa equipe vai analisar em breve.</p><p><a href="${input.trackingUrl}">Acompanhar chamado</a></p>`,
    });
  } catch (error) {
    console.error(`[email] falha ao enviar confirmação de abertura para ${input.to}:`, error);
  }
}

export async function sendTicketReplyEmail(input: {
  to: string;
  ticketSubject: string;
  trackingUrl: string;
}) {
  if (!resend) {
    console.log(
      `[email] (sem RESEND_API_KEY, mock) nova resposta → ${input.to}: ${input.ticketSubject} (${input.trackingUrl})`,
    );
    return;
  }

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: input.to,
      subject: `Nova resposta no seu chamado: ${input.ticketSubject}`,
      html: `<p>Você recebeu uma nova resposta no seu chamado.</p><p><a href="${input.trackingUrl}">Ver resposta</a></p>`,
    });
  } catch (error) {
    console.error(`[email] falha ao enviar notificação de resposta para ${input.to}:`, error);
  }
}

export async function sendOrganizationInviteEmail(input: {
  to: string;
  organizationName: string;
  acceptUrl: string;
}) {
  if (!resend) {
    console.log(
      `[email] (sem RESEND_API_KEY, mock) convite → ${input.to}: entrar em "${input.organizationName}" (${input.acceptUrl})`,
    );
    return;
  }

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: input.to,
      subject: `Você foi convidado para "${input.organizationName}"`,
      html: `<p>Você foi convidado a fazer parte de "${input.organizationName}".</p><p><a href="${input.acceptUrl}">Aceitar convite</a></p>`,
    });
  } catch (error) {
    console.error(`[email] falha ao enviar convite para ${input.to}:`, error);
  }
}
