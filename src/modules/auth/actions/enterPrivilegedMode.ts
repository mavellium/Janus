"use server";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { isPrivilegedRole } from "@/lib/auth/permissions";
import {
  IMPERSONATED_USER_ID_COOKIE,
  IMPERSONATED_USER_NAME_COOKIE,
  IMPERSONATION_RETURN_URL_COOKIE,
} from "@/lib/auth/permissions";

export async function enterPrivilegedMode(returnTo: string) {
  const session = await auth();
  if (!isPrivilegedRole(session?.user?.role)) {
    return { ok: false as const, error: "Acesso não autorizado" };
  }

  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATED_USER_ID_COOKIE);
  cookieStore.delete(IMPERSONATED_USER_NAME_COOKIE);
  cookieStore.set(IMPERSONATION_RETURN_URL_COOKIE, returnTo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return { ok: true as const };
}
