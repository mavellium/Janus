'use server'

import { z } from 'zod'
import { hash } from 'bcryptjs'
import { db } from '@/lib/prisma'
import { User } from '../domain/User'
import { DomainError, EmailAlreadyExistsError } from '../domain/errors'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string }

export async function registerUser(
  input: z.infer<typeof schema>
): Promise<ActionResult<{ id: string }>> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Dados inválidos', code: 'VALIDATION_ERROR' }

  try {
    const existing = await db.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    })
    if (existing) throw new EmailAlreadyExistsError(parsed.data.email)

    const hashedPassword = await hash(parsed.data.password, 12)
    const user = User.create({ email: parsed.data.email, hashedPassword })
    const props = user.toObject()

    const defaultCompany = await db.company.findUnique({
      where: { slug: 'default' },
    })
    if (!defaultCompany) throw new Error('Default company not found')

    await db.user.create({
      data: {
        id: props.id,
        email: props.email,
        password: props.password,
        role: props.role,
        createdAt: props.createdAt,
        companyId: defaultCompany.id,
      },
    })

    return { ok: true, data: { id: props.id } }
  } catch (err) {
    if (err instanceof DomainError) return { ok: false, error: err.message, code: err.code }
    console.error('[registerUser]', err)
    return { ok: false, error: 'Erro interno. Tente novamente.' }
  }
}
