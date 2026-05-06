import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { z } from 'zod'
import { getUserByEmail } from '@/modules/users/queries/getUserByEmail'
import { authConfig } from '@/lib/auth.config'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

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
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await getUserByEmail(parsed.data.email)
        if (!user) return null

        const isValid = await compare(parsed.data.password, user.password)
        if (!isValid) return null

        return { id: user.id, email: user.email, role: user.role }
      },
    }),
  ],
})
