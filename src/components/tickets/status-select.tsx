"use client";

import { updateTicketStatusAction } from "@/server/actions/tickets";
import { ticketStatusValues, type TicketStatus } from "@/server/db/schema";

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Aberto",
  pending: "Pendente",
  resolved: "Resolvido",
  closed: "Fechado",
};

export function StatusSelect({ ticketId, status }: { ticketId: string; status: TicketStatus }) {
  return (
    <form
      action={updateTicketStatusAction}
      onChange={(event) => (event.currentTarget as HTMLFormElement).requestSubmit()}
    >
      <input type="hidden" name="ticketId" value={ticketId} />
      <select
        name="status"
        defaultValue={status}
        className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
      >
        {ticketStatusValues.map((value) => (
          <option key={value} value={value}>
            {STATUS_LABEL[value]}
          </option>
        ))}
      </select>
    </form>
  );
}
