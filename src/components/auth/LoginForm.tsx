'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signInAction, type SignInState } from '@/modules/users/actions/signInAction'
import { checkIpStatus, type IpStatusResponse } from '@/modules/auth/actions/checkIpStatus'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { AuthLogo } from '@/components/auth/AuthLogo'

interface LoginFormProps {
  googleEnabled: boolean
  defaultEmail: string
  defaultRemember: boolean
  providerError: string | null
  passwordResetDone: boolean
}

export function LoginForm({
  googleEnabled,
  defaultEmail,
  defaultRemember,
  providerError,
  passwordResetDone,
}: LoginFormProps) {
  const router = useRouter()
  const [state, action, pending] = useActionState<SignInState, FormData>(signInAction, {})
  const [ipStatus, setIpStatus] = useState<IpStatusResponse>({
    blocked: false,
    remainingSeconds: 0,
    reason: '',
  })
  const displayTime = `${String(Math.floor(ipStatus.remainingSeconds / 60)).padStart(2, '0')}:${String(ipStatus.remainingSeconds % 60).padStart(2, '0')}`

  useEffect(() => {
    checkIpStatus().then(setIpStatus)
  }, [])

  useEffect(() => {
    if (state.redirectUrl) {
      router.push(state.redirectUrl)
    }
  }, [state.redirectUrl, router])

  useEffect(() => {
    if (!ipStatus.blocked || ipStatus.remainingSeconds <= 0) return

    const timer = setInterval(() => {
      setIpStatus((prev) => {
        const newRemaining = Math.max(0, prev.remainingSeconds - 1)
        if (newRemaining === 0) {
          clearInterval(timer)
          return { ...prev, blocked: false, remainingSeconds: 0 }
        }
        return { ...prev, remainingSeconds: newRemaining }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [ipStatus.blocked, ipStatus.remainingSeconds])

  return (
    <div className="w-full max-w-sm relative">
      {ipStatus.blocked && (
        <div className="absolute inset-0 bg-black/70 rounded-2xl z-50 flex flex-col items-center justify-center backdrop-blur-sm">
          <div className="bg-card rounded-xl p-6 shadow-lg text-center max-w-xs">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-brand-primary">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 0 1 5.11 6.524a6 6 0 0 1 8.367 8.366l1.414 1.414a8 8 0 1 0-11.313-11.313l1.414 1.414A6 6 0 0 1 13.477 14.89ZM9 4a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 9 4Z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2 text-brand-primary">
              Acesso Suspenso
            </h2>
            <p className="text-sm text-brand-muted mb-4">
              {ipStatus.reason}
            </p>
            <div className="text-3xl font-bold tabular-nums text-brand-primary">
              {displayTime}
            </div>
            <p className="text-xs text-brand-muted mt-2">Tente novamente em breve</p>
          </div>
        </div>
      )}

      <div className="px-8 py-10 bg-card rounded-2xl shadow-sm border border-brand-btn-light" style={{ opacity: ipStatus.blocked ? 0.5 : 1, pointerEvents: ipStatus.blocked ? 'none' : 'auto' }}>
        <div className="mb-8 text-center">
          <AuthLogo />
          <h1 className="text-xl font-semibold tracking-tight text-brand-text">Entrar no Janus</h1>
          <p className="mt-1 text-sm text-brand-muted">Bem-vindo de volta.</p>
        </div>

        {passwordResetDone && (
          <p className="mb-4 text-sm text-brand-text bg-brand-primary/10 border border-brand-primary/30 rounded-lg px-3 py-2">
            Senha redefinida com sucesso. Entre com a nova senha.
          </p>
        )}

        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-brand-text">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={defaultEmail}
              placeholder="seu@email.com"
              className="w-full rounded-lg border border-brand-btn-light bg-brand-bg px-3.5 py-2.5 text-sm text-brand-text placeholder:text-brand-muted outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-50"
              disabled={pending || ipStatus.blocked}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-brand-text">
                Senha
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-brand-primary hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="w-full rounded-lg border border-brand-btn-light bg-brand-bg px-3.5 py-2.5 text-sm text-brand-text placeholder:text-brand-muted outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-50"
              disabled={pending || ipStatus.blocked}
            />
          </div>

          <label
            htmlFor="remember"
            className="flex items-center gap-2 text-sm text-brand-muted select-none cursor-pointer"
          >
            <input
              id="remember"
              name="remember"
              type="checkbox"
              defaultChecked={defaultRemember}
              disabled={pending || ipStatus.blocked}
              className="h-4 w-4 rounded border-brand-btn-light text-brand-primary accent-brand-primary focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-50"
            />
            Lembrar minha conta neste dispositivo
          </label>

          {(state.error || providerError) && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
              {state.error ?? providerError}
            </p>
          )}

          <button
            type="submit"
            disabled={pending || ipStatus.blocked}
            className="w-full mt-2 rounded-lg bg-brand-btn-dark px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? 'Entrando…' : 'Entrar'}
          </button>

          {googleEnabled && (
            <>
              <div className="flex items-center gap-3 pt-2">
                <span className="h-px flex-1 bg-brand-btn-light" />
                <span className="text-xs text-brand-muted">ou</span>
                <span className="h-px flex-1 bg-brand-btn-light" />
              </div>
              <GoogleSignInButton disabled={ipStatus.blocked} />
            </>
          )}
        </form>
      </div>
    </div>
  )
}
