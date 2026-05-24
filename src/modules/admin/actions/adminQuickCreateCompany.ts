"use server";

import { z } from "zod";
import { db } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const schema = z.object({
  name: z.string().min(2),
});

export async function adminQuickCreateCompany(
  name: string,
): Promise<
  | { ok: true; company: { id: string; name: string; slug: string } }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "DEVELOPER") {
    return { ok: false, error: "Não autorizado" };
  }

  const parsed = schema.safeParse({ name });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  let slug = toSlug(parsed.data.name);
  const existing = await db.company.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const company = await db.company.create({
    data: { name: parsed.data.name, slug, createdById: session.user.id },
    select: { id: true, name: true, slug: true },
  });

  revalidatePath("/dashboard-admin/users");
  revalidatePath("/dashboard-admin/companies");
  return { ok: true, company };
}
