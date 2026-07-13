"use server";

import { z } from "zod";
import { db } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit-logger";

const schema = z.object({
  companySlug: z.string(),
  webhookUrl: z.string().url().optional().or(z.literal("")),
  webhookToken: z.string().optional(),
});

export async function updateCompanyWebhook(_: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id)
    return { ok: false as const, error: "Não autenticado" };

  const parsed = schema.safeParse({
    companySlug: formData.get("companySlug"),
    webhookUrl: formData.get("webhookUrl") || "",
    webhookToken: formData.get("webhookToken") || undefined,
  });
  if (!parsed.success) return { ok: false as const, error: "Dados inválidos" };

  const { companySlug, webhookUrl, webhookToken } = parsed.data;

  if (
    session.user.role !== "ADMIN" &&
    session.user.companySlug !== companySlug
  ) {
    return { ok: false as const, error: "Acesso negado" };
  }

  try {
    const before = await db.company.findUnique({
      where: { slug: companySlug, deletedAt: null },
      select: { id: true, name: true, webhookUrl: true, webhookToken: true },
    });
    if (!before) return { ok: false as const, error: "Empresa não encontrada" };

    await db.company.update({
      where: { slug: companySlug, deletedAt: null },
      data: {
        webhookUrl: webhookUrl || null,
        webhookToken: webhookToken || null,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "UPDATE",
      entity: "Company",
      entityId: before.id,
      entityLabel: `Webhook · ${before.name}`,
      companyId: before.id,
      oldData: {
        webhookUrl: before.webhookUrl,
        webhookTokenSet: !!before.webhookToken,
      },
      newData: {
        webhookUrl: webhookUrl || null,
        webhookTokenSet: !!webhookToken,
      },
    });

    revalidatePath(`/${companySlug}/dashboard/settings`);
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Erro ao salvar configuração" };
  }
}
