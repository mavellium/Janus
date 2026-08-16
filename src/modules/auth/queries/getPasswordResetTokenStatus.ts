import { db } from '@/lib/prisma'
import { hashResetToken, isResetTokenUsable } from '@/modules/auth/domain/passwordReset'

export interface PasswordResetTokenStatus {
  valid: boolean
  email: string | null
}

export async function getPasswordResetTokenStatus(
  token: string,
): Promise<PasswordResetTokenStatus> {
  if (!token) return { valid: false, email: null }

  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
    select: {
      usedAt: true,
      expiresAt: true,
      user: { select: { email: true, deletedAt: true } },
    },
  })

  if (!record || record.user.deletedAt !== null || !isResetTokenUsable(record)) {
    return { valid: false, email: null }
  }

  return { valid: true, email: record.user.email }
}
