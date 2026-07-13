# 🛡️ Arquitetura de Auditoria do Janus

> Consulte este arquivo antes de implementar ou alterar qualquer fluxo de auditoria/reversão.
> Atualize o Changelog ao final de qualquer mudança.

## Visão Geral

Toda Server Action que muta dado crítico chama `logAudit()` de `src/lib/audit-logger.ts`. O log guarda snapshot completo (`oldData`/`newData`), identidade do ator resistente à exclusão do usuário, contexto de tenant e label legível. A tela `/dashboard-admin/logs` lista, filtra, exporta e reverte eventos.

## Model `AuditLog` (audit_logs)

| Campo | Tipo | Uso |
|---|---|---|
| `userId` | UUID? fk→users **SET NULL** | Ator. `null` para convidados (guests) ou usuário excluído |
| `userEmail` / `userName` | String? | Snapshot do ator no momento do evento (sobrevive à exclusão da conta) |
| `impersonatedId` / `impersonatedName` | String? | Preenchidos automaticamente se a ação ocorreu durante impersonação (cookie) |
| `companyId` / `projectId` | UUID? | Escopo de tenant — permitem "tudo que aconteceu na empresa X". Indexado |
| `action` | enum CREATE/UPDATE/DELETE/RESTORE | |
| `entity` | String PascalCase | Nome do model (`User`, `Company`, `SiteScript`, ...) ou pseudo-entidade (`Impersonation`, `BlockedIp`, `UserCompany`) |
| `entityId` | String | id do registro (ou composto `userId:companyId` para UserCompany) |
| `entityLabel` | String? | Nome legível (título do post, e-mail do usuário...) — mostrado na UI no lugar do UUID |
| `oldData` / `newData` | Json? | Snapshots já *scrubbed* |

Índices: `userId`, `companyId`, `[entity, entityId, createdAt]` (timeline por registro), `action`, `createdAt`.

## `logAudit()` — comportamento

1. **Nunca lança** (try/catch com console.error).
2. Resolve snapshot do ator: usa `userEmail`/`userName` passados, senão `db.user.findUnique` pelo `userId`. `userId: null` → ator anônimo/guest (passe `userName`/`userEmail` manualmente, ex.: `Convidado · Nome`).
3. Lê cookies de impersonação (`janus_impersonated_user_id/name`) automaticamente — call sites não precisam se preocupar.
4. **Scrub recursivo** de `oldData`/`newData`: remove chaves que casam `/password|secret|token|api[_-]?key|credential|authorization|private[_-]?key/i` em qualquer profundidade. `omitSensitive()` usa o mesmo scrub (mantido por compat).
5. **Não** roda prune. `pruneAuditLogs()` (retenção `AUDIT_RETENTION_DAYS = 60`) é chamado no load de `/dashboard-admin/logs/page.tsx`.

## Fluxo obrigatório em Server Actions

```
Validação Zod → Auth → (findUnique estado anterior p/ UPDATE/DELETE) → mutação Prisma
→ logAudit({ userId, action, entity, entityId, entityLabel, companyId?, projectId?, oldData, newData })
→ revalidatePath()
```

- Sempre passe `entityLabel` (nome/título/e-mail) e o escopo `companyId`/`projectId` quando existirem.
- Para DELETE em cascata (Company, GuestEntry) inclua contadores no snapshot (`deletedProjectsCount`, `affectedUsersCount`, `deletedPostsCount`) — são ignorados na reversão via `SNAPSHOT_ONLY_KEYS`.

## Cobertura atual (o que é auditado)

- **User**: adminCreateUser, adminEditUser, adminDeleteUser, createDeveloper, updateUserPermissions (label `Permissões · email`), changePassword (evento sem dados), updateProfile
- **UserCompany**: linkUserCompany / unlinkUserCompany
- **Company**: adminCreate/Edit/Delete (hard, com contadores), adminQuickCreateCompany, dev create/edit/delete (soft), toggleGuestMode, updateCompanyWebhook (token nunca logado — só flag `webhookTokenSet`)
- **Project**: createProject, updateProject, softDeleteProject, updateProjectGa4, toggleBlogEnabled, updateProjectBlogEnabled
- **Page**: createPage, updatePage, updatePageContent, updatePageContentData, updatePageSchema, updatePageSchemaContent, updatePageAdvancedData, updatePageMode, togglePagePublish
- **SiteScript**: create/update/delete/toggle
- **Blog**: create/update/delete de Post/Category/Tag (com entityLabel + projectId)
- **Guest**: registerGuest, createGuestPost, updateGuestPost, deleteGuestPost (ator = guest, `userId: null`), updateGuestAsAdmin, deleteGuestAsAdmin, updateGuestPostAsAdmin, deleteGuestPostAsAdmin
- **Impersonation** (pseudo-entidade): startImpersonation (CREATE), stopImpersonation / enterPrivilegedMode (DELETE)
- **BlockedIp** (pseudo-entidade): unblockIp (DELETE)
- **Login**: `LoginAttempt` registra falhas E sucessos (`success`, `userAgent`); bloqueio/IP conta só falhas; `unblockIp` apaga só falhas
- **NÃO auditado**: `src/modules/cms/actions/*` (código morto, sem imports), autosaveBlogPost (ruído), uploads, preferências de UI

## Reversão (`revertAuditAction.ts`)

- Apenas `UPDATE`/`DELETE`; ADMIN-only; UI exige confirmação via AlertDialog.
- `ENTITY_DELEGATES`: User, Company, Project, Page, BlogPost, BlogCategory, BlogTag, SiteScript, GuestEntry, GuestPost. **Registre aqui qualquer entidade nova auditada que deva ser reversível.**
- Registro existe → `update` com `oldData`; não existe → `create` mantendo id/createdAt.
- Cascatas NÃO são restauradas (avisado no dialog). Erros P2002/P2003/P2025/P2011/P2012 mapeados para mensagens amigáveis.
- Gera log `RESTORE` herdando label/escopo do log original.

## UI (`/dashboard-admin/logs`)

- Page: guarda `role === 'ADMIN'` + `pruneAuditLogs()`; queries paralelas.
- Lista **sem** `oldData`/`newData` (`getAuditLogs`, limite 1000 + `totalCount`); diff buscado sob demanda (`getAuditLogDiff` action) ao abrir o viewer.
- Stats cards: `getAuditStats` (hoje, exclusões 7d, inspeções 7d, ator mais ativo 7d).
- Filtros: ação, entidade (derivada dos dados), usuário (derivado), empresa (`getAuditCompanies`), área, período; busca inclui entityLabel/impersonatedName.
- Timeline por registro (botão Histórico filtra por entity+entityId); Exportar CSV (UTF-8 BOM, `;`).
- Viewer: modo Resumo (campos alterados) + JSON completo (Monaco DiffEditor).

## Changelog

### [2026-07-12] — Audit v2: cobertura total, contexto de tenant e UI reconstruída

**Arquivos**: `prisma/schema.prisma` + migration `20260712000000_audit_v2_context_and_login_success`; `src/lib/audit-logger.ts`; `src/lib/auth.ts`; ~35 actions instrumentadas/enriquecidas (companies, dev, permissões, impersonation, scripts, webhook, GA4, páginas CMS, guests, conta); `revertAuditAction.ts` (+delegates); queries `getAuditLogs`/`getAuditStats`/`getAuditCompanies` + action `getAuditLogDiff`; UI logs (page, AdminLogsClient, AuditLogsTable, AuditDiffViewer).

**Razão**: lacunas graves de monitoramento (Company/permissões/scripts/conteúdo CMS invisíveis), trilha destrutível (FK CASCADE), payload de MB na lista, Desfazer sem confirmação.

**Impacto**: ver seções acima — este arquivo descreve o estado pós-mudança.
