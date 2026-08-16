import Link from 'next/link'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { getPasswordResetTokenStatus } from '@/modules/auth/queries/getPasswordResetTokenStatus'
import { PASSWORD_RESET_TTL_MINUTES } from '@/modules/auth/domain/passwordReset'

export const metadata = { title: 'Criar nova senha — Janus' }

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const status = await getPasswordResetTokenStatus(token)

  if (!status.valid || !status.email) {
    return (
      <div className="w-full max-w-sm">
        <div className="px-8 py-10 bg-card rounded-2xl shadow-sm border border-brand-btn-light text-center">
          <h1 className="text-xl font-semibold tracking-tight text-brand-text">
            Link inválido ou expirado
          </h1>
          <p className="mt-2 text-sm text-brand-muted">
            Links de redefinição valem por {PASSWORD_RESET_TTL_MINUTES} minutos e podem ser usados
            uma única vez.
          </p>
          <Link
            href="/forgot-password"
            className="mt-6 block w-full rounded-lg bg-brand-btn-dark px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-hover"
          >
            Solicitar novo link
          </Link>
        </div>
      </div>
    )
  }

  return <ResetPasswordForm token={token} email={status.email} />
}
