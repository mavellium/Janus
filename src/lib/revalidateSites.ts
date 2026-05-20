import { db } from "@/lib/prisma";

export async function revalidateSites(companySlug: string) {
  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
    select: { webhookUrl: true, webhookToken: true },
  });

  if (!company?.webhookUrl || !company?.webhookToken) return;

  try {
    await fetch(company.webhookUrl, {
      method: "POST",
      headers: { "x-revalidate-token": company.webhookToken },
    });
  } catch {
    // Falha silenciosa — não bloqueia a action
  }
}
