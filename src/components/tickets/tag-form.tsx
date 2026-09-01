import { addTagAction } from "@/server/actions/tickets";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TagForm({ ticketId }: { ticketId: string }) {
  return (
    <form action={addTagAction} className="flex items-center gap-2">
      <input type="hidden" name="ticketId" value={ticketId} />
      <Input name="tagName" placeholder="Nova tag" required className="h-8 w-32" />
      <Button type="submit" variant="outline" size="sm">
        Adicionar
      </Button>
    </form>
  );
}
