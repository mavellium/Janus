# Notifications — Changelog

### [2026-07-06] — Timeline, busca/filtros, paginação, skeleton, contador no sino + fix "Leia mais"

**Arquivos**:
- `NotificationsFeed.tsx` (novo, substitui `ReleaseList.tsx` deletado): timeline agrupada por mês/ano (linha + dots), busca por texto (tag/nome/corpo sem HTML), filtros Todas/Estáveis/Pré-releases, "Carregar mais" via fetch GET
- `NotificationsContent.tsx` (novo): Server async, `Promise.all(releases, countUnread)`, renderiza MarkNotificationsSeen + Feed
- `NotificationsSkeleton.tsx` (novo): fallback do `<Suspense>` nas 3 páginas
- `src/app/api/notifications/releases/route.ts` (novo): GET paginado autenticado (leitura ≠ Server Action)
- `getReleases.ts`: `getSystemReleases(page)`, `RELEASES_PER_PAGE=20`, `countUnreadReleases` substitui `hasUnreadReleases`
- 3 sidebars/layouts: prop `unreadNotifications` (number) → badge com contagem (cap 9+)
- `ReleaseBody.tsx`: **FIX** conteúdo cortado ao expandir — `scrollHeight` não conta margens externas; `maxHeight = contentHeight + 48`

**Razão**: Pedido do usuário (itens 2, 3, 4, 5, 7 das sugestões) + bug do "Leia mais".

**Impacto**: Página 1 vem por Suspense (skeleton no cache frio); páginas seguintes por route handler com o mesmo Data Cache/tag.

### [2026-07-06] — Largura total + animações

**Arquivos**:
- 3 páginas de notificações: removido `max-w-4xl` (ocupam 100% da largura)
- `ReleaseBody.tsx`: expansão animada (`transition: max-height` com altura medida via ResizeObserver), chevron rotaciona 180°, gradiente com fade-out
- `ReleaseList.tsx`: cards com entrada escalonada (classe `release-card-in`, delay `index * 80ms`, cap 8) + hover shadow/borda
- `globals.css`: keyframe `releaseCardIn` + classe `.release-card-in`

**Razão**: Feedback do usuário — página não usava a largura toda e o expand/collapse era seco.

**Impacto**: Puramente visual; nenhuma mudança de dados ou API.

### [2026-07-06] — Leia mais (clamp 3 linhas) + lido/não-lido com badge no sino

**Arquivos**:
- `src/components/notifications/ReleaseBody.tsx`: Client; corpo clampado em 72px (~3 linhas) com fade + botão "Leia mais"/"Mostrar menos" (só aparece se houver overflow)
- `src/components/notifications/MarkNotificationsSeen.tsx`: Client invisível; se `hasUnread`, dispara `markNotificationsSeen()` + `router.refresh()` no mount
- `src/modules/notifications/actions/markNotificationsSeen.ts`: grava `preferences.notifications_last_seen_at`
- `getReleases.ts`: nova query `hasUnreadReleases(userId)`
- `src/types/next-auth.d.ts`: `UserPreferences.notifications_last_seen_at?: string`
- 3 sidebars: prop `hasUnreadNotifications` → bolinha `bg-red-500` no sino; 3 layouts: injetam a prop; 3 páginas: `<MarkNotificationsSeen>`

**Razão**: Descrições longas dominavam a página; usuário precisava de indicador visual de novidades não lidas.

**Impacto**: Sino mostra bolinha vermelha até o usuário abrir a página de notificações; timestamp em `User.preferences` (JSON), sem migration. Guia de extensão para novos tipos de notificação criado em `patterns.md`.

### [2026-07-06] — Botão de refresh do cache

**Arquivos**:
- `src/modules/notifications/actions/refreshReleases.ts`: action que expira o cache (`updateTag`)
- `src/components/notifications/RefreshReleasesButton.tsx`: botão Client com `useActionState`
- 3 páginas de notificações: botão adicionado no header

**Razão**: Release publicada no GitHub não aparecia — o Data Cache (TTL 1h) tinha guardado a resposta vazia consultada antes da publicação.

**Impacto**: Usuário força refetch imediato; sem o clique, o comportamento continua o mesmo (cache 1h). `updateTag` (não `revalidateTag`) por causa da assinatura nova do Next 16.

### [2026-07-06] — Notificações nos painéis Admin e Dev

**Arquivos**:
- `src/components/notifications/ReleaseList.tsx`: UI de releases extraída (Server, compartilhada pelas 3 páginas)
- `src/app/dashboard-admin/notifications/page.tsx` e `src/app/dev/[devId]/dashboard/notifications/page.tsx`: novas páginas
- `AdminSidebar.tsx` / `DevSidebar.tsx`: item "Notificações" no nav + versão no rodapé (prop `currentVersion`)
- `dashboard-admin/layout.tsx` / `dev/[devId]/dashboard/layout.tsx`: buscam `getCurrentVersion()` e repassam

**Razão**: Paridade de notificações de versão nos painéis Admin e Dev.

**Impacto**: Mesmo fetch cacheado (`github-releases`, 1h) alimenta os 3 contextos; nenhum custo adicional de rede.

### [2026-07-06] — Criação do módulo

**Arquivos**:
- `src/modules/notifications/domain/release.ts`: interface `SystemRelease`
- `src/modules/notifications/queries/getReleases.ts`: `getSystemReleases()` + `getCurrentVersion()`
- `src/app/[companySlug]/dashboard/notifications/page.tsx`: página de notificações (Server Component)
- `src/components/dashboard/Sidebar.tsx`: sino → link para notificações; rodapé com `Versão: {tag}`
- `src/app/[companySlug]/dashboard/layout.tsx`: busca `getCurrentVersion()` e passa às duas instâncias da Sidebar

**Razão**: Exibir atualizações de versão do sistema (Releases do GitHub) dentro do dashboard.

**Impacto**: Novo item funcional na Sidebar; requisição ao GitHub cacheada por 1h no servidor (não bloqueia renderização após o primeiro hit; deduplicada entre layout e página).
