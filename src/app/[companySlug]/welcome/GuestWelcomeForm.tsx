'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { registerGuest } from '@/modules/guests/actions/registerGuest'
import { confirmExistingGuest } from '@/modules/guests/actions/confirmExistingGuest'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, UserCircle } from 'lucide-react'
import Image from 'next/image'

interface Company {
  id: string
  name: string
  logo?: string | null
}

export function GuestWelcomeForm({ company }: { company: Company }) {
  const [state, formAction, isPending] = useActionState(registerGuest, { ok: false })
  const [confirming, startConfirm] = useTransition()
  const router = useRouter()
  const params = useParams()
  const companySlug = params.companySlug as string

  useEffect(() => {
    if (state.ok) {
      router.push(`/${companySlug}/guest`)
    }
  }, [state.ok, router, companySlug])

  function handleConfirmExisting() {
    if (!state.guestId) return
    startConfirm(async () => {
      const result = await confirmExistingGuest(state.guestId!, company.id)
      if (result.ok) {
        router.push(`/${companySlug}/guest`)
      }
    })
  }

  if (state.existingEntry && state.guestId) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold text-brand-text mb-2">E-mail já cadastrado</h2>
        <p className="text-sm text-brand-muted mb-6">
          O e-mail já possui um registro em{' '}
          <strong className="text-brand-text">{company.name}</strong>.
          Deseja continuar como <strong className="text-brand-text">{state.existingName}</strong>?
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.refresh()}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={confirming}
            className="flex-1"
            onClick={handleConfirmExisting}
          >
            {confirming && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
            Continuar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-md shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        {company.logo ? (
          <Image
            src={company.logo}
            alt={company.name}
            width={40}
            height={40}
            className="rounded-lg object-contain"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
            <UserCircle className="w-6 h-6 text-brand-primary" />
          </div>
        )}
        <div>
          <p className="text-xs text-brand-muted">Bem-vindo a</p>
          <h1 className="text-lg font-bold text-brand-text">{company.name}</h1>
        </div>
      </div>

      <p className="text-sm text-brand-muted mb-6">
        Preencha seus dados para começar a compartilhar fotos.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="companyId" value={company.id} />

        <div className="flex flex-col gap-1.5">
          <Label>Nome</Label>
          <Input name="name" required placeholder="Seu nome completo" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>E-mail</Label>
          <Input name="email" type="email" required placeholder="seu@email.com" />
        </div>

        {state.error && (
          <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={isPending} className="mt-1">
          {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
          Entrar
        </Button>
      </form>
    </div>
  )
}
