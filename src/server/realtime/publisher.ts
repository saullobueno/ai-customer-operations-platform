import { EventEmitter } from "node:events";

export type TicketEvent = { type: string; [key: string]: unknown };

/**
 * Broker de eventos em processo — ver docs/decisions/0006-realtime-sse-in-process.md
 * para o motivo de não usar Redis pub/sub aqui.
 */
const emitter = new EventEmitter();
emitter.setMaxListeners(0);

function channel(ticketId: string) {
  return `ticket:${ticketId}`;
}

export function publishTicketEvent(ticketId: string, event: TicketEvent) {
  emitter.emit(channel(ticketId), event);
}

export function subscribeTicketEvents(ticketId: string, listener: (event: TicketEvent) => void) {
  const name = channel(ticketId);
  emitter.on(name, listener);
  return () => emitter.off(name, listener);
}
