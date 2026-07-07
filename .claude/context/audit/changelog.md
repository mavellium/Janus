# Audit — Histórico

**Instrução:** Atualize aqui cada vez que mexer neste módulo.

### [2026-06-27] — Auditoria do Blog + retenção 60 dias + filtros no admin

**Arquivos:**
- Blog instrumentado: `createBlogPost`/`updateBlogPost`/`deleteBlogPost` (BlogPost), `create/update/deleteBlogCategory` (BlogCategory), `create/update/deleteBlogTag` (BlogTag) → `logAudit`
- `src/modules/admin/actions/revertAuditAction.ts`: `ENTITY_DELEGATES` += BlogPost/BlogCategory/BlogTag (reversível)
- `src/lib/audit-logger.ts`: `AUDIT_RETENTION_DAYS=60`, `auditRetentionCutoff()`, `pruneAuditLogs()` (chamado em `logAudit`)
- `src/modules/admin/queries/getAuditLogs.ts`: filtra `createdAt >= cutoff` (60d); limit 500
- `src/app/dashboard-admin/logs/AuditLogsTable.tsx`: filtros Entidade (com blog), Área (admin/cms/blog) e Período (24h/7d/30d/60d)

**Razão:** Blog não estava sendo auditado; logs precisam expirar (60d) e o painel precisa de filtros mais precisos.

**Impacto:** Mutações de artigo/categoria/tag agora geram log (e são reversíveis). Logs > 60 dias são apagados automaticamente na próxima escrita de auditoria e nunca aparecem no painel.

### [2026-06-27] — Documentação inicial

**Arquivos:**
- `src/lib/audit-logger.ts`: `logAudit` + `omitSensitive`
- `src/modules/admin/queries/getAuditLogs.ts`: leitura de logs
- `src/modules/admin/actions/revertAuditAction.ts`: motor de Undo
- `prisma/schema.prisma`: model `AuditLog` + enum `AuditAction`

**Razão:** Economizar tokens em futuras sessões.

**Impacto:** Consumidores leem este módulo (1 min) em vez do código-fonte inteiro.
