"use client";

import { Button } from "@/components/ui/button";

export function UseSuggestionButton({ suggestedResponse }: { suggestedResponse: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        const textarea = document.getElementById("reply-body") as HTMLTextAreaElement | null;
        if (textarea) {
          textarea.value = suggestedResponse;
          textarea.focus();
        }
      }}
    >
      Usar esta resposta
    </Button>
  );
}
