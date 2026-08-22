'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Gauge, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DateField } from '@/components/ui/date-field'
import { FormSelect } from '@/components/ui/form-select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { adminUpdateSubscription } from '@/modules/billing/actions/adminUpdateSubscription'
import { PLAN_CATALOG } from '@/modules/billing/domain/plans'
import type { EffectiveSubscription } from '@/modules/billing/domain/limits'
import { PLAN_TIERS, STATUS_LABEL, SUBSCRIPTION_STATUSES, toDateInput } from './planDisplay'

interface CompanyPlanModalProps {
  companyId: string
  companyName: string
  subscription: EffectiveSubscription
  currentPeriodEnd: Date | null
  notes: string | null
  onClose: () => void
}

export function CompanyPlanModal({
  companyId,
  companyName,
  subscription,
  currentPeriodEnd,
  notes,
  onClose,
}: CompanyPlanModalProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await adminUpdateSubscription(null, formData)
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
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-brand-text flex items-center gap-2">
            <Gauge className="w-4 h-4 text-brand-primary" />
            Plano — {companyName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="companyId" value={companyId} />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tier">Plano</Label>
              <FormSelect
                id="tier"
                name="tier"
                defaultValue={subscription.tier}
                options={PLAN_TIERS.map((tier) => ({
                  value: tier,
                  label: PLAN_CATALOG[tier].name,
                }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status">Situação</Label>
              <FormSelect
                id="status"
                name="status"
                defaultValue={subscription.status}
                options={SUBSCRIPTION_STATUSES.map((status) => ({
                  value: status,
                  label: STATUS_LABEL[status],
                }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="trialEndsAt">Teste termina em</Label>
              <DateField
                id="trialEndsAt"
                name="trialEndsAt"
                defaultValue={toDateInput(subscription.trialEndsAt)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="currentPeriodEnd">Ciclo atual até</Label>
              <DateField
                id="currentPeriodEnd"
                name="currentPeriodEnd"
                defaultValue={toDateInput(currentPeriodEnd)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="discountPercent">Desconto (%)</Label>
              <Input
                id="discountPercent"
                name="discountPercent"
                type="number"
                min={0}
                max={100}
                placeholder="0"
                defaultValue={subscription.discountPercent ?? ''}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="discountEndsAt">Desconto até</Label>
              <DateField
                id="discountEndsAt"
                name="discountEndsAt"
                defaultValue={toDateInput(subscription.discountEndsAt)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Observações internas</Label>
            <Textarea name="notes" rows={2} defaultValue={notes ?? ''} />
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
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
