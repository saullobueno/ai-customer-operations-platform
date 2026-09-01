import { addTagAction } from "@/server/actions/tickets";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function TagForm({ ticketId }: { ticketId: string }) {
  return (
    <form action={addTagAction} className="flex items-center gap-2">
      <input type="hidden" name="ticketId" value={ticketId} />
      <Input name="tagName" placeholder="Nova tag" required className="h-8 w-32" />
      <SubmitButton variant="outline" size="sm" pendingText="Adicionando…">
        Adicionar
      </SubmitButton>
    </form>
  );
}
