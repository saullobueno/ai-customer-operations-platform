"use client";

import { useActionState } from "react";
import {
  createOrganizationAction,
  type CreateOrganizationFormState,
} from "@/server/actions/organizations";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: CreateOrganizationFormState = { status: "idle" };

export function CreateOrganizationForm() {
  const [state, formAction] = useActionState(createOrganizationAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome da organização</Label>
        <Input id="name" name="name" placeholder="Econform" required />
      </div>
      {state.status === "error" && <p className="text-sm text-destructive">{state.message}</p>}
      <SubmitButton pendingText="Criando…">Criar organização</SubmitButton>
    </form>
  );
}
