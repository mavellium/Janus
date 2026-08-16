'use server'

import { z } from 'zod'
import { hash } from 'bcryptjs'
import { db } from '@/lib/prisma'
import { logAudit } from '@/lib/audit-logger'
import { passwordSchema } from '@/lib/validations/password'
import { hashResetToken } from '@/modules/auth/domain/passwordReset'

const schema = z
  .object({
    token: z.string().min(1),
    password: passwordSchema,
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

export type ResetPasswordState = {
  ok?: boolean
  error?: string
}

export async function resetPassword(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = schema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const resetToken = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(parsed.data.token) },
    select: {
      id: true,
      usedAt: true,
      expiresAt: true,
      user: { select: { id: true, email: true, companyId: true, deletedAt: true } },
    },
  })

  if (
    !resetToken ||
    resetToken.usedAt !== null ||
    resetToken.expiresAt.getTime() <= Date.now() ||
    resetToken.user.deletedAt !== null
  ) {
    return { ok: false, error: 'Link inválido ou expirado. Solicite um novo e-mail.' }
  }

  const hashedPassword = await hash(parsed.data.password, 12)

  await db.$transaction([
    db.user.update({
      where: { id: resetToken.user.id },
      data: { password: hashedPassword, requiresPasswordReset: false },
    }),
    db.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    db.passwordResetToken.updateMany({
      where: { userId: resetToken.user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ])

  await logAudit({
    userId: resetToken.user.id,
    action: 'UPDATE',
    entity: 'User',
    entityId: resetToken.user.id,
    entityLabel: `Redefinição de senha · ${resetToken.user.email}`,
    companyId: resetToken.user.companyId,
    newData: { passwordReset: true, resetAt: new Date().toISOString() },
  })

  return { ok: true }
}
