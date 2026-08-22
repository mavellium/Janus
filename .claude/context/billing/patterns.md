# Billing — Padrões copy-paste

## Aplicar cota numérica numa Server Action

```ts
import { enforceQuota } from '@/modules/billing/guards/enforcePlan'

const quota = await enforceQuota(company.id, 'projects')
if (!quota.ok) {
  return { ok: false, error: quota.error, code: quota.code }
}
```

Vai **depois** da checagem de auth/empresa e **antes** da escrita no Prisma. `enforceQuota` só
consulta uso quando o limite não é `null`, então plano Enterprise não paga `COUNT`.

## Aplicar feature booleana

```ts
import { enforceFeature } from '@/modules/billing/guards/enforcePlan'

const feature = await enforceFeature(company.id, 'scripts')
if (!feature.ok) return { ok: false, error: feature.error }
```

Se a feature é condicional (ex: agendamento só quando a data é futura), teste a condição antes de
chamar o guard — cobrar plano por uma publicação imediata seria errado:

```ts
if (isFutureDate(scheduledAt)) {
  const feature = await enforceFeature(company.id, 'blogScheduling')
  if (!feature.ok) return { ok: false as const, error: feature.error }
}
```

## Ler plano + uso numa página (Server Component)

```ts
const [subscription, usage] = await Promise.all([
  getCompanySubscription(company.id),
  getCompanyUsage(company.id),
])

<PlanUsageCard subscription={subscription} usage={usage} />
```

## Criar empresa já com assinatura

```ts
import { initialSubscriptionData } from '@/modules/billing/domain/limits'

await db.company.create({
  data: { ...dados, subscription: { create: initialSubscriptionData() } },
})
```

## Armadilhas

**Campo opcional em update apaga o vínculo.** `companyIdSchema` transforma `undefined → null`. Se
um segundo formulário edita o mesmo registro sem enviar o campo, o `null` sobrescreve. Foi o bug
do wizard do Raio-X — corrigido guardando a escrita atrás de `formData.has('companyId')`:

```ts
data: formData.has('companyId') ? { ...data, companyId } : data
```

**`'use server'` só exporta função async.** `export const X = ...` num arquivo de action quebra o
build. Constante compartilhada mora em `domain/`.

**Não compare limite com número mágico.** `null` é ilimitado; `0` é bloqueado. `if (!limit)` trata
os dois igual e libera geral quando devia bloquear — sempre `limit === null` explícito.
