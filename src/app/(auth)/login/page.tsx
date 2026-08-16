import { LoginForm } from '@/components/auth/LoginForm'
import { isGoogleAuthConfigured } from '@/lib/auth/oauth'
import { readSessionPreference } from '@/lib/auth/session'
import { loginErrorMessage } from '@/modules/auth/domain/loginErrors'

export const metadata = { title: 'Entrar — Janus' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string }>
}) {
  const { error, reset } = await searchParams
  const preference = await readSessionPreference()

  return (
    <LoginForm
      googleEnabled={isGoogleAuthConfigured()}
      defaultEmail={preference.email}
      defaultRemember={preference.remember}
      providerError={loginErrorMessage(error)}
      passwordResetDone={reset === '1'}
    />
  )
}
