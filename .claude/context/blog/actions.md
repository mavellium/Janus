# Blog — Server Actions

Todas as actions: `auth()` → Zod → company check → role check → Prisma → `revalidatePath`.  
Retorno padrão: `{ ok: true, data }` | `{ ok: false, error: string }`.

---

## createBlogPost
- **Assinatura:** `(_: unknown, formData: FormData) => Promise<{ ok, data?, error? }>`
- **Zod:** `projectId` (uuid), `companySlug`, `title` (min 1), `subtitle?`, `publishedAt` (string→Date), `body`, `coverImageUrl?`, `authorName` (min 1), `categoryId?` (uuid), `tagIds[]` (uuid[]), `seo*?`
- **Fluxo:** auth → parse → valida company → valida role → valida project → `db.blogPost.create` com `tags.create[]` → `revalidatePath(/{companySlug}/dashboard)`
- **Detalhe tags:** `formData.getAll('tagIds')` → cria `BlogPostTag` em cascata

## updateBlogPost
- **Assinatura:** `(_: unknown, formData: FormData) => Promise<{ ok, data?, error? }>`
- **Zod:** igual ao create + `id` (uuid)
- **Fluxo:** auth → parse → valida company → role → busca post por `{id, projectId}` + valida `companyId` → `db.blogPost.update` com `tags: { deleteMany: {}, create: ids.map(...) }` → revalidate
- **Detalhe tags:** full-replace (deleteMany + create)

## deleteBlogPost
- **Assinatura:** `(id: string) => Promise<{ ok, error? }>`
- **Fluxo:** auth → `db.blogPost.delete({ where: { id } })` → `revalidatePath('/', 'layout')`
- **Hard delete** — sem soft delete

## createBlogCategory
- **Assinatura:** `(_: unknown, formData: FormData) => Promise<{ ok, data?, error? }>`
- **Zod:** `projectId` (uuid), `name` (min 1), `description?`, `imageUrl?`, `parentId?` (uuid), `seo*?`
- **Fluxo:** auth → parse → `generateSlug(name)` → `db.blogCategory.create` → `revalidatePath('/', 'layout')`

## updateBlogCategory
- **Assinatura:** `(_: unknown, formData: FormData) => Promise<{ ok, data?, error? }>`
- **Zod:** igual ao create + `id` (uuid)
- **Fluxo:** auth → parse → `generateSlug(name)` → `db.blogCategory.update` → revalidate

## deleteBlogCategory
- **Assinatura:** `(id: string) => Promise<{ ok, error? }>`
- **Fluxo:** auth → `db.blogCategory.delete` → `revalidatePath('/', 'layout')`

## createBlogTag / updateBlogTag / deleteBlogTag
- Idênticos a Category em estrutura e fluxo

## toggleBlogEnabled
- **Assinatura:** `(projectId: string, companySlug: string, enabled: boolean) => Promise<{ ok, error? }>`
- **Fluxo:** auth → valida company → role → valida project → `db.project.update({ blogEnabled: enabled })` → `revalidatePath(/{companySlug}/dashboard)`
- **Nota:** opera em `Project.blogEnabled`, não em entidade do blog

## Copy-Paste Pattern
```typescript
// Server Action com FormData (post/category/tag)
const session = await auth()
if (!session?.user?.id) return { ok: false as const, error: 'Não autenticado' }
const parsed = schema.safeParse({ /* formData.get(...) */ })
if (!parsed.success) return { ok: false as const, error: 'Dados inválidos' }
// ... valida company e role ...
revalidatePath(`/${companySlug}/dashboard`)
return { ok: true as const, data: result }
```
