'use client'

import { useActionState } from 'react'
import { signInAction, type SignInState } from '@/modules/users/actions/signInAction'

export function LoginForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInAction, {})

  return (
    <div className="w-full max-w-sm px-8 py-10 bg-white rounded-2xl shadow-sm border border-brand-muted/40">
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
            disabled={pending}
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
            disabled={pending}
          />
        </div>

        {state.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full mt-2 rounded-lg bg-brand-btn-dark px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
