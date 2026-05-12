import { db } from '@/lib/prisma'

export async function getBlockedIps() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recentAttempts = await db.loginAttempt.findMany({
    where: { createdAt: { gte: oneHourAgo } },
    orderBy: { createdAt: 'desc' },
  })

  const grouped = recentAttempts.reduce<
    Record<string, { count: number; lastAttempt: Date; emails: string[] }>
  >((acc, attempt) => {
    if (!acc[attempt.ip]) {
      acc[attempt.ip] = { count: 0, lastAttempt: attempt.createdAt, emails: [] }
    }
    acc[attempt.ip].count++
    if (attempt.email && !acc[attempt.ip].emails.includes(attempt.email)) {
      acc[attempt.ip].emails.push(attempt.email)
    }
    return acc
  }, {})

  return Object.entries(grouped)
    .filter(([, data]) => data.count >= 3)
    .map(([ip, data]) => ({ ip, ...data }))
    .sort((a, b) => b.count - a.count)
}
