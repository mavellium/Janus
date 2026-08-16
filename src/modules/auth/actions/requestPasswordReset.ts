'use server'

import { z } from 'zod'
import { headers } from 'next/headers'
import { db } from '@/lib/prisma'
import { sendMail } from '@/lib/mail'
import { appBaseUrl } from '@/lib/app-url'
import { rateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit-logger'
import { createResetToken, resetTokenExpiresAt } from '@/modules/auth/domain/passwordReset'
import { buildPasswordResetEmail } from '@/modules/auth/domain/passwordResetEmail'

const schema = z.object({ email: z.string().email() })

const GENERIC_MESSAGE =
  'Se existir uma conta com esse e-mail, enviamos um link para redefinir a senha.'

export type RequestPasswordResetState = {
  ok?: boolean
  message?: string
  error?: string
  email?: string
}

export async function requestPasswordReset(
  _prev: RequestPasswordResetState,
  formData: FormData,
): Promise<RequestPasswordResetState> {
  const parsed = schema.safeParse({ email: formData.get('email') })
  if (!parsed.success) return { ok: false, error: 'Informe um e-mail válido.' }

  const email = parsed.data.email.toLowerCase()
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const userAgent = headersList.get('user-agent')

  const byIp = rateLimit(`password-reset:ip:${ip}`, 5, 15 * 60 * 1000)
  const byEmail = rateLimit(`password-reset:email:${email}`, 3, 15 * 60 * 1000)
  if (!byIp.allowed || !byEmail.allowed) {
    const blockedUntil = Math.max(
      byIp.allowed ? 0 : byIp.resetAt,
      byEmail.allowed ? 0 : byEmail.resetAt,
    )
    const minutes = Math.max(1, Math.ceil((blockedUntil - Date.now()) / 60_000))
    return {
      ok: false,
      email,
      error: `Muitas solicitações em sequência. Tente novamente em ${minutes} min.`,
    }
  }

  const user = await db.user.findFirst({
    where: { email, deletedAt: null },
    select: { id: true, email: true, name: true, companyId: true },
  })

  if (!user) return { ok: true, message: GENERIC_MESSAGE, email }

  const { token, tokenHash } = createResetToken()

  await db.$transaction([
    db.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: resetTokenExpiresAt(),
        ip,
        userAgent,
      },
    }),
  ])

  const baseUrl = await appBaseUrl()
  const message = buildPasswordResetEmail({
    name: user.name,
    resetUrl: `${baseUrl}/reset-password/${token}`,
  })

  const sent = await sendMail({ to: user.email, ...message })
  if (!sent.ok) return { ok: false, email, error: sent.error }

  await logAudit({
    userId: user.id,
    action: 'UPDATE',
    entity: 'User',
    entityId: user.id,
    entityLabel: `Solicitação de redefinição de senha · ${user.email}`,
    companyId: user.companyId,
    newData: { passwordResetRequestedAt: new Date().toISOString(), ip },
  })

  return { ok: true, message: GENERIC_MESSAGE, email }
}
