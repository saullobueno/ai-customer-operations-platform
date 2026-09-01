"use client";

import { useActionState } from "react";
import { inviteMemberAction, type InviteMemberFormState } from "@/server/actions/members";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: InviteMemberFormState = { status: "idle" };

export function InviteMemberForm() {
  const [state, formAction] = useActionState(inviteMemberAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="invite-email">E-mail</Label>
        <Input id="invite-email" name="email" type="email" required className="w-56" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="invite-role">Papel</Label>
        <select
          id="invite-role"
          name="role"
          defaultValue="agent"
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="admin">Admin</option>
          <option value="agent">Agente</option>
          <option value="member">Membro (leitura)</option>
        </select>
      </div>
      <SubmitButton pendingText="Convidando…">Convidar</SubmitButton>
      {state.status === "error" && (
        <p className="w-full text-sm text-destructive">{state.message}</p>
      )}
    </form>
  );
}
