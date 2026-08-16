import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { readSessionPreference } from '@/lib/auth/session'
import { PASSWORD_RESET_TTL_MINUTES } from '@/modules/auth/domain/passwordReset'

export const metadata = { title: 'Recuperar acesso — Janus' }

export default async function ForgotPasswordPage() {
  const preference = await readSessionPreference()

  return (
    <ForgotPasswordForm
      defaultEmail={preference.email}
      linkTtlMinutes={PASSWORD_RESET_TTL_MINUTES}
    />
  )
}
