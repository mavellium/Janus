'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, MailSearch, RotateCcw } from 'lucide-react'
import {
  requestPasswordReset,
  type RequestPasswordResetState,
} from '@/modules/auth/actions/requestPasswordReset'
import { AuthLogo } from '@/components/auth/AuthLogo'

interface ForgotPasswordFormProps {
  defaultEmail: string
  linkTtlMinutes: number
}

export function ForgotPasswordForm({ defaultEmail, linkTtlMinutes }: ForgotPasswordFormProps) {
  const [state, action, pending] = useActionState<RequestPasswordResetState, FormData>(
    requestPasswordReset,
    {},
  )
  const [editingEmail, setEditingEmail] = useState(false)

  const sentTo = state.ok && state.email ? state.email : null
  const showConfirmation = Boolean(sentTo) && !editingEmail

  return (
    <div className="w-full max-w-sm">
      <div className="px-8 py-10 bg-card rounded-2xl shadow-sm border border-brand-btn-light">
        <div className="mb-8 text-center">
          <AuthLogo />
          <h1 className="text-xl font-semibold tracking-tight text-brand-text">
            {showConfirmation ? 'Verifique seu e-mail' : 'Recuperar acesso'}
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            {showConfirmation ? (
              <>
                Se existir uma conta para{' '}
                <span className="font-medium text-brand-text break-all">{sentTo}</span>, o link de
                redefinição está a caminho.
              </>
            ) : (
              'Informe seu e-mail e enviaremos um link para criar uma nova senha.'
            )}
          </p>
        </div>

        {showConfirmation ? (
          <div className="space-y-5">
            <div className="space-y-3 rounded-xl border border-brand-btn-light bg-brand-bg p-4">
              <div className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                <p className="text-xs leading-relaxed text-brand-muted">
                  O link vale por{' '}
                  <span className="font-medium text-brand-text">{linkTtlMinutes} minutos</span> e
                  pode ser usado uma única vez.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <MailSearch className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                <p className="text-xs leading-relaxed text-brand-muted">
                  Não chegou? Procure por <span className="font-medium text-brand-text">Janus</span>{' '}
                  no spam e na lixeira antes de pedir outro.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Link
                href="/login"
                className="block w-full text-center rounded-lg bg-brand-btn-dark px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-hover"
              >
                Voltar para o login
              </Link>

              <form action={action}>
                <input type="hidden" name="email" value={sentTo ?? ''} />
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-brand-btn-light bg-card px-4 py-2.5 text-sm font-medium text-brand-text transition hover:bg-brand-bg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${pending ? 'animate-spin' : ''}`} />
                  {pending ? 'Reenviando…' : 'Enviar novamente'}
                </button>
              </form>
            </div>

            <button
              type="button"
              onClick={() => setEditingEmail(true)}
              className="block w-full text-center text-xs font-medium text-brand-muted transition hover:text-brand-text"
            >
              Digitei o e-mail errado
            </button>
          </div>
        ) : (
          <form action={action} onSubmit={() => setEditingEmail(false)} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-brand-text">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                required
                defaultValue={state.email ?? defaultEmail}
                placeholder="seu@email.com"
                aria-describedby="email-hint"
                className="w-full rounded-lg border border-brand-btn-light bg-brand-bg px-3.5 py-2.5 text-sm text-brand-text placeholder:text-brand-muted outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-50"
                disabled={pending}
              />
              <p id="email-hint" className="text-xs text-brand-muted">
                Use o e-mail cadastrado no Janus. O link expira em {linkTtlMinutes} minutos.
              </p>
            </div>

            {state.error && (
              <p
                role="alert"
                className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2"
              >
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full mt-2 flex items-center justify-center rounded-lg bg-brand-btn-dark px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Enviando…
                </>
              ) : (
                'Enviar link de redefinição'
              )}
            </button>

            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 text-xs font-medium text-brand-muted transition hover:text-brand-text"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar para o login
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
