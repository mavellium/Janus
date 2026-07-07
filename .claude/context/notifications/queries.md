# Notifications — Queries

Arquivo: `src/modules/notifications/queries/getReleases.ts` (server-only; sem Prisma)

## getSystemReleases(page = 1): Promise<SystemRelease[]>
- `GET https://api.github.com/repos/mavellium/Janus/releases?per_page=20&page={page}` (`RELEASES_PER_PAGE = 20` exportado)
- Paginação consumida pelo route handler `GET /api/notifications/releases?page=N` (auth por sessão; retorna `{ releases, hasMore }`)
- Headers: `Accept: application/vnd.github.html+json` (retorna `body_html`), `X-GitHub-Api-Version: 2022-11-28`, `Authorization: Bearer $GITHUB_TOKEN` se a env existir.
- Cache: `next: { revalidate: 3600, tags: ['github-releases'] }` — compartilhado entre layout e página (fetch idêntico é deduplicado pelo Next).
- Filtra drafts, sanitiza `body_html` com `sanitizeArticleHtml`, mapeia para `SystemRelease`.
- Falha (`!res.ok` ou exceção) → `[]`.

## countUnreadReleases(userId: string): Promise<number>
- Conta releases com `publishedAt` > `preferences.notifications_last_seen_at` do usuário (nunca leu → todas as publicadas).
- Sem releases → `0`. Usa o mesmo cache de `getSystemReleases()` + 1 `findUnique` no `User`.
- Consumida nos 3 layouts (prop `unreadNotifications` das sidebars → badge numérico vermelho no sino, cap "9+") e no `NotificationsContent` (gate do `MarkNotificationsSeen`).

## getCurrentVersion(): Promise<string | null>
- Reusa `getSystemReleases()` (mesmo cache; custo zero adicional após o primeiro fetch).
- Retorna `tagName` da primeira release estável (`!prerelease`); fallback: primeira release; sem releases → `null`.
- Consumida no `src/app/[companySlug]/dashboard/layout.tsx` e repassada à `Sidebar` como prop `currentVersion`.
