"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Sem UI própria: assina o stream SSE do ticket e força o Server Component
 * a buscar dados atualizados quando algo muda (ver ADR 0006).
 */
export function TicketRealtimeListener({ ticketId }: { ticketId: string }) {
  const router = useRouter();

  useEffect(() => {
    const source = new EventSource(`/api/tickets/${ticketId}/events`);
    source.onmessage = () => router.refresh();
    return () => source.close();
  }, [ticketId, router]);

  return null;
}
