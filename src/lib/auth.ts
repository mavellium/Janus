import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { z } from 'zod'
import { headers } from 'next/headers'
import { authConfig } from '@/lib/auth.config'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const getClientIp = async () => {
  const headersList = await headers()
  return headersList.get('x-forwarded-for') || 'unknown'
}

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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('does not exist') || errorMessage.includes('P2021')) {
      return false
    }
    return false
  }
}

const recordFailedAttempt = async (ip: string, email: string) => {
  try {
    await db.loginAttempt.create({
      data: { ip, email },
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (!errorMessage.includes('does not exist') && !errorMessage.includes('P2021')) {
      throw error
    }
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const ip = await getClientIp()

        if (await isIpBlocked(ip)) {
          throw new Error('IP_BLOCKED')
        }

        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) {
          await recordFailedAttempt(ip, '')
          return null
        }

        const user = await db.user.findUnique({
          where: { email: parsed.data.email, deletedAt: null },
          include: { company: true },
        })
        if (!user) {
          await recordFailedAttempt(ip, parsed.data.email)
          return null
        }

        const isValid = await compare(parsed.data.password, user.password)
        if (!isValid) {
          await recordFailedAttempt(ip, parsed.data.email)
          return null
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          image: user.image,
          companySlug: user.role === 'DEVELOPER' ? undefined : user.company.slug,
        }
      },
    }),
  ],
})
