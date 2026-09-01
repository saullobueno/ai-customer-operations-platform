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

export async function createOrganizationAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Informe o nome da organização.");

  await auth.api.createOrganization({
    headers: await headers(),
    body: { name, slug: slugify(name) },
  });

  redirect("/inbox");
}
