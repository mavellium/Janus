# 💾 Padrões de Código — Copy/Paste

## Server Action: Salvar contentData (Modo Avançado)

```typescript
// src/modules/projects/actions/updatePageContentData.ts
'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function updatePageContentData({
  pageId,
  contentData,
}: {
  pageId: string
  contentData: Record<string, unknown>
}) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  try {
    const page = await db.page.findUnique({
      where: { id: pageId },
      include: { project: { include: { company: true } } },
    })

    if (!page) return { ok: false, error: 'Página não encontrada' }

    if (
      session.user.companySlug &&
      page.project.company.slug !== session.user.companySlug &&
      session.user.role !== 'ADMIN'
    ) {
      return { ok: false, error: 'Acesso negado' }
    }

    const safeData = JSON.parse(JSON.stringify(contentData))  // ← Full replace

    await db.page.update({
      where: { id: pageId },
      data: { contentData: safeData },
    })

    revalidatePath(`/${page.project.company.slug}/dashboard`, 'layout')

    return { ok: true }
  } catch (error) {
    console.error('[updatePageContentData]', error)
    return { ok: false, error: 'Erro ao salvar conteúdo' }
  }
}
```

---

## Component: Usar setDeep com React State

```typescript
// Dentro de AdvancedJsonEditor ou similar
const handleFieldChange = useCallback(
  (path: string[], value: unknown) => {
    setLocalData((prev) => {
      const next = setDeep(prev, path, value)
      onDataChange?.(next)  // ← Notify parent (não debounced)
      fireReplace(next)      // ← Preview iframe (debounced 400ms)
      return next
    })
  },
  [fireReplace, onDataChange],
)
```

---

## Hook: Rastrear Latest Data com Ref

```typescript
// Em SchemaBuilderEditor
const contentDataRef = useRef<Record<string, unknown>>(contentDataObj)

// Em AdvancedJsonEditor
<AdvancedJsonEditor
  onDataChange={(d) => { contentDataRef.current = d }}
  ...
/>

// Ao salvar
const handleSaveContent = () => {
  startTransition(async () => {
    const result = await updatePageContentData({
      pageId,
      contentData: contentDataRef.current,
    })
    // ... feedback ...
  })
}
```

---

## Page Server Component: Carregar com Fresh Data

```typescript
import { unstable_noStore } from 'next/cache'

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ companySlug: string; siteId: string; pageId: string }>
}) {
  unstable_noStore()  // ← Força fresh data
  
  const { companySlug, siteId, pageId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const page = await db.page.findUnique({
    where: { id: pageId, projectId: siteId, deletedAt: null },
    select: {
      id: true,
      name: true,
      schemaData: true,
      contentData: true,
      isAdvanced: true,  // ← Leia flag
    },
  })

  return (
    <SchemaBuilderEditor
      initialSchema={page.schemaData}
      initialContentData={page.contentData}
      initialIsAdvanced={page.isAdvanced}
      ...
    />
  )
}
```

---

## Render Condicional: Legado vs Avançado

```typescript
// Em SiteContentEditClient
{isAdvanced ? (
  <AdvancedJsonEditor
    pageId={pageId}
    data={contentDataObj}
    onSave={handleSave}
    onChange={handleContentChange}
    isDevMode={false}
  />
) : (
  <DynamicForm
    pageId={pageId}
    schemaData={schemaData}
    initialContentData={initialContentData}
    onSave={handleSave}
    onChange={handleContentChange}
  />
)}
```

---

## Type Inference: Pattern Matching

```typescript
function inferType(key: string, value: unknown): string {
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'

  const lk = key.toLowerCase()

  if (Array.isArray(value)) {
    return lk.includes('paragraph') ? 'paragraphs' : 'array'
  }

  if (typeof value === 'object' && value !== null) {
    return lk.includes('cta') ? 'cta' : 'object'
  }

  if (typeof value === 'string') {
    if (lk.includes('url') || lk.includes('link')) return 'url'
    if (lk.includes('color') || value.startsWith('#')) return 'color'
    if (lk.includes('image') || value.endsWith('.png')) return 'image'
    if (value.length > 50) return 'textarea'
  }

  return 'text'
}
```

---

## Permission Check: Access Control

```typescript
// Em qualquer Server Action que muta banco
if (
  session.user.companySlug &&
  page.project.company.slug !== session.user.companySlug &&
  session.user.role !== 'ADMIN'
) {
  return { ok: false, error: 'Acesso negado' }
}
```

