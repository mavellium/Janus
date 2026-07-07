# Audit — Server Actions & Registro

## logAudit (utilitário, `src/lib/audit-logger.ts`)
- **Assinatura:** `async (params: LogAuditParams) => Promise<void>`
- **Comportamento:** insere um `AuditLog`; **nunca lança** (try/catch → `console.error`); ao final chama `pruneAuditLogs()`
- **Serialização:** `JSON.parse(JSON.stringify(value))`; null/undefined → coluna NULL
- **omitSensitive(record):** remove `password` (e futuros segredos) antes de logar

## Retenção (60 dias)
- **`AUDIT_RETENTION_DAYS = 60`** + `auditRetentionCutoff()` em `audit-logger.ts`
- **`pruneAuditLogs()`** apaga logs com `createdAt < hoje-60d`; é chamado dentro de `logAudit` (limpeza oportunista a cada novo evento)
- **`getAuditLogs`** filtra `createdAt >= cutoff` → o painel mostra **só os últimos 60 dias**

## revertAuditAction(logId) — motor de Undo (`src/modules/admin/actions/`)
- **Assinatura:** `async (logId: string) => Promise<{ ok: boolean; error?: string }>`
- **Autorização:** `session.user.role === 'ADMIN'`
- **Habilitado:** apenas logs com action `UPDATE` ou `DELETE`
- **Fluxo:** 1. Auth → 2. busca log → 3. resolve delegate (`ENTITY_DELEGATES`) → 4. se o registro existe → `update(oldData)`; se não existe (hard delete) → `create(oldData)` → 5. gera log `RESTORE` → 6. `revalidatePath`
- **Coerção:** ignora `id`/`createdAt`/`updatedAt` no update; converte strings ISO → `Date`
- **Erros tratados:** P2002 (unique), P2003 (FK), P2025 (not found), P2011/P2012 (campo obrigatório) → mensagem amigável, sem quebrar o app
- **ENTITY_DELEGATES:** `{ User, Project, Page, BlogPost, BlogCategory, BlogTag }` (→ delegates do Prisma)

## Actions instrumentadas (chamam `logAudit`)
| Action | Entity | Action enum |
|--------|--------|-------------|
| `adminCreateUser` / `adminEditUser` / `adminDeleteUser` | User | CREATE / UPDATE / DELETE (hard) |
| `createProject` / `updateProject` / `softDeleteProject` | Project | CREATE / UPDATE / DELETE (soft) |
| `createPage` / `updatePage` | Page | CREATE / UPDATE |
| `createBlogPost` / `updateBlogPost` / `deleteBlogPost` | BlogPost | CREATE / UPDATE / DELETE (hard) |
| `createBlogCategory` / `updateBlogCategory` / `deleteBlogCategory` | BlogCategory | CREATE / UPDATE / DELETE |
| `createBlogTag` / `updateBlogTag` / `deleteBlogTag` | BlogTag | CREATE / UPDATE / DELETE |

> **Não auditados** (ruído / não-críticos): `autosaveBlogPost`, comentários e mídia do blog.

## Copy-Paste Pattern (real, de `updatePage.ts`)
```typescript
const updated = await db.page.update({ where: { id: pageId }, data })
await logAudit({
  userId: session.user.id,
  action: 'UPDATE',
  entity: 'Page',
  entityId: pageId,
  oldData: { ...page, project: undefined },
  newData: updated,
})
```
