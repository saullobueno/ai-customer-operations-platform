import { NextRequest } from "next/server";
import { getCurrentSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { getTicketDetail } from "@/server/services/tickets";
import { subscribeTicketEvents, type TicketEvent } from "@/server/realtime/publisher";

const HEARTBEAT_MS = 25_000;

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: ticketId } = await context.params;

  const session = await getCurrentSession();
  if (!session?.session.activeOrganizationId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const ticket = await getTicketDetail(db, ticketId);
  if (!ticket || ticket.organizationId !== session.session.activeOrganizationId) {
    return new Response("Not found", { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: TicketEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      const unsubscribe = subscribeTicketEvents(ticketId, send);
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: heartbeat\n\n`));
      }, HEARTBEAT_MS);

      const cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // já fechado pelo client
        }
      };

      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
