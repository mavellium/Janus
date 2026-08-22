'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormSelect } from '@/components/ui/form-select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { adminUpdateLimitOverrides } from '@/modules/billing/actions/adminUpdateSubscription'
import { LIMIT_LABELS, PLAN_CATALOG, formatLimitValue } from '@/modules/billing/domain/plans'
import type { EffectiveSubscription } from '@/modules/billing/domain/limits'
import type { CompanyUsage } from '@/modules/billing/queries/getCompanyUsage'
import { BOOLEAN_LIMIT_KEYS, NUMERIC_LIMIT_KEYS, USAGE_BY_LIMIT } from './planDisplay'

interface CompanyLimitsModalProps {
  companyId: string
  companyName: string
  subscription: EffectiveSubscription
  usage: CompanyUsage
  onClose: () => void
}

export function CompanyLimitsModal({
  companyId,
  companyName,
  subscription,
  usage,
  onClose,
}: CompanyLimitsModalProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const { limits, planLimits, overrides } = subscription

  function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await adminUpdateLimitOverrides(null, formData)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
      onClose()
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-brand-text flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-brand-primary" />
            Limites manuais — {companyName}
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-brand-muted">
          Campo vazio segue o plano {PLAN_CATALOG[subscription.tier].name}. Escreva{' '}
          <code className="bg-brand-btn-light px-1 rounded text-brand-text">ilimitado</code> para
          remover o teto.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="companyId" value={companyId} />

          <div className="grid grid-cols-2 gap-4">
            {NUMERIC_LIMIT_KEYS.map((key) => {
              const usageKey = USAGE_BY_LIMIT[key]
              const hasOverride = key in overrides
              const override = overrides[key]
              return (
                <div key={key} className="flex flex-col gap-1.5">
                  <Label>{LIMIT_LABELS[key]}</Label>
                  <Input
                    name={key}
                    placeholder={`Plano: ${formatLimitValue(planLimits[key])}`}
                    defaultValue={
                      hasOverride ? (override === null ? 'ilimitado' : String(override)) : ''
                    }
                  />
                  <p className="text-[11px] text-brand-muted">
                    Em vigor: {formatLimitValue(limits[key])}
                    {usageKey ? ` · uso: ${usage[usageKey]}` : ''}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4">
            {BOOLEAN_LIMIT_KEYS.map((key) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-brand-text">{LIMIT_LABELS[key]}</p>
                  <p className="text-[11px] text-brand-muted">
                    Plano: {formatLimitValue(planLimits[key])}
                  </p>
                </div>
                <FormSelect
                  name={key}
                  defaultValue={key in overrides ? String(overrides[key]) : 'plano'}
                  className="w-44 shrink-0"
                  options={[
                    { value: 'plano', label: 'Seguir o plano' },
                    { value: 'true', label: 'Liberar' },
                    { value: 'false', label: 'Bloquear' },
                  ]}
                />
              </div>
            ))}
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Salvar limites
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
