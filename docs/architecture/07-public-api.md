# 07 — API (Route Handlers)

Os endpoints ficam em [src/app/api/](../../src/app/api/). Como o `matcher` do
middleware **exclui `/api`** (ver [02-request-lifecycle.md](02-request-lifecycle.md)),
cada handler é responsável pela própria autorização. Há três naturezas:

1. **Públicos headless** (CORS `*`, rate-limit, cache) — consumidos pelos sites
   gerados.
2. **Internos do builder/sites** (sem CORS, usados pelo próprio app/scripts).
3. **Autenticados** (exigem sessão NextAuth).

## Convenções dos endpoints públicos

- **Rate-limit por IP** em memória (`rateLimit(key, limit, windowMs)` de
  [src/lib/rate-limit.ts](../../src/lib/rate-limit.ts)); excedente → `429` com
  headers `X-RateLimit-*` e `Retry-After`.
- **CORS**: `Access-Control-Allow-Origin: *`, métodos `GET, OPTIONS`, com handler
  `OPTIONS` retornando `204`.
- **Cache HTTP**: `Cache-Control: public, max-age=60, s-maxage=60`.
- **Resolução de tenant** por `companySlug` (`deletedAt: null`); inexistente →
  `404`.
- Filtro de publicação: `status = 'PUBLISHED'` e `publishedAt <= now()`, com o
  projeto exigido `blogEnabled: true, isActive: true, deletedAt: null`.

## Endpoints públicos — Blog headless

Base: `/api/{companySlug}/{projectId}/blog`

| Método/Rota | Descrição | Parâmetros | Fonte |
|---|---|---|---|
| `GET /api/{companySlug}/{projectId}/blog` | Lista posts publicados (paginado) | `page` (≥1), `limit` (1–50, default 10), `search`, `categoryId` | [route.ts](../../src/app/api/[companySlug]/[projectId]/blog/route.ts) |
| `GET /api/{companySlug}/{projectId}/blog/{postId}` | Post único por **UUID ou slug** | `postId` (UUID via regex, senão slug) | [route.ts](../../src/app/api/[companySlug]/[projectId]/blog/[postId]/route.ts) |
| `GET /api/{companySlug}/{projectId}/blog/categories` | Categorias do projeto | — | [route.ts](../../src/app/api/[companySlug]/[projectId]/blog/categories/route.ts) |
| `GET /api/{companySlug}/{projectId}/blog/tags` | Tags do projeto | — | [route.ts](../../src/app/api/[companySlug]/[projectId]/blog/tags/route.ts) |

Rate-limit do blog: **60 req/min por IP** (chave `blog:{ip}`).

Resposta da listagem (resumo):

```jsonc
{
  "success": true,
  "company": "acme",
  "projectId": "…",
  "posts": [ { "id": "…", "slug": "…", "title": "…", "categories": [...], "tags": [...] } ],
  "meta": { "total": 42, "page": 1, "limit": 10, "totalPages": 5 }
}
```

O detalhe (`/{postId}`) resolve UUID vs slug por regex
(`UUID_RE.test(postId) ? { id } : { slug }`) e retorna `{ success, company,
projectId, post }`. **Este endpoint não aplica rate-limit** (os de listagem e de
conteúdo aplicam).

### Endpoint de blog legado (apenas `companySlug`)

| Método/Rota | Observação |
|---|---|
| `GET /api/{companySlug}/blog` | Lista posts publicados de **todos os projetos** da empresa (não recebe `projectId`); inclui `body` completo na listagem e normaliza `slug` para o `id` |

Fonte: [src/app/api/[companySlug]/blog/route.ts](../../src/app/api/[companySlug]/blog/route.ts).

> ⚠️ A confirmar: este endpoint coexiste com a versão escopada por `projectId` e
> tem comportamento divergente (sem escopo de projeto, payload mais pesado).
> Possível rota legada. Registrado em [99-tech-debt.md](99-tech-debt.md).

## Endpoint público — Conteúdo de página (v1)

| Método/Rota | Descrição |
|---|---|
| `GET /api/v1/content/{companySlug}/{pageSlug}` | Retorna o conteúdo de uma página **publicada** |

- Rate-limit: **60 req/min** (chave `content:{ip}`), CORS `*`, cache 60s.
- Busca por `slug` + `isPublished: true` + `deletedAt: null`, com projeto ativo.
- O payload depende do modo da página:
  - `isAdvanced: true` → `{ slug, name, updatedAt, schema }` (de `schemaData`).
  - `isAdvanced: false` → `{ slug, name, updatedAt, content }` (de `contentData`).

Fonte:
[src/app/api/v1/content/[companySlug]/[pageSlug]/route.ts](../../src/app/api/v1/content/[companySlug]/[pageSlug]/route.ts).

## Endpoints internos / do site

| Método/Rota | Auth | Descrição |
|---|---|---|
| `GET /api/sites/{siteId}/scripts` | rate-limit 120/min | Scripts ativos do projeto (`HEAD`/`BODY_END`); cache `s-maxage=60, stale-while-revalidate=300`; `export const revalidate = 60` |
| `GET /api/projects/{projectId}/check-script` | — | Verifica injeção do script de sincronização do CMS |
| `POST /api/projects/{projectId}/generate-script` | — | Gera o script de sincronização do CMS |
| `GET /api/projects/{projectId}/blog-enabled` | — | Indica se o blog está habilitado no projeto |
| `GET /api/dev/companies/{companyId}/projects` | — | Lista projetos de uma empresa (painel DEVELOPER) |

Fontes em [src/app/api/](../../src/app/api/). (Os contratos de `check-script` e
`generate-script` não foram detalhados neste documento.)

> ⚠️ A confirmar: o nível de autorização de `check-script`, `generate-script`,
> `blog-enabled` e `dev/.../projects` não foi auditado linha a linha aqui.

## Endpoints autenticados (sessão NextAuth)

| Método/Rota | Descrição | Fonte |
|---|---|---|
| `GET /api/analytics?propertyId=` | Relatório GA4 completo (`getFullAnalyticsReport`); 401 sem sessão, 400 sem `propertyId`, 502 em erro do GA4 | [route.ts](../../src/app/api/analytics/route.ts) |
| `POST /api/upload` | Upload de imagem/vídeo para o BunnyCDN; aceita sessão **ou** cookie `guest_entry_id` válido | [route.ts](../../src/app/api/upload/route.ts) |
| `GET /api/v1/admin/guests` | Lista de guests (admin) | [route.ts](../../src/app/api/v1/admin/guests/route.ts) |
| `POST /api/guest/signout` | Logout de convidado | [route.ts](../../src/app/api/guest/signout/route.ts) |
| `GET/POST /api/auth/[...nextauth]` | Handlers do NextAuth | [route.ts](../../src/app/api/auth/[...nextauth]/route.ts) |

Detalhes de `upload` (limites de tipo/tamanho, BunnyCDN) e `analytics` (GA4) em
[08-integrations-and-jobs.md](08-integrations-and-jobs.md).
