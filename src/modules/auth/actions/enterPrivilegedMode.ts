"use server";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { isPrivilegedRole } from "@/lib/auth/permissions";
import {
  IMPERSONATED_USER_ID_COOKIE,
  IMPERSONATED_USER_NAME_COOKIE,
  IMPERSONATION_RETURN_URL_COOKIE,
} from "@/lib/auth/permissions";
import { logAudit } from "@/lib/audit-logger";

export async function enterPrivilegedMode(returnTo: string) {
  const session = await auth();
  if (!isPrivilegedRole(session?.user?.role)) {
    return { ok: false as const, error: "Acesso não autorizado" };
  }

  const cookieStore = await cookies();
  const impersonatedId = cookieStore.get(IMPERSONATED_USER_ID_COOKIE)?.value;
  const impersonatedName = cookieStore.get(
    IMPERSONATED_USER_NAME_COOKIE,
  )?.value;
  cookieStore.delete(IMPERSONATED_USER_ID_COOKIE);
  cookieStore.delete(IMPERSONATED_USER_NAME_COOKIE);

  if (impersonatedId && session?.user?.id) {
    await logAudit({
      userId: session.user.id,
      action: "DELETE",
      entity: "Impersonation",
      entityId: impersonatedId,
      entityLabel: `Inspeção encerrada (modo privilegiado) · ${impersonatedName ?? impersonatedId}`,
      oldData: { targetUserId: impersonatedId, targetName: impersonatedName },
    });
  }
  cookieStore.set(IMPERSONATION_RETURN_URL_COOKIE, returnTo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return { ok: true as const };
}
