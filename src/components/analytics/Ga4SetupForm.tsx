'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateProjectGa4 } from '@/modules/analytics/actions/updateProjectGa4'

interface Props {
  companySlug: string
  projectId: string
  onSuccess?: () => void
}

type FormState = { error?: string }

export function Ga4SetupForm({ companySlug, projectId, onSuccess }: Props) {
  const router = useRouter()

  async function formAction(_prev: FormState, formData: FormData): Promise<FormState> {
    const ga4PropertyId = String(formData.get('ga4PropertyId') ?? '')
    const result = await updateProjectGa4({ projectId, companySlug, ga4PropertyId })

    if (!result.ok) return { error: result.error }
    router.refresh()
    onSuccess?.()
    return {}
  }

  const [state, action, pending] = useActionState(formAction, {})

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-16 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
        <BarChart3 className="h-7 w-7" />
      </span>
      <div className="space-y-1.5 max-w-md">
        <h3 className="text-lg font-semibold text-brand-text">Conecte o Google Analytics</h3>
        <p className="text-sm text-brand-muted">
          Cole o ID da Propriedade do GA4 (apenas números) para visualizar visitas, usuários
          e sessões em tempo real.
        </p>
      </div>

      <form action={action} className="w-full max-w-sm space-y-4">
        <div className="space-y-1.5 text-left">
          <Label htmlFor="ga4PropertyId">ID da Propriedade (GA4)</Label>
          <Input
            id="ga4PropertyId"
            name="ga4PropertyId"
            inputMode="numeric"
            placeholder="Ex: 123456789"
            required
          />
        </div>
        {state.error && <p className="text-sm text-destructive text-left">{state.error}</p>}
        <Button type="submit" disabled={pending} size="lg" className="w-full">
          {pending ? 'Salvando…' : 'Salvar e conectar'}
        </Button>
      </form>
    </div>
  )
}
