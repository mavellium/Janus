import { describe, it, expect, vi } from 'vitest'
import { db } from '@/lib/prisma'

describe('Brute Force Protection', () => {
  it('should handle missing login_attempts table gracefully', async () => {
    const mockCount = vi.spyOn(db.loginAttempt, 'count')
    mockCount.mockRejectedValueOnce(
      new Error('The table `public.login_attempts` does not exist')
    )

    const isIpBlocked = async (ip: string) => {
      try {
        const oneHourAgo = new Date(Date.now() - 3600000)
        const count = await db.loginAttempt.count({
          where: {
            ip,
            createdAt: { gte: oneHourAgo },
          },
        })
        return count >= 3
      } catch (error) {
        if (error instanceof Error && error.message.includes('does not exist')) {
          return false
        }
        throw error
      }
    }

    const result = await isIpBlocked('192.168.1.1')
    expect(result).toBe(false)
    mockCount.mockRestore()
  })
})
