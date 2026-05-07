'use client'

import { useActionState, useEffect, useState } from 'react'
import { signInAction, type SignInState } from '@/modules/users/actions/signInAction'
import { checkIpStatus, type IpStatusResponse } from '@/modules/auth/actions/checkIpStatus'

export function LoginForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInAction, {})
  const [ipStatus, setIpStatus] = useState<IpStatusResponse>({
    blocked: false,
    remainingSeconds: 0,
    reason: '',
  })
  const [displayTime, setDisplayTime] = useState('00:00')

  useEffect(() => {
    checkIpStatus().then(setIpStatus)
  }, [])

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

  useEffect(() => {
    const minutes = Math.floor(ipStatus.remainingSeconds / 60)
    const seconds = ipStatus.remainingSeconds % 60
    setDisplayTime(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
  }, [ipStatus.remainingSeconds])

  return (
    <div className="w-full max-w-sm relative">
      {ipStatus.blocked && (
        <div className="absolute inset-0 bg-black/70 rounded-2xl z-50 flex flex-col items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 shadow-lg text-center max-w-xs">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#514030' }}>
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 0 1 5.11 6.524a6 6 0 0 1 8.367 8.366l1.414 1.414a8 8 0 1 0-11.313-11.313l1.414 1.414A6 6 0 0 1 13.477 14.89ZM9 4a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 9 4Z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#514030' }}>
              Acesso Suspenso
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {ipStatus.reason}
            </p>
            <div className="text-3xl font-bold tabular-nums" style={{ color: '#514030' }}>
              {displayTime}
            </div>
            <p className="text-xs text-gray-500 mt-2">Tente novamente em breve</p>
          </div>
        </div>
      )}

      <div className="px-8 py-10 bg-white rounded-2xl shadow-sm border border-brand-muted/40" style={{ opacity: ipStatus.blocked ? 0.5 : 1, pointerEvents: ipStatus.blocked ? 'none' : 'auto' }}>
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand-primary mb-4">
            <span className="text-white font-bold text-sm">J</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-brand-text">Entrar no Janus</h1>
          <p className="mt-1 text-sm text-brand-muted">Bem-vindo de volta.</p>
        </div>

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
              placeholder="seu@email.com"
              className="w-full rounded-lg border border-brand-muted/60 bg-white px-3.5 py-2.5 text-sm text-brand-text placeholder:text-brand-muted outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-50"
              disabled={pending || ipStatus.blocked}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-brand-text">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="w-full rounded-lg border border-brand-muted/60 bg-white px-3.5 py-2.5 text-sm text-brand-text placeholder:text-brand-muted outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-50"
              disabled={pending || ipStatus.blocked}
            />
          </div>

          {state.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending || ipStatus.blocked}
            className="w-full mt-2 rounded-lg bg-brand-btn-dark px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
