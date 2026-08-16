import { createHash, randomBytes } from 'node:crypto'

export const PASSWORD_RESET_TTL_MINUTES = 30

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function createResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url')
  return { token, tokenHash: hashResetToken(token) }
}

export function resetTokenExpiresAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000)
}

export function isResetTokenUsable(token: {
  usedAt: Date | null
  expiresAt: Date
}): boolean {
  return token.usedAt === null && token.expiresAt.getTime() > Date.now()
}
