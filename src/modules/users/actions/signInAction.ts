'use server'

import { z } from 'zod'
import { signIn } from '@/lib/auth'
import { AuthError } from 'next-auth'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export type SignInState = { error?: string }

export async function signInAction(
  _prev: SignInState,
  formData: FormData
): Promise<SignInState> {
  const parsed = schema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) return { error: 'Email ou senha inválidos.' }

  try {
    await signIn('credentials', { ...parsed.data, redirectTo: '/dashboard' })
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.message === 'IP_BLOCKED') {
        return { error: 'Acesso suspenso. Múltiplas tentativas falhas detectadas.' }
      }
      return { error: 'Email ou senha inválidos.' }
    }
    throw err
  }

  return {}
}
