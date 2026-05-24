"use server";

import { db } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function linkUserCompany(userId: string, companyId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "DEVELOPER") {
    return { ok: false as const, error: "Não autorizado" };
  }

  await db.userCompany.upsert({
    where: { userId_companyId: { userId, companyId } },
    create: { userId, companyId },
    update: {},
  });

  revalidatePath("/dashboard-admin/users");
  return { ok: true as const };
}

export async function unlinkUserCompany(userId: string, companyId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "DEVELOPER") {
    return { ok: false as const, error: "Não autorizado" };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });

  await db.$transaction([
    ...(user?.companyId === companyId
      ? [db.user.update({ where: { id: userId }, data: { companyId: null } })]
      : []),
    db.userCompany.deleteMany({ where: { userId, companyId } }),
  ]);

  revalidatePath("/dashboard-admin/users");
  return { ok: true as const };
}
