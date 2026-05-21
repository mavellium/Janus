# Auth — Padrões de Código

## Server Action Template (Impersonation)

```typescript
'use server'
import { cookies } from 'next/headers'
import { auth } from '@/lib/auth'

export async function someAction() {
  const session = await auth()
  const role = session?.user?.role
  if (role !== 'ADMIN' && role !== 'DEVELOPER') {
    return { ok: false as const, error: 'Acesso não autorizado' }
  }
  // ... operation
}
```

## Layout: Sidebar com dados do impersonated

```typescript
// layout.tsx — server component
const impersonatedId = await getImpersonatedUserId()
let impersonatedEmail: string | null = null
let impersonatedName: string | null = null
if (impersonatedId) {
  const target = await db.user.findUnique({
    where: { id: impersonatedId },
    select: { email: true, name: true },
  })
  impersonatedEmail = target?.email ?? null
  impersonatedName = target?.name ?? null
}

<Sidebar
  email={impersonatedId && impersonatedEmail ? impersonatedEmail : session.user.email ?? ''}
  name={impersonatedId && impersonatedName ? impersonatedName : session.user.name ?? null}
/>
```

## Banner: Modo privilegiado (Shield) vs Voltar ao Painel

```typescript
// Shield — para impersonation, recarrega mesma página como ADMIN/DEV
<button onClick={async () => {
  await stopImpersonation(false)
  window.location.reload()
}}>
  <Shield />
</button>

// Voltar ao Painel — para impersonation, redireciona para URL de origem
<button onClick={async () => {
  await stopImpersonation() // lê cookie return_url e redirecta
}}>
  <ArrowLeft /> Voltar ao Painel
</button>
```

## Page: Settings com dados do impersonated

```typescript
const impersonatedId = await getImpersonatedUserId()
const userId = impersonatedId ?? session.user.id
const user = await db.user.findUnique({ where: { id: userId }, ... })
```

## Permission Check em Page

```typescript
import { checkPermission } from '@/lib/auth/permissions'

const canBuild = await checkPermission('PAGE_BUILD', userId, companySlug)
if (!canBuild) redirect('/403')
```
