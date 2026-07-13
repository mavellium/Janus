"use server";

import { z } from "zod";
import { db } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { logAudit, omitSensitive } from "@/lib/audit-logger";

const schema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  companyId: z.string().uuid().nullable().optional(),
  linkedCompanyIds: z.array(z.string().uuid()).optional(),
});

export async function adminEditUser(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return { ok: false, error: "Acesso não autorizado." };
  }

  const rawPassword = String(formData.get("password") ?? "");
  const companyIdRaw = formData.get("companyId");
  const linkedIdsRaw = formData.getAll("linkedCompanyIds[]");

  const parsed = schema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: rawPassword.length > 0 ? rawPassword : undefined,
    companyId:
      companyIdRaw === "" || companyIdRaw === null ? null : companyIdRaw,
    linkedCompanyIds: linkedIdsRaw.filter(Boolean).map(String),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const conflict = await db.user.findFirst({
    where: { email: parsed.data.email, id: { not: parsed.data.id } },
  });
  if (conflict) {
    return { ok: false, error: "E-mail já está em uso." };
  }

  const before = await db.user.findUnique({ where: { id: parsed.data.id } });

  const data: Record<string, unknown> = {
    name: parsed.data.name,
    email: parsed.data.email,
    companyId: parsed.data.companyId ?? null,
  };

  if (parsed.data.password) {
    data.password = await hash(parsed.data.password, 10);
  }

  const linkedIds = parsed.data.linkedCompanyIds ?? [];

  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: parsed.data.id }, data });

    await tx.userCompany.deleteMany({ where: { userId: parsed.data.id } });

    if (linkedIds.length > 0) {
      await tx.userCompany.createMany({
        data: linkedIds.map((companyId) => ({
          userId: parsed.data.id,
          companyId,
        })),
        skipDuplicates: true,
      });
    }
  });

  const after = await db.user.findUnique({ where: { id: parsed.data.id } });

  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    entity: "User",
    entityId: parsed.data.id,
    entityLabel: after?.email ?? parsed.data.email,
    companyId: after?.companyId,
    oldData: omitSensitive(before),
    newData: omitSensitive(after),
  });

  revalidatePath("/dashboard-admin/users");
  revalidatePath("/dashboard-admin/developers");
  return { ok: true };
}
