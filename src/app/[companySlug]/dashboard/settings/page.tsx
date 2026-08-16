import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import { SettingsClient } from "./settings.client";
import type { UserPreferences } from "@/types/next-auth";
import { getImpersonatedUserId } from "@/lib/auth/permissions";
import { getUserAuthMethods } from "@/modules/auth/queries/getUserAuthMethods";

export const metadata = { title: "Configurações — Janus" };

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      webhookUrl: true,
      webhookToken: true,
    },
  });
  if (!company) redirect("/login");

  const impersonatedId = await getImpersonatedUserId()
  const userId = impersonatedId ?? session.user.id

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      image: true,
      preferences: true,
    },
  });

  const authMethods = await getUserAuthMethods(userId);

  return (
    <SettingsClient
      user={{
        id: user?.id || session.user.id,
        email: user?.email || session.user.email!,
        name: user?.name || user?.image || "",
        phone: user?.phone || "",
        image: user?.image || null,
        preferences: (user?.preferences as UserPreferences) || {},
      }}
      authMethods={authMethods}
      settingsPath={`/${companySlug}/dashboard/settings`}
      company={{
        id: company.id,
        name: company.name,
        slug: company.slug,
        description: company.description,
        webhookUrl: company.webhookUrl,
        webhookToken: company.webhookToken,
      }}
    />
  );
}
