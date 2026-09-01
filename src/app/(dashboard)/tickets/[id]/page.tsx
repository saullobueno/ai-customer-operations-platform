import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { getTicketDetail } from "@/server/services/tickets";
import { listOrganizationMembers } from "@/server/services/members";
import { getLatestAiSuggestion } from "@/server/services/ai-triage";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/tickets/priority-badge";
import { SlaIndicator } from "@/components/tickets/sla-indicator";
import { CommentThread } from "@/components/tickets/comment-thread";
import { ReplyForm } from "@/components/tickets/reply-form";
import { AssigneeSelect } from "@/components/tickets/assignee-select";
import { StatusSelect } from "@/components/tickets/status-select";
import { TagForm } from "@/components/tickets/tag-form";
import { AiSuggestionPanel } from "@/components/tickets/ai-suggestion-panel";
import { TicketRealtimeListener } from "@/components/ticket-realtime-listener";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session?.session.activeOrganizationId) redirect("/sign-in");

  const { id } = await params;
  const ticket = await getTicketDetail(db, id);

  if (!ticket || ticket.organizationId !== session.session.activeOrganizationId) {
    notFound();
  }

  const [members, aiSuggestion] = await Promise.all([
    listOrganizationMembers(db, session.session.activeOrganizationId),
    getLatestAiSuggestion(db, ticket.id),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <TicketRealtimeListener ticketId={ticket.id} />

      <div>
        <Link href="/inbox" className="text-sm text-muted-foreground hover:underline">
          ← Voltar para a inbox
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{ticket.subject}</h1>
        <p className="text-sm text-muted-foreground">
          Aberto por {ticket.customer.name} ({ticket.customer.email})
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border p-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Status</span>
          <StatusSelect ticketId={ticket.id} status={ticket.status} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Responsável</span>
          <AssigneeSelect
            ticketId={ticket.id}
            currentAssigneeId={ticket.assigneeId}
            members={members.map((m) => ({ userId: m.user.id, name: m.user.name }))}
          />
        </div>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={ticket.priority} />
          <SlaIndicator slaDueAt={ticket.slaDueAt} resolvedAt={ticket.resolvedAt} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {ticket.tags.map(({ tag }) => (
          <Badge key={tag.id} variant="outline">
            {tag.name}
          </Badge>
        ))}
        <TagForm ticketId={ticket.id} />
      </div>

      <AiSuggestionPanel
        ticketId={ticket.id}
        currentPriority={ticket.priority}
        suggestion={aiSuggestion}
      />

      <CommentThread comments={ticket.comments} />

      <ReplyForm ticketId={ticket.id} />
    </div>
  );
}
