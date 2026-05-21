# Blog — Histórico

**Instrução:** Atualize aqui cada vez que mexer neste módulo.

---

### [2026-05-21] — v3: BlogPostStatus, authorId FK, categories M:N, PostEditorClient e PostsListClient reescritos

**Arquivos:**
- `prisma/schema.prisma`: BlogPostStatus enum; BlogPost.status + publishedAt nullable + authorId FK; BlogPostCategory M:N (remove categoryId)
- `src/modules/blog/queries/getCompanyUsers.ts`: NOVO — lista usuários da empresa para select de autor
- `src/modules/blog/queries/getBlogPosts.ts`, `getBlogPost.ts`: includes atualizados (categories M:N, author); orderBy publishedAt asc nulls last
- `src/modules/blog/actions/createBlogPost.ts`, `updateBlogPost.ts`: status, authorId, categoryIds[]; publishedAt auto; categories full-replace
- 4 páginas new/edit posts (sites + LP): getCompanyUsers no Promise.all; companyUsers prop
- `src/components/blog/PostEditorClient.tsx`: REESCRITO — status toggle, select autor com avatar, cascade multi-select categorias
- `src/components/blog/PostsListClient.tsx`: REESCRITO — filtros rápidos, D&D colunas, modal bulk delete (autoFocus Cancel), lápis edit
- `src/app/api/[companySlug]/[projectId]/blog/route.ts`, `[postId]/route.ts`, `../blog/route.ts`: categories[] + status PUBLISHED filter

**Razão:** Reestruturação profunda do painel de artigos — modelo status DRAFT/PUBLISHED, autor vinculado ao User, categorias M:N com cascade seletor.

**Impacto:** API pública agora retorna `categories[]` em vez de `category`; artigos novos são DRAFT por padrão; publishedAt auto-preenchido ao publicar.

---

### [2026-05-20] — API pública + banner RBAC + documentação inicial

**Arquivos:**
- `src/app/api/[companySlug]/[projectId]/blog/route.ts`: criado — GET público com projectId no path, paginação e busca
- `src/components/blog/ApiEndpointBanner.tsx`: criado — banner client com cópia de URL
- `src/app/[companySlug]/dashboard/sites/[siteId]/blog/posts/page.tsx`: banner condicional ADMIN/DEV
- `src/app/[companySlug]/dashboard/landing-pages/[lpId]/blog/posts/page.tsx`: idem

**Razão:** Expor API pública por projeto; facilitar descoberta para Devs/Admins.

**Impacto:** URL canônica da API: `/api/{companySlug}/{projectId}/blog`. Rota genérica sem projectId removida.
