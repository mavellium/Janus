import { db } from '@/lib/prisma'

export async function getGeoTargetProfiles() {
  return db.geoTargetProfile.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      companyId: true,
      name: true,
      description: true,
      industry: true,
      location: true,
      website: true,
      aliases: true,
      targetAudience: true,
      differentiators: true,
      createdAt: true,
      company: { select: { id: true, name: true } },
    },
  })
}

export async function getGeoTargetProfileById(id: string) {
  return db.geoTargetProfile.findFirst({
    where: { id, archivedAt: null },
  })
}
