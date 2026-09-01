"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { getCurrentSession } from "@/server/auth/session";

const COMBINING_DIACRITICAL_MARKS = /[̀-ͯ]/g;

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_DIACRITICAL_MARKS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type CreateOrganizationFormState = { status: "idle" } | { status: "error"; message: string };

export async function createOrganizationAction(
  _prevState: CreateOrganizationFormState,
  formData: FormData,
): Promise<CreateOrganizationFormState> {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { status: "error", message: "Informe o nome da organização." };

  try {
    await auth.api.createOrganization({
      headers: await headers(),
      body: { name, slug: slugify(name) },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("already exists")) {
      return {
        status: "error",
        message: `Já existe uma organização chamada "${name}" (o nome vira o link público de abertura de chamados, então precisa ser único). Tente um nome um pouco diferente.`,
      };
    }
    return { status: "error", message: "Não foi possível criar a organização. Tente de novo." };
  }

  redirect("/inbox");
}
