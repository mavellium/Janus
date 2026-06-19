# Analytics — Padrões de Código

## Página de resultados por projeto (Server → Client)
```tsx
// sites/[siteId]/analytics/page.tsx (e landing-pages/[lpId])
noStore()
const session = await auth(); if (!session?.user) redirect('/login')
const project = await getProjectGa4(siteId, companySlug); if (!project) notFound()
<AnalyticsPanel
  companySlug={companySlug}
  propertyId={project.ga4PropertyId}
  projectId={project.id}
  userRole={session.user.role}   // controla visibilidade do Property ID/botão
/>
```

## Painel por projeto (Client) — fetch sem useEffect-de-dados proibido? (exceção GA4)
```tsx
'use client'
// AnalyticsPanel busca /api/analytics?propertyId= em useEffect (dado dinâmico, client-side por causa do recharts)
// Property ID + "Alterar" + Ga4SetupForm SÓ se userRole === 'ADMIN' || 'DEVELOPER'
{(userRole === 'ADMIN' || userRole === 'DEVELOPER') && (<...Property ID + Alterar...>)}
```

## Panorama geral (soma de todos os projetos) — SEM ID
```tsx
// dashboard/results/page.tsx
const projectsWithGa4 = await db.project.findMany({
  where: { companyId, isActive: true, deletedAt: null, ga4PropertyId: { not: null } },
  select: { ga4PropertyId: true },
})
const projectPropertyIds = projectsWithGa4.map(p => p.ga4PropertyId).filter((id): id is string => Boolean(id))
<CompanyAnalyticsOverview projectPropertyIds={projectPropertyIds} />  // nenhuma prop de ID/role
```

## Cores do gráfico (recharts) — proibido hex literal
Use variáveis CSS: `stroke="var(--brand-cta)"`, `fill="url(#grad)"`. Variação +/-: `text-green-600 dark:text-green-400` / `text-destructive`.

## GA4 client — batch (1 round-trip)
```ts
const [response] = await client.batchRunReports({ property, requests: [r1,...,r6] })
const [daily, funnel, events, channels, sources, pages] = response.reports ?? []
```
