"use client";

import { useActionState } from "react";
import Link from "next/link";
import { trackTicketsAction, type TrackTicketsFormState } from "@/server/actions/tickets";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/tickets/priority-badge";
import type { TicketStatus } from "@/server/db/schema";

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Aberto",
  pending: "Pendente",
  resolved: "Resolvido",
  closed: "Fechado",
};

const initialState: TrackTicketsFormState = { status: "idle" };

export function TrackTicketsForm({ orgSlug }: { orgSlug: string }) {
  const [state, formAction] = useActionState(trackTicketsAction, initialState);

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="orgSlug" value={orgSlug} />
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Seu e-mail</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        {state.status === "error" && <p className="text-sm text-destructive">{state.message}</p>}
        <SubmitButton pendingText="Buscando…">Ver meus chamados</SubmitButton>
      </form>

      {state.status === "success" && (
        <div className="flex flex-col gap-2">
          {state.tickets.length === 0 ? (
            <Card className="items-center py-8 text-center text-sm text-muted-foreground">
              Nenhum chamado encontrado para esse e-mail.
            </Card>
          ) : (
            <ul className="flex flex-col gap-2">
              {state.tickets.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/report/tickets/${t.id}?org=${orgSlug}&email=${encodeURIComponent(state.email)}`}
                  >
                    <Card className="gap-2 py-3 transition-colors hover:bg-accent/40">
                      <div className="flex items-center justify-between gap-4 px-4">
                        <span className="truncate text-sm font-medium">{t.subject}</span>
                        <div className="flex shrink-0 items-center gap-2">
                          <PriorityBadge priority={t.priority} />
                          <Badge variant="secondary">{STATUS_LABEL[t.status]}</Badge>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
