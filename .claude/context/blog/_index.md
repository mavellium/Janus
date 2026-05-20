# Blog — Sumário Executivo

Módulo de blog por projeto (Site ou Landing Page). Cada projeto tem um blog isolado com posts, categorias e tags hierárquicas.

## Responsabilidades

| Aspecto    | Responsável                                      |
|------------|--------------------------------------------------|
| Entidades  | BlogPost, BlogCategory, BlogTag, BlogPostTag     |
| Actions    | create/update/delete Post, Category, Tag; toggle |
| Queries    | getBlogPosts, getBlogPost, getCategories, getTags |
| API Pública | GET /api/[companySlug]/[projectId]/blog         |

## Arquivos

- [domain.md](domain.md) — entidades, campos, invariantes
- [actions.md](actions.md) — Server Actions (mutations)
- [queries.md](queries.md) — leitura direta via Prisma
- [patterns.md](patterns.md) — snippets copy-paste
- [changelog.md](changelog.md) — histórico

## App Routes

```
src/app/[companySlug]/dashboard/
  sites/[siteId]/blog/
    page.tsx                      — redirect para /posts
    posts/page.tsx                — listagem (banner API para ADMIN/DEV)
    posts/new/page.tsx
    posts/[postId]/edit/page.tsx
    categories/page.tsx
    tags/page.tsx
  landing-pages/[lpId]/blog/     — estrutura idêntica
src/app/api/[companySlug]/[projectId]/blog/route.ts  — endpoint público
src/components/blog/ApiEndpointBanner.tsx            — banner client
```

## Para usar este módulo, você deve saber

- [ ] Blog é por `projectId` — nunca query sem escopo
- [ ] Sem soft delete — deleção é permanente (hard delete)
- [ ] `publishedAt` é date de publicação/agendamento, não toggle
- [ ] Tags e categorias têm hierarquia (`parentId`)
- [ ] `project.blogEnabled` deve ser `true` para o blog estar ativo
- [ ] API pública filtra `publishedAt <= now()` e `blogEnabled=true`
