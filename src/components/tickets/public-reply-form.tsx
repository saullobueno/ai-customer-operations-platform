"use client";

import { useActionState } from "react";
import { submitPublicReplyAction, type PublicReplyFormState } from "@/server/actions/tickets";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: PublicReplyFormState = { status: "idle" };

export function PublicReplyForm({
  orgSlug,
  ticketId,
  email,
}: {
  orgSlug: string;
  ticketId: string;
  email: string;
}) {
  const [state, formAction] = useActionState(submitPublicReplyAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      <input type="hidden" name="ticketId" value={ticketId} />
      <input type="hidden" name="email" value={email} />
      <textarea
        name="body"
        required
        rows={4}
        placeholder="Escreva uma resposta…"
        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
      />
      {state.status === "error" && <p className="text-sm text-destructive">{state.message}</p>}
      <SubmitButton pendingText="Enviando…" className="self-end">
        Enviar
      </SubmitButton>
    </form>
  );
}
