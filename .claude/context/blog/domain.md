# Blog — Entidades e Domínio

## BlogPost
- **Tabela:** `blog_posts`
- **Campos:** `id` (UUID), `title`, `subtitle?`, `publishedAt` (DateTime, obrigatório), `body` (Text), `coverImageUrl?`, `authorName`, `seoTitle?`, `seoDescription?`, `seoKeywords?`, `projectId`, `categoryId?`, `createdAt`, `updatedAt`
- **Relações:** `project` (Project), `category?` (BlogCategory), `tags` (BlogPostTag[])
- **Invariantes:**
  - Sem `deletedAt` — hard delete apenas
  - `publishedAt` sempre preenchido; valor futuro = agendado
  - Tags gerenciadas via `BlogPostTag` (tabela de junção)

## BlogCategory
- **Tabela:** `blog_categories`
- **Campos:** `id`, `name`, `slug` (gerado via `generateSlug`), `description?`, `imageUrl?`, `parentId?`, `seoTitle?`, `seoDescription?`, `seoKeywords?`, `projectId`
- **Relações:** `parent?` (BlogCategory), `children` (BlogCategory[]), `posts` (BlogPost[])
- **Invariantes:** Hierarquia via `parentId`; sem soft delete

## BlogTag
- **Tabela:** `blog_tags`
- **Campos:** `id`, `name`, `slug` (gerado via `generateSlug`), `description?`, `imageUrl?`, `parentId?`, `seoTitle?`, `seoDescription?`, `seoKeywords?`, `projectId`
- **Relações:** `parent?` (BlogTag), `children` (BlogTag[]), `posts` (BlogPostTag[])
- **Invariantes:** Mesma estrutura que BlogCategory; sem soft delete

## BlogPostTag (junção)
- **Tabela:** `blog_post_tags`
- **PK composta:** `[postId, tagId]`
- **Não tem campos extras** — apenas as FKs

## Regras Absolutas

- SSR obrigatório — páginas de listagem e edição são Server Components
- Sem hacks — nunca usar localStorage ou cookies para controle estrutural
- **Sem soft-delete filter** — BlogPost/Category/Tag não têm `deletedAt`
- **`publishedAt` é schedule** — filtrar `lte: new Date()` em contextos públicos
- **Escopo obrigatório** — nunca query sem `projectId` ou `companyId`
- **Tags full-replace** — no update: `deleteMany: {}` + `create: []`
- **Tailwind variables** — sem hex hardcoded (`bg-muted`, `text-muted-foreground`)
- **Banner RBAC** — `isPrivilegedRole(session.user.role)` (ADMIN/DEV); independe de viewMode

## Erros Comuns
- `Empresa não encontrada` — slug inválido ou deletado
- `Acesso negado` — role não é ADMIN e companySlug não bate
- `Projeto não encontrado` — projectId não pertence à empresa
- `Dados inválidos` — falha no Zod (campo obrigatório ausente ou UUID inválido)
