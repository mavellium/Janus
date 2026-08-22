# Billing (Planos e Limites) — Sumário Executivo

Planos comerciais do Janus aplicados no produto: catálogo, cota por empresa, enforcement nas
Server Actions e gestão manual pelo painel admin.

## Responsabilidades

| Aspecto            | Responsável                                                        |
|--------------------|--------------------------------------------------------------------|
| Catálogo de planos | `domain/plans.ts` — **fonte única** (preço, features, limites)      |
| Resolução de limite| `domain/limits.ts` — plano + override manual + trial vencido        |
| Enforcement        | `guards/enforcePlan.ts` — `enforceQuota()` / `enforceFeature()`     |
| Leitura            | `queries/` — assinatura, uso atual, listagem admin                  |
| Gestão manual      | `actions/adminUpdateSubscription.ts` — só ADMIN                     |

## Arquivos

- [domain.md](domain.md) — catálogo, limites, estados e invariantes
- [enforcement.md](enforcement.md) — onde cada limite é aplicado
- [patterns.md](patterns.md) — snippets copy-paste
- [changelog.md](changelog.md) — histórico

## Estrutura

```
src/modules/billing/
  domain/plans.ts        — PLAN_CATALOG, PUBLIC_PLANS, PlanLimits, LIMIT_LABELS
  domain/limits.ts       — resolveSubscription(), parseLimitOverrides(), initialSubscriptionData()
  domain/limits.spec.ts  — 11 testes da lógica pura
  guards/enforcePlan.ts  — enforceQuota(), enforceFeature()
  queries/getCompanySubscription.ts
  queries/getCompanyUsage.ts
  actions/adminUpdateSubscription.ts

src/components/billing/
  planDisplay.ts          — labels/estilos de status, listas de chaves, formatação de data
  CompanyPlanModal.tsx    — plano, situação, datas, desconto, notas
  CompanyLimitsModal.tsx  — override manual de cada limite
  PlanUsageCard.tsx       — card de uso no dashboard da empresa
```

## Onde o admin gerencia

**Não existe tela separada de planos.** Plano é atributo da empresa, então tudo vive em
`/dashboard-admin/companies` (`AdminCompaniesClient`): coluna de plano + situação, colunas
opcionais de uso/teste/desconto/ajustes, e 4 ações por linha — editar plano (`Gauge`), limites
manuais (`SlidersHorizontal`), estender teste 7d (`CalendarClock`) e converter teste com desconto
(`BadgeCheck`). As ações de plano só aparecem para ADMIN.

`getAdminCompanies()` já devolve `subscription` (resolvida) + `usage` por empresa — é a query que
alimenta a tela.

## Consumidores do catálogo

`src/app/page.tsx` (landing pública) importa `PUBLIC_PLANS` e `TRIAL_DAYS`. **Não duplicar preço
nem feature-list na landing** — mudou o preço, muda em `domain/plans.ts` e a landing acompanha.
