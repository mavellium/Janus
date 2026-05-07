import { db } from '@/lib/prisma'

export const getLoginLogs = async (limit: number = 100) => {
  return await db.loginAttempt.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export const getLoginLogsByIp = async (ip: string) => {
  return await db.loginAttempt.findMany({
    where: { ip },
    orderBy: { createdAt: 'desc' },
  })
}
