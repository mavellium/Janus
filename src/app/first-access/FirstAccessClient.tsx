'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Check, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { ToastContainer } from '@/components/ui/toast-container'
import { resetPasswordFirstAccess } from '@/modules/users/actions/resetPasswordFirstAccess'
import { passwordSchema } from '@/lib/validations/password'
import { ZodError } from 'zod'

const OBVIOUS_SEQUENCE =
  /(012|123|234|345|456|567|678|789|987|876|765|654|543|432|321|210)/

const REQUIREMENTS = [
  { label: 'Mínimo de 8 caracteres', test: (pw: string) => pw.length >= 8 },
  { label: 'Pelo menos um número', test: (pw: string) => /[0-9]/.test(pw) },
  {
    label: 'Um caractere especial (@, #, !, etc)',
    test: (pw: string) => /[^a-zA-Z0-9]/.test(pw),
  },
  {
    label: 'Sem sequências óbvias (123, 987...)',
    test: (pw: string) => pw.length > 0 && !OBVIOUS_SEQUENCE.test(pw),
  },
]

export function FirstAccessClient() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { toasts, toast, removeToast } = useToast()

  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldErrors({})

    const newErrors: Record<string, string> = {}

    try {
      passwordSchema.parse(newPassword)
    } catch (err) {
      if (err instanceof ZodError) {
        newErrors.newPassword = err.issues[0].message
      }
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem'
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors)
      return
    }

    startTransition(async () => {
      const result = await resetPasswordFirstAccess({ newPassword })

      if (result.ok && result.redirectUrl) {
        router.push(result.redirectUrl)
      } else if (!result.ok) {
        toast({ message: result.error || 'Erro ao definir senha', type: 'error' })
      }
    })
  }

  return (
    <div className="min-h-svh bg-brand-bg flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4 sm:mb-6">
            <Image
              src="/janus-logo.svg"
              alt="Janus"
              width={120}
              height={120}
              priority
              className="w-24 sm:w-28 h-auto"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-text mb-2">
            Bem-vindo! Vamos proteger sua conta.
          </h1>
          <p className="text-sm text-brand-muted">
            Como este é o seu primeiro acesso, por favor defina uma senha pessoal e segura.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={isPending}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-0 top-0 h-full w-11 inline-flex items-center justify-center text-brand-muted hover:text-brand-text transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors?.newPassword && (
                <p className="text-destructive text-sm">{fieldErrors.newPassword}</p>
              )}
            </div>

            <ul className="grid gap-1.5" aria-label="Requisitos da senha">
              {REQUIREMENTS.map(({ label, test }) => {
                const met = test(newPassword)
                return (
                  <li key={label} className="flex items-center gap-2 text-xs">
                    <span
                      className={cn(
                        'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border transition-colors',
                        met
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-500'
                          : 'border-brand-btn-light text-transparent'
                      )}
                    >
                      <Check size={10} strokeWidth={3} />
                    </span>
                    <span className={cn('transition-colors', met ? 'text-brand-text' : 'text-brand-muted')}>
                      {label}
                    </span>
                  </li>
                )
              })}
            </ul>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={isPending}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-0 top-0 h-full w-11 inline-flex items-center justify-center text-brand-muted hover:text-brand-text transition-colors"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordsMatch && !fieldErrors?.confirmPassword && (
                <p className="flex items-center gap-1.5 text-xs text-emerald-500">
                  <Check size={12} strokeWidth={3} /> As senhas coincidem
                </p>
              )}
              {fieldErrors?.confirmPassword && (
                <p className="text-destructive text-sm">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <Button type="submit" disabled={isPending} className="w-full mt-2 min-h-10">
              {isPending ? 'Salvando...' : 'Definir Senha e Acessar'}
            </Button>
          </form>
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
