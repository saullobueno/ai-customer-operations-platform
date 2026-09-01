"use server";

import { revalidatePath } from "next/cache";
import { requireTicketPermission } from "@/server/auth/authorize";
import { db } from "@/server/db/client";
import { ticketPriorityValues, type TicketPriority } from "@/server/db/schema";
import { applyAiSuggestedPriority, runTicketTriage } from "@/server/services/ai-triage";

export async function runAiTriageAction(formData: FormData) {
  const ticketId = String(formData.get("ticketId") ?? "");
  if (!ticketId) throw new Error("ticketId é obrigatório");

  await requireTicketPermission({ ticket: ["update"] });

  await runTicketTriage(db, ticketId);

  revalidatePath(`/tickets/${ticketId}`);
}

export async function applyAiSuggestedPriorityAction(formData: FormData) {
  const ticketId = String(formData.get("ticketId") ?? "");
  const priority = String(formData.get("priority") ?? "");
  if (!ticketId || !ticketPriorityValues.includes(priority as TicketPriority)) {
    throw new Error("Dados inválidos para aplicar prioridade sugerida.");
  }

  const { userId, organizationId } = await requireTicketPermission({ ticket: ["update"] });

  await applyAiSuggestedPriority(db, {
    ticketId,
    organizationId,
    priority: priority as TicketPriority,
    actorUserId: userId,
  });

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/inbox");
}
