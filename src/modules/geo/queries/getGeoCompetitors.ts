import { db } from '@/lib/prisma'

export async function getGeoCompetitors(profileId: string) {
  return db.geoCompetitor.findMany({
    where: { profileId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, aliases: true, website: true, createdAt: true },
  })
}
