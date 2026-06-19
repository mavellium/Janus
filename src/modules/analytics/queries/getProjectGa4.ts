import { db } from '@/lib/prisma'

export interface ProjectGa4 {
  id: string
  name: string
  ga4PropertyId: string | null
}

export async function getProjectGa4(
  projectId: string,
  companySlug: string,
): Promise<ProjectGa4 | null> {
  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
    select: { id: true },
  })
  if (!company) return null

  return db.project.findFirst({
    where: { id: projectId, companyId: company.id, deletedAt: null },
    select: { id: true, name: true, ga4PropertyId: true },
  })
}
