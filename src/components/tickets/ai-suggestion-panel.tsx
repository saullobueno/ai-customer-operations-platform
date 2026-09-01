import { runAiTriageAction, applyAiSuggestedPriorityAction } from "@/server/actions/ai";
import type { TicketPriority } from "@/server/db/schema";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriorityBadge } from "@/components/tickets/priority-badge";
import { UseSuggestionButton } from "@/components/tickets/use-suggestion-button";

type Suggestion = {
  category: string;
  sentiment: string;
  suggestedPriority: TicketPriority;
  suggestedResponse: string;
  confidence: number;
  modelId: string;
  createdAt: Date;
};

export function AiSuggestionPanel({
  ticketId,
  currentPriority,
  suggestion,
}: {
  ticketId: string;
  currentPriority: TicketPriority;
  suggestion: Suggestion | null;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Sugestão da IA</CardTitle>
        <form action={runAiTriageAction}>
          <input type="hidden" name="ticketId" value={ticketId} />
          <SubmitButton size="sm" variant="outline" pendingText="Analisando…">
            {suggestion ? "Analisar novamente" : "Analisar com IA"}
          </SubmitButton>
        </form>
      </CardHeader>
      {suggestion && (
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{suggestion.category}</Badge>
            <Badge variant="outline">sentimento: {suggestion.sentiment}</Badge>
            <span className="text-xs text-muted-foreground">
              confiança: {Math.round(suggestion.confidence * 100)}% · {suggestion.modelId}
            </span>
          </div>

          {suggestion.suggestedPriority !== currentPriority && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
              <span>
                Prioridade sugerida: <PriorityBadge priority={suggestion.suggestedPriority} />
              </span>
              <form action={applyAiSuggestedPriorityAction} className="ml-auto">
                <input type="hidden" name="ticketId" value={ticketId} />
                <input type="hidden" name="priority" value={suggestion.suggestedPriority} />
                <SubmitButton size="sm" variant="secondary" pendingText="Aplicando…">
                  Aplicar
                </SubmitButton>
              </form>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <p className="whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3">
              {suggestion.suggestedResponse}
            </p>
            <UseSuggestionButton suggestedResponse={suggestion.suggestedResponse} />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
