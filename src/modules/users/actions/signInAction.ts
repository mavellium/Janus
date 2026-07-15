"use server";

import { z } from "zod";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { db } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type SignInState = { error?: string; redirectUrl?: string };

export async function signInAction(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { error: "Email ou senha inválidos." };

  try {
    await signIn("credentials", { ...parsed.data, redirect: false });
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.message === "IP_BLOCKED") {
        return {
          error: "Acesso suspenso. Múltiplas tentativas falhas detectadas.",
        };
      }
      return { error: "Email ou senha inválidos." };
    }
    throw err;
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    include: {
      company: { select: { slug: true } },
      companies: {
        where: { company: { deletedAt: null } },
        include: { company: { select: { slug: true } } },
      },
    },
  });

  if (!user || user.deletedAt) {
    return { error: "Usuário não encontrado." };
  }

  if (user.requiresPasswordReset) {
    return { redirectUrl: "/first-access" };
  }

  if (user.role === "DEVELOPER") {
    return { redirectUrl: `/dev/${user.id}/dashboard` };
  }

  if (user.role === "ADMIN") {
    return { redirectUrl: "/dashboard-admin" };
  }

  const linkedSlugs = user.companies
    .map((uc) => uc.company?.slug)
    .filter(Boolean) as string[];

  const realSlugs = linkedSlugs.filter((slug) => slug !== "default");

  const slugs =
    realSlugs.length > 0
      ? realSlugs
      : linkedSlugs.length > 0
        ? linkedSlugs
        : ([user.company?.slug].filter(Boolean) as string[]);

  const unique = [...new Set(slugs)];

  if (unique.length === 0) return { redirectUrl: "/no-company" };
  if (unique.length === 1) return { redirectUrl: `/${unique[0]}/dashboard` };
  return { redirectUrl: "/select-company" };
}
