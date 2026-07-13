"use server";

import { db } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit-logger";

async function getLinkContext(userId: string, companyId: string) {
  const [user, company] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    }),
    db.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    }),
  ]);
  return {
    label: `${user?.email ?? userId} ↔ ${company?.name ?? companyId}`,
    userEmail: user?.email ?? null,
    companyName: company?.name ?? null,
  };
}

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

  const context = await getLinkContext(userId, companyId);
  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entity: "UserCompany",
    entityId: `${userId}:${companyId}`,
    entityLabel: context.label,
    companyId,
    newData: {
      userId,
      companyId,
      userEmail: context.userEmail,
      companyName: context.companyName,
    },
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

  const context = await getLinkContext(userId, companyId);
  await logAudit({
    userId: session.user.id,
    action: "DELETE",
    entity: "UserCompany",
    entityId: `${userId}:${companyId}`,
    entityLabel: context.label,
    companyId,
    oldData: {
      userId,
      companyId,
      userEmail: context.userEmail,
      companyName: context.companyName,
      wasPrimaryCompany: user?.companyId === companyId,
    },
  });

  revalidatePath("/dashboard-admin/users");
  return { ok: true as const };
}
