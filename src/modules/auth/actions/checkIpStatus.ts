'use server'

import { headers } from 'next/headers'
import { db } from '@/lib/prisma'

export interface IpStatusResponse {
  blocked: boolean
  remainingSeconds: number
  reason: string
}

export async function checkIpStatus(): Promise<IpStatusResponse> {
  try {
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') || 'unknown'

    const oneHourAgo = new Date(Date.now() - 3600000)

    const attempts = await db.loginAttempt.findMany({
      where: {
        ip,
        createdAt: { gte: oneHourAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    })

    if (attempts.length === 0) {
      return { blocked: false, remainingSeconds: 0, reason: '' }
    }

    const count = await db.loginAttempt.count({
      where: {
        ip,
        createdAt: { gte: oneHourAgo },
      },
    })

    if (count < 3) {
      return { blocked: false, remainingSeconds: 0, reason: '' }
    }

    const lastAttempt = attempts[0]
    const elapsedMs = Date.now() - lastAttempt.createdAt.getTime()
    const remainingMs = Math.max(0, 3600000 - elapsedMs)
    const remainingSeconds = Math.ceil(remainingMs / 1000)

    return {
      blocked: true,
      remainingSeconds,
      reason: `Acesso suspenso por ${count} tentativas falhas. Tente novamente em ${Math.ceil(remainingSeconds / 60)} minutos.`,
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (
      errorMessage.includes('does not exist') ||
      errorMessage.includes('P2021')
    ) {
      return { blocked: false, remainingSeconds: 0, reason: '' }
    }
    return { blocked: false, remainingSeconds: 0, reason: '' }
  }
}
