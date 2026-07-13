"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";
import {
  IMPERSONATED_USER_ID_COOKIE,
  IMPERSONATED_USER_NAME_COOKIE,
  IMPERSONATION_RETURN_URL_COOKIE,
} from "@/lib/auth/permissions";
import { logAudit } from "@/lib/audit-logger";

export async function startImpersonation(
  targetUserId: string,
  companySlug: string,
  returnTo?: string,
) {
  const session = await auth();
  const role = session?.user?.role;

  if (!session?.user?.id || (role !== "ADMIN" && role !== "DEVELOPER")) {
    return { ok: false as const, error: "Acesso não autorizado" };
  }

  const targetUser = await db.user.findUnique({
    where: { id: targetUserId, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      company: { select: { slug: true } },
      companies: { select: { company: { select: { slug: true } } } },
    },
  });

  if (!targetUser) {
    return { ok: false as const, error: "Usuário não encontrado" };
  }

  if (targetUser.role === "ADMIN") {
    return {
      ok: false as const,
      error: "Não é possível inspecionar um usuário administrador",
    };
  }

  if (role === "DEVELOPER") {
    const targetSlugs = new Set<string>();
    if (targetUser.company?.slug) targetSlugs.add(targetUser.company.slug);
    for (const link of targetUser.companies) {
      if (link.company?.slug) targetSlugs.add(link.company.slug);
    }
    if (!targetSlugs.has(companySlug)) {
      return {
        ok: false as const,
        error: "Usuário não pertence a esta empresa",
      };
    }
  }

  const displayName = targetUser.name ?? targetUser.email;

  const cookieStore = await cookies();

  cookieStore.set(IMPERSONATED_USER_ID_COOKIE, targetUser.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  cookieStore.set(IMPERSONATED_USER_NAME_COOKIE, displayName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  if (returnTo) {
    cookieStore.set(IMPERSONATION_RETURN_URL_COOKIE, returnTo, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
  }

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entity: "Impersonation",
    entityId: targetUser.id,
    entityLabel: `Inspeção iniciada · ${displayName}`,
    newData: {
      targetUserId: targetUser.id,
      targetEmail: targetUser.email,
      companySlug,
    },
  });

  revalidatePath(`/${companySlug}/dashboard`, "layout");
  return { ok: true as const };
}
