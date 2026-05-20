# Janus — Blog Architecture

## 1. Prisma Schema

```prisma
model BlogPost {
  id             String        @id @default(uuid()) @db.Uuid
  title          String
  subtitle       String?
  publishedAt    DateTime      @map("published_at")   // required; future = scheduled
  body           String        @db.Text
  coverImageUrl  String?       @map("cover_image_url")
  authorName     String        @map("author_name")
  seoTitle       String?       @map("seo_title")
  seoDescription String?       @map("seo_description")
  seoKeywords    String?       @map("seo_keywords")
  projectId      String        @db.Uuid @map("project_id")
  project        Project       @relation(...)
  categoryId     String?       @db.Uuid @map("category_id")
  category       BlogCategory? @relation(...)
  tags           BlogPostTag[]
  createdAt      DateTime
  updatedAt      DateTime
  @@map("blog_posts")
}

model BlogCategory {
  id        String     @id @default(uuid()) @db.Uuid
  name      String
  projectId String     @db.Uuid
  posts     BlogPost[]
  @@map("blog_categories")
}

model BlogTag {
  id        String        @id @default(uuid()) @db.Uuid
  name      String
  projectId String        @db.Uuid
  posts     BlogPostTag[]
  @@map("blog_tags")
}

model BlogPostTag {
  postId String   @db.Uuid
  tagId  String   @db.Uuid
  post   BlogPost
  tag    BlogTag
  @@id([postId, tagId])
  @@map("blog_post_tags")
}
```

**Key rules:**
- `publishedAt` is always set; use `lte: new Date()` to filter "published" posts in public contexts.
- No `deletedAt` on BlogPost — hard delete only. No soft-delete filter needed.
- Blog is scoped to a `projectId` (a Site or Landing Page). One project = one blog.
- `project.blogEnabled` must be `true` for the blog to be active for a given project.

## 2. Module Structure

```
src/modules/blog/
  actions/
    createBlogCategory.ts
    createBlogPost.ts
    createBlogTag.ts
    deleteBlogCategory.ts
    deleteBlogPost.ts
    deleteBlogTag.ts
    toggleBlogEnabled.ts
    updateBlogCategory.ts
    updateBlogPost.ts
    updateBlogTag.ts
  queries/
    getBlogCategories.ts
    getBlogPost.ts      — findUnique by id, includes category + tags
    getBlogPosts.ts     — findMany by projectId, ordered by publishedAt desc
    getBlogTags.ts
```

All actions follow the project standard: `'use server'` → Zod validation → auth check → Prisma → `revalidatePath()`.

Return shape: `{ ok: true, data }` or `{ ok: false, error, code? }`.

## 3. App Routes

```
src/app/[companySlug]/dashboard/
  sites/[siteId]/blog/
    page.tsx                        — blog overview / toggle enabled
    posts/page.tsx                  — posts listing (+ API banner for ADMIN/DEV)
    posts/new/page.tsx              — new post form
    posts/[postId]/edit/page.tsx    — edit post form
    categories/page.tsx             — categories management
    tags/page.tsx                   — tags management
  landing-pages/[lpId]/blog/       — identical structure
```

## 4. Post Creation / Edit Flow

1. User fills form in `new/page.tsx` or `[postId]/edit/page.tsx`.
2. Cover image upload: `POST /api/upload` → returns `{ url }` → stored in `coverImageUrl`.
3. On submit: `createBlogPost` / `updateBlogPost` Server Action is called.
4. Action validates with Zod, checks session, writes to Prisma, calls `revalidatePath()`.
5. On success: redirects to posts listing.

## 5. Public API Endpoint

**Route**: `GET /api/[companySlug]/blog`

**Auth**: None — fully public, CORS open.

**Query params**:
| Param    | Default | Notes                        |
|----------|---------|------------------------------|
| `page`   | `1`     | 1-based pagination           |
| `limit`  | `10`    | capped at 50                 |
| `search` | —       | filters `title` + `subtitle` |

**Filters applied**:
- `publishedAt <= now()` (no future/scheduled posts)
- `project.blogEnabled = true`
- `project.isActive = true`
- `project.deletedAt = null`
- `company.slug = companySlug`
- `company.deletedAt = null`

**Response shape**:
```json
{
  "success": true,
  "company": "acme",
  "posts": [
    {
      "id": "uuid",
      "title": "Post title",
      "subtitle": "...",
      "publishedAt": "2025-01-01T00:00:00.000Z",
      "authorName": "Jane",
      "coverImageUrl": "https://...",
      "seoTitle": null,
      "seoDescription": null,
      "seoKeywords": null,
      "category": { "id": "uuid", "name": "Tech" },
      "tags": [{ "tag": { "id": "uuid", "name": "Next.js" } }],
      "project": { "id": "uuid", "name": "Main Site" }
    }
  ],
  "meta": { "total": 42, "page": 1, "limit": 10, "totalPages": 5 }
}
```

**Cache**: `Cache-Control: public, max-age=60, s-maxage=60`

**File**: `src/app/api/[companySlug]/blog/route.ts`

## 6. API Banner (RBAC)

Component: `src/components/blog/ApiEndpointBanner.tsx` (`'use client'`)

Rendered on blog posts listing pages (sites + landing-pages). Visibility rules:

```typescript
const viewMode = await getViewMode()
const isDeveloperOrAdmin = isPrivilegedRole(session.user.role)
const showApiBanner = isDeveloperOrAdmin && viewMode !== VIEW_MODE_USER
```

- `ADMIN`: always visible.
- `DEVELOPER`: visible unless simulating `VIEW_MODE_USER`.
- `DEFAULT`: never visible.

The banner shows the full URL (`https://host/api/{companySlug}/blog`) with a clipboard copy button.

## 7. Absolute Rules for Blog Work

- **SSR only**: all listing and edit pages are Server Components. No `useState` for data fetching.
- **No hacks**: never use localStorage, sessionStorage, or client cookies for structural control.
- **No soft-delete filter** on BlogPost (no `deletedAt` field exists on the model).
- **`publishedAt` semantics**: it is a schedule date, not a toggle. Filter `lte: new Date()` in public contexts.
- **Blog is per-project**: never query blog posts without a `projectId` or `companyId` scope.
- **Tailwind variables only**: no hardcoded hex colors. Use `bg-muted`, `text-muted-foreground`, `border-border`, etc.

## 8. Changelog

### [2026-05-19] — API pública + banner RBAC

**Arquivos**:
- `src/app/api/[companySlug]/blog/route.ts`: criado — endpoint GET público com paginação e busca
- `src/components/blog/ApiEndpointBanner.tsx`: criado — banner client com botão de cópia
- `src/app/[companySlug]/dashboard/sites/[siteId]/blog/posts/page.tsx`: atualizado — renderiza banner condicional para ADMIN/DEV
- `src/app/[companySlug]/dashboard/landing-pages/[lpId]/blog/posts/page.tsx`: atualizado — idem

**Razão**: Expor API pública do Blog para consumo por clientes externos; facilitar descoberta por Devs/Admins sem expor para usuários comuns.

**Impacto**: Posts com `publishedAt <= now()` de projetos com `blogEnabled=true` ficam disponíveis publicamente via GET. Banner desaparece automaticamente quando Dev simula visão de usuário.
