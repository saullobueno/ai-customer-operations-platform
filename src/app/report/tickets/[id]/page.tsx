import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/server/db/client";
import { findOrganizationBySlug, getPublicTicketDetail } from "@/server/services/tickets";
import type { TicketStatus } from "@/server/db/schema";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/tickets/priority-badge";
import { CommentThread } from "@/components/tickets/comment-thread";
import { PublicReplyForm } from "@/components/tickets/public-reply-form";

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Aberto",
  pending: "Pendente",
  resolved: "Resolvido",
  closed: "Fechado",
};

export default async function PublicTicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ org?: string; email?: string }>;
}) {
  const { id } = await params;
  const { org: orgSlug, email } = await searchParams;

  if (!orgSlug || !email) notFound();

  const org = await findOrganizationBySlug(db, orgSlug);
  if (!org) notFound();

  const ticket = await getPublicTicketDetail(db, {
    ticketId: id,
    organizationId: org.id,
    email,
  });
  if (!ticket) notFound();

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <div>
        <Link
          href={`/report/track?org=${orgSlug}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Meus chamados
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{ticket.subject}</h1>
          <PriorityBadge priority={ticket.priority} />
          <Badge variant="secondary">{STATUS_LABEL[ticket.status]}</Badge>
        </div>
      </div>

      <CommentThread comments={ticket.comments} />

      {ticket.status !== "closed" && (
        <PublicReplyForm orgSlug={orgSlug} ticketId={ticket.id} email={email} />
      )}
    </div>
  );
}
