import { db } from '@/lib/prisma'

export async function findPublishedPage(companySlug: string, pageSlug: string) {
  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
    select: { id: true },
  })
  if (!company) return null

  return db.page.findFirst({
    where: {
      slug: pageSlug,
      isPublished: true,
      deletedAt: null,
      project: { companyId: company.id, isActive: true, deletedAt: null },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      schemaData: true,
      contentData: true,
      isAdvanced: true,
      updatedAt: true,
    },
  })
}

export type PublishedPage = NonNullable<
  Awaited<ReturnType<typeof findPublishedPage>>
>
