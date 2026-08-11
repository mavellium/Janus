import { db } from '@/lib/prisma'

export async function getGeoTargetQuestions(profileId: string) {
  return db.geoTargetQuestion.findMany({
    where: { profileId, status: 'ACTIVE' },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      text: true,
      layer: true,
      priority: true,
      status: true,
      createdAt: true,
    },
  })
}

export async function getActiveGeoQuestionsForProbe(profileId: string) {
  return db.geoTargetQuestion.findMany({
    where: { profileId, status: 'ACTIVE' },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    select: { id: true, text: true, layer: true },
  })
}
