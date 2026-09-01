"use client";

import { useActionState } from "react";
import Link from "next/link";
import { submitPublicTicketAction, type PublicTicketFormState } from "@/server/actions/tickets";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: PublicTicketFormState = { status: "idle" };

export function PublicReportForm({ orgSlug }: { orgSlug: string }) {
  const [state, formAction] = useActionState(submitPublicTicketAction, initialState);

  if (state.status === "success") {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="font-medium">Ticket aberto com sucesso!</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Protocolo: <code className="font-mono">{state.ticketId}</code>
        </p>
        <Link
          href={`/report/tickets/${state.ticketId}?org=${state.orgSlug}&email=${encodeURIComponent(state.email)}`}
          className="mt-4 inline-block text-sm underline underline-offset-2"
        >
          Acompanhar este chamado
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Seu nome</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Seu e-mail</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="subject">Assunto</Label>
        <Input id="subject" name="subject" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="body">Descreva o problema</Label>
        <textarea
          id="body"
          name="body"
          required
          rows={5}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="priority">Prioridade</Label>
        <select
          id="priority"
          name="priority"
          defaultValue="medium"
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="low">Baixa</option>
          <option value="medium">Média</option>
          <option value="high">Alta</option>
          <option value="urgent">Urgente</option>
        </select>
      </div>
      {state.status === "error" && <p className="text-sm text-destructive">{state.message}</p>}
      <SubmitButton pendingText="Enviando…">Abrir ticket</SubmitButton>
    </form>
  );
}
