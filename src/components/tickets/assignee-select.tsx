"use client";

import { assignTicketAction } from "@/server/actions/tickets";

export function AssigneeSelect({
  ticketId,
  currentAssigneeId,
  members,
}: {
  ticketId: string;
  currentAssigneeId: string | null;
  members: { userId: string; name: string }[];
}) {
  return (
    <form
      action={assignTicketAction}
      onChange={(event) => (event.currentTarget as HTMLFormElement).requestSubmit()}
    >
      <input type="hidden" name="ticketId" value={ticketId} />
      <select
        name="assigneeId"
        defaultValue={currentAssigneeId ?? ""}
        className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
      >
        <option value="">Sem responsável</option>
        {members.map((m) => (
          <option key={m.userId} value={m.userId}>
            {m.name}
          </option>
        ))}
      </select>
    </form>
  );
}
