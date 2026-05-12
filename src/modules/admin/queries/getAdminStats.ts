import { db } from '@/lib/prisma'

export async function getAdminStats() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  const [usersCount, developersCount, companiesCount, recentAttempts] = await Promise.all([
    db.user.count({ where: { deletedAt: null, role: 'DEFAULT' } }),
    db.user.count({ where: { deletedAt: null, role: 'DEVELOPER' } }),
    db.company.count({ where: { deletedAt: null } }),
    db.loginAttempt.findMany({ where: { createdAt: { gte: oneHourAgo } } }),
  ])

  const ipCounts = recentAttempts.reduce<Record<string, number>>((acc, a) => {
    acc[a.ip] = (acc[a.ip] ?? 0) + 1
    return acc
  }, {})

  const blockedCount = Object.values(ipCounts).filter((c) => c >= 3).length

  return { usersCount, developersCount, companiesCount, blockedCount }
}
