# Notifications — Patterns e Guia de Extensão

## Arquitetura atual (leia antes de mexer)

```
FONTE (GitHub Releases, paginado RELEASES_PER_PAGE=20, cache 1h, tag 'github-releases')
  └─ getSystemReleases(page) ──► NotificationsContent (Server async, dentro de <Suspense fallback=NotificationsSkeleton>)
  │                                └─► NotificationsFeed (Client): timeline por mês, busca, filtros
  │                                      Todas/Estáveis/Pré-releases, "Carregar mais" → GET /api/notifications/releases?page=N
  │                                      └─► ReleaseBody (Client, clamp 3 linhas + "Leia mais" animado)
  └─ getCurrentVersion() ──► layouts ──► Sidebar/AdminSidebar/DevSidebar (rodapé "Versão: vX.Y.Z")
  └─ countUnreadReleases(userId) ──► layouts ──► prop unreadNotifications (number) ──► badge numérico vermelho no sino
                                  └─ NotificationsContent ──► <MarkNotificationsSeen hasUnread> ──► markNotificationsSeen()
```

**Não-lido**: comparação de timestamps, SEM tabela própria. `preferences.notifications_last_seen_at`
(JSON no model `User`) vs `publishedAt` da release mais recente. Visitar qualquer página de
notificações dispara `markNotificationsSeen()` (via `MarkNotificationsSeen`, useEffect + router.refresh()).

**As 3 superfícies** (sempre alterar as três juntas):
| Contexto | Página | Sidebar | Layout que injeta props |
| :--- | :--- | :--- | :--- |
| Empresa | `src/app/[companySlug]/dashboard/notifications/page.tsx` | `Sidebar.tsx` | `[companySlug]/dashboard/layout.tsx` |
| Admin | `src/app/dashboard-admin/notifications/page.tsx` | `AdminSidebar.tsx` | `dashboard-admin/layout.tsx` |
| Dev | `src/app/dev/[devId]/dashboard/notifications/page.tsx` | `DevSidebar.tsx` | `dev/[devId]/dashboard/layout.tsx` |

## Como adicionar um NOVO TIPO de notificação (passo a passo)

Hoje o único tipo é "release do GitHub". Para adicionar outro (ex: avisos manuais, alertas de fatura):

1. **Domain** — crie a interface em `src/modules/notifications/domain/` (ex: `announcement.ts`).
   Se a UI for compartilhada, crie um union type `Notification = SystemRelease | Announcement`
   com campo discriminante `kind`.
2. **Fonte de dados**:
   - Externa (API): query com `fetch` + `next: { revalidate, tags: ['sua-tag'] }` seguindo `getReleases.ts`.
   - Interna (banco): crie model no Prisma + query com filtro `deletedAt: null`; mutações via
     Server Action com fluxo Zod → auth → Prisma → `logAudit()` → revalidate.
3. **UI** — adicione um tipo de card no `NotificationsFeed` (discrimine por `kind`). HTML externo SEMPRE
   passa por `sanitizeArticleHtml()`. Texto longo usa `ReleaseBody` (clamp de 3 linhas + "Leia mais"
   animado) — ele é agnóstico: recebe qualquer HTML. Novos dados entram via `NotificationsContent`
   (Server) para manter o Suspense/skeleton funcionando.
4. **Não-lido** — estenda `countUnreadReleases` (ou crie `countUnreadNotifications` agregadora) contando
   itens de TODAS as fontes com `createdAt/publishedAt` > `preferences.notifications_last_seen_at`.
   Os layouts já repassam o número (`unreadNotifications`); nada muda nas sidebars.
5. **Marcar como lido** — nada a fazer: `markNotificationsSeen()` grava o timestamp atual, que cobre
   qualquer fonte baseada em data. Só mude se precisar de leitura por-item (aí sim, model dedicado).
6. **Registre** — atualize `changelog.md` deste diretório e o `PROJECT.md`.

## Armadilhas conhecidas
- **Paginação é leitura → GET route handler** (`/api/notifications/releases`), NUNCA Server Action
  (CLAUDE.md: actions são exclusivas para mutações).
- **`scrollHeight` não conta margens externas** do conteúdo: o `max-height` expandido do `ReleaseBody`
  usa `contentHeight + 48` de buffer, senão o final do texto é cortado.
- **Next 16**: use `updateTag(tag)` em Server Actions (não `revalidateTag`, que agora exige profile).
- Cache de 1h: release publicada não aparece na hora — botão "Atualizar" (`RefreshReleasesButton`) resolve.
- `User.preferences` é JSON: sempre read-merge-write (nunca sobrescrever o objeto inteiro) e NÃO anotar
  o merge com `UserPreferences` ao passar para o Prisma (falta index signature; deixe inferir).
- Repo privado → `GITHUB_TOKEN` obrigatório no env.
