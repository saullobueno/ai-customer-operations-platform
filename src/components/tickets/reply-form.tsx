import { replyToTicketAction } from "@/server/actions/tickets";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function ReplyForm({ ticketId }: { ticketId: string }) {
  return (
    <form action={replyToTicketAction} className="flex flex-col gap-3">
      <input type="hidden" name="ticketId" value={ticketId} />
      <textarea
        id="reply-body"
        name="body"
        required
        rows={4}
        placeholder="Escreva uma resposta…"
        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
      />
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
          <input type="checkbox" name="internal" className="size-4 rounded border-input" />
          Nota interna (não visível para o cliente)
        </Label>
        <Button type="submit">Enviar</Button>
      </div>
    </form>
  );
}
