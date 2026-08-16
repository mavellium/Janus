'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { resetPassword, type ResetPasswordState } from '@/modules/auth/actions/resetPassword'
import { AuthLogo } from '@/components/auth/AuthLogo'

interface ResetPasswordFormProps {
  token: string
  email: string
}

export function ResetPasswordForm({ token, email }: ResetPasswordFormProps) {
  const router = useRouter()
  const [state, action, pending] = useActionState<ResetPasswordState, FormData>(
    resetPassword,
    {},
  )

  useEffect(() => {
    if (state.ok) router.push('/login?reset=1')
  }, [state.ok, router])

  return (
    <div className="w-full max-w-sm">
      <div className="px-8 py-10 bg-card rounded-2xl shadow-sm border border-brand-btn-light">
        <div className="mb-8 text-center">
          <AuthLogo />
          <h1 className="text-xl font-semibold tracking-tight text-brand-text">
            Criar nova senha
          </h1>
          <p className="mt-1 text-sm text-brand-muted">{email}</p>
        </div>

        <form action={action} className="space-y-4">
          <input type="hidden" name="token" value={token} />

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-brand-text">
              Nova senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="••••••••"
              className="w-full rounded-lg border border-brand-btn-light bg-brand-bg px-3.5 py-2.5 text-sm text-brand-text placeholder:text-brand-muted outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-50"
              disabled={pending}
            />
            <p className="text-xs text-brand-muted">
              Mínimo de 8 caracteres, com pelo menos um número e um caractere especial.
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-brand-text"
            >
              Confirmar nova senha
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              placeholder="••••••••"
              className="w-full rounded-lg border border-brand-btn-light bg-brand-bg px-3.5 py-2.5 text-sm text-brand-text placeholder:text-brand-muted outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-50"
              disabled={pending}
            />
          </div>

          {state.error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full mt-2 rounded-lg bg-brand-btn-dark px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? 'Salvando…' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
