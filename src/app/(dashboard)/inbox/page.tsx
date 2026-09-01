import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { listInboxTickets } from "@/server/services/tickets";
import { ticketStatusValues, type TicketStatus } from "@/server/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PriorityBadge } from "@/components/tickets/priority-badge";
import { SlaIndicator } from "@/components/tickets/sla-indicator";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Aberto",
  pending: "Pendente",
  resolved: "Resolvido",
  closed: "Fechado",
};

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const session = await getCurrentSession();
  if (!session?.session.activeOrganizationId) redirect("/sign-in");

  const { status: statusParam, q } = await searchParams;
  const status = ticketStatusValues.includes(statusParam as TicketStatus)
    ? (statusParam as TicketStatus)
    : undefined;

  const tickets = await listInboxTickets(db, {
    organizationId: session.session.activeOrganizationId,
    status,
    search: q,
  });

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
        <p className="text-sm text-muted-foreground">
          Tickets da sua organização, mais recentes primeiro.
        </p>
      </div>

      <form method="get" action="/inbox" className="flex gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <Input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por assunto…"
          className="max-w-xs"
        />
      </form>

      <nav className="flex gap-1 border-b border-border pb-2 text-sm">
        <Link
          href="/inbox"
          className={cn(
            "rounded-md px-3 py-1.5",
            !status ? "bg-secondary font-medium" : "text-muted-foreground hover:bg-accent",
          )}
        >
          Todos
        </Link>
        {ticketStatusValues.map((value) => (
          <Link
            key={value}
            href={`/inbox?status=${value}`}
            className={cn(
              "rounded-md px-3 py-1.5",
              status === value
                ? "bg-secondary font-medium"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {STATUS_LABEL[value]}
          </Link>
        ))}
      </nav>

      {tickets.length === 0 ? (
        <Card className="items-center py-12 text-center text-sm text-muted-foreground">
          Nenhum ticket por aqui ainda.
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {tickets.map((t) => (
            <li key={t.id}>
              <Link href={`/tickets/${t.id}`}>
                <Card className="gap-3 py-4 transition-colors hover:bg-accent/40">
                  <div className="flex items-center justify-between gap-4 px-6">
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="truncate font-medium">{t.subject}</span>
                      <span className="text-sm text-muted-foreground">
                        {t.customer.name} · {t.customer.email}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {t.tags.map(({ tag }) => (
                        <Badge key={tag.id} variant="outline">
                          {tag.name}
                        </Badge>
                      ))}
                      <PriorityBadge priority={t.priority} />
                      <Badge variant="secondary">{STATUS_LABEL[t.status]}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-6 text-xs text-muted-foreground">
                    <span>{t.assignee ? `Atribuído a ${t.assignee.name}` : "Sem responsável"}</span>
                    <SlaIndicator slaDueAt={t.slaDueAt} resolvedAt={t.resolvedAt} />
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
