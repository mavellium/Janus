'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { ToastContainer } from '@/components/ui/toast-container'
import { resetPasswordFirstAccess } from '@/modules/users/actions/resetPasswordFirstAccess'
import { passwordSchema } from '@/lib/validations/password'
import { ZodError } from 'zod'

export function FirstAccessClient() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const { toasts, toast, removeToast } = useToast()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldErrors({})

    const formData = new FormData(e.currentTarget)
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

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
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image
              src="/janus-logo.svg"
              alt="Janus"
              width={120}
              height={120}
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-brand-text mb-2">
            Bem-vindo! Vamos proteger sua conta.
          </h1>
          <p className="text-sm text-brand-muted">
            Como este é o seu primeiro acesso, por favor defina uma senha pessoal e segura.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="••••••••"
                disabled={isPending}
              />
              {fieldErrors?.newPassword && (
                <p className="text-destructive text-sm">{fieldErrors.newPassword}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                disabled={isPending}
              />
              {fieldErrors?.confirmPassword && (
                <p className="text-destructive text-sm">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <Button type="submit" disabled={isPending} className="w-full mt-2">
              {isPending ? 'Salvando...' : 'Definir Senha e Acessar'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-brand-muted text-center">
              Sua senha deve ter:
              <br />• Mínimo 8 caracteres
              <br />• Pelo menos um número
              <br />• Pelo menos um caractere especial (@, #, !, etc)
              <br />• Sem sequências numéricas óbvias
            </p>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
