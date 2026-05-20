# Blog — Queries

Todas as queries são `async` e recebem `projectId: string`. Sem paginação interna — feita na camada de API quando necessário.

## getBlogPosts
- **Retorna:** `BlogPost[]` com `category { id, name }` e `tags[].tag { id, name }`
- **Filtro:** `{ projectId }` — sem filtro de data (retorna todos, incluindo futuros)
- **Ordenação:** `publishedAt desc`
- **Uso:** listagem interna no dashboard

## getBlogPost
- **Retorna:** `BlogPost | null` com `category { id, name }` e `tags[].tag { id, name }`
- **Filtro:** `{ id }` — busca por ID único
- **Uso:** página de edição

## getBlogCategories
- **Retorna:** `BlogCategory[]` com `parent { id, name }` e `children[] { id, name }`
- **Filtro:** `{ projectId }`
- **Ordenação:** `name asc`
- **Uso:** select de categoria no formulário de post; gerenciamento de categorias

## getBlogTags
- **Retorna:** `BlogTag[]` com `parent { id, name }` e `children[] { id, name }`
- **Filtro:** `{ projectId }`
- **Ordenação:** `name asc`
- **Uso:** multi-select de tags no formulário de post; gerenciamento de tags

## API Pública (não é query Prisma direta)
- **Rota:** `GET /api/[companySlug]/[projectId]/blog`
- **Filtros extras:** `publishedAt <= now()`, `project.blogEnabled=true`, `isActive=true`, `deletedAt=null`
- **Params:** `?page`, `?limit` (máx 50), `?search` (title/subtitle, case-insensitive)
- **Arquivo:** `src/app/api/[companySlug]/[projectId]/blog/route.ts`
