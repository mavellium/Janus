# Blog — Padrões de Código

## Página de listagem com banner RBAC (Server Component)
```typescript
import { auth } from '@/lib/auth'
import { isPrivilegedRole } from '@/lib/auth/permissions'
import { headers } from 'next/headers'
import { ApiEndpointBanner } from '@/components/blog/ApiEndpointBanner'

const session = await auth()
const isDeveloperOrAdmin = isPrivilegedRole(session.user.role)

const headersList = await headers()
const host = headersList.get('host') ?? 'localhost:3000'
const proto = headersList.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https')
const apiUrl = `${proto}://${host}/api/${companySlug}/${projectId}/blog`

// No JSX:
{isDeveloperOrAdmin && <ApiEndpointBanner url={apiUrl} />}
```

## Criar post com tags via FormData
```typescript
// No formulário (hidden inputs repetidos):
tagIds.forEach(id => formData.append('tagIds', id))

// Na action:
const tagIds = formData.getAll('tagIds').map(String).filter(Boolean)
// Ao criar: tags: { create: tagIds.map(tagId => ({ tagId })) }
// Ao editar: tags: { deleteMany: {}, create: tagIds.map(tagId => ({ tagId })) }
```

## Validar acesso à empresa na action
```typescript
const company = await db.company.findUnique({ where: { slug: companySlug, deletedAt: null } })
if (!company) return { ok: false as const, error: 'Empresa não encontrada' }
if (session.user.role !== 'ADMIN' && session.user.companySlug !== companySlug) {
  return { ok: false as const, error: 'Acesso negado' }
}
```

## Rota pública — filtro de publicados
```typescript
// Nunca omitir publishedAt em contexto público:
where: {
  projectId,
  publishedAt: { lte: new Date() },
  project: { companyId: company.id, blogEnabled: true, isActive: true, deletedAt: null },
}
```

## Gerar slug para categoria/tag
```typescript
import { generateSlug } from '@/lib/slug'
const slug = generateSlug(name)
// Sempre gerar antes do create/update — não deixar o usuário definir
```
