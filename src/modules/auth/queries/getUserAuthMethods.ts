import { db } from '@/lib/prisma'
import { GOOGLE_PROVIDER_ID, isGoogleAuthConfigured } from '@/lib/auth/oauth'

export interface UserAuthMethods {
  googleProviderAvailable: boolean
  googleAuthEnabled: boolean
  googleAccount: {
    providerEmail: string | null
    linkedAt: string
    lastLoginAt: string | null
  } | null
}

export async function getUserAuthMethods(userId: string): Promise<UserAuthMethods> {
  const [user, account] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { googleAuthEnabled: true },
    }),
    db.userOAuthAccount.findUnique({
      where: { userId_provider: { userId, provider: GOOGLE_PROVIDER_ID } },
      select: { providerEmail: true, linkedAt: true, lastLoginAt: true },
    }),
  ])

  return {
    googleProviderAvailable: isGoogleAuthConfigured(),
    googleAuthEnabled: user?.googleAuthEnabled ?? true,
    googleAccount: account
      ? {
          providerEmail: account.providerEmail,
          linkedAt: account.linkedAt.toISOString(),
          lastLoginAt: account.lastLoginAt?.toISOString() ?? null,
        }
      : null,
  }
}
