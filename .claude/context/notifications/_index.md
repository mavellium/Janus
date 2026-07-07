# Notifications — Sumário Executivo

Módulo read-only que expõe atualizações de versão do sistema a partir das Releases do GitHub (`mavellium/Janus`).

| Camada  | Conteúdo                                                                 |
| :------ | :----------------------------------------------------------------------- |
| Domain  | `SystemRelease` — release normalizada com HTML sanitizado                |
| Actions | `refreshReleases()` — expira cache | `markNotificationsSeen()` — marca lido |
| Queries | `getSystemReleases(page)`, `getCurrentVersion()`, `countUnreadReleases(userId)` |

- [domain.md](domain.md) · [actions.md](actions.md) · [queries.md](queries.md) · [patterns.md](patterns.md) · [changelog.md](changelog.md)

**➕ Para adicionar novos tipos de notificação: siga o passo a passo em [patterns.md](patterns.md).**

**Para usar este módulo, você deve saber:**
- Fonte de dados é a API pública do GitHub (sem banco/Prisma).
- Cache via Next Data Cache: `revalidate: 3600`, tag `github-releases` (invalidável com `revalidateTag`).
- `GITHUB_TOKEN` (env, opcional) autentica a chamada — necessário se o repositório for privado ou para elevar rate limit.
- Consumidores: páginas `/[companySlug]/dashboard/notifications`, `/dashboard-admin/notifications` e `/dev/[devId]/dashboard/notifications` (todas via `ReleaseList`), além do rodapé das sidebars `Sidebar`, `AdminSidebar` e `DevSidebar` (versão atual via layouts).
