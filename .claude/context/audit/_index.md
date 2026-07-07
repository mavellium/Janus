# Audit — Sumário Executivo

Motor de **Audit Logs** (auditoria de eventos) com **reversão (Undo)**. Registra mutações críticas de dados (`oldData`/`newData`) e permite desfazer edições/exclusões pelo painel admin. Núcleo em `src/lib/audit-logger.ts`; query/action em `src/modules/admin/`; UI em `src/app/dashboard-admin/logs/`.

## Responsabilidades

| Aspecto | Responsável |
|---------|-------------|
| Registro | `logAudit()`, `omitSensitive()` — `src/lib/audit-logger.ts` |
| Domínio | model `AuditLog`, enum `AuditAction` — `prisma/schema.prisma` |
| Reversão | `revertAuditAction(logId)` — `src/modules/admin/actions/` |
| Leitura | `getAuditLogs(limit)` — `src/modules/admin/queries/` |
| UI | `AuditLogsTable`, `AuditDiffViewer` (Monaco) — aba em `/dashboard-admin/logs` |

## Arquivos
- [domain.md](domain.md) — AuditLog, AuditAction, tipos
- [actions.md](actions.md) — logAudit, revertAuditAction, actions instrumentadas
- [queries.md](queries.md) — getAuditLogs
- [patterns.md](patterns.md) — instrumentar nova action / torná-la reversível
- [changelog.md](changelog.md) — histórico
- Guia detalhado (arquitetura): `.claude/janus_audit_architecture.md`

## Para usar este módulo, você deve saber
- [ ] `entity` = nome do model Prisma em PascalCase (`User`, `Project`, `Page`, `BlogPost`, `BlogCategory`, `BlogTag`)
- [ ] Reversível só para UPDATE/DELETE; registrar entidade em `ENTITY_DELEGATES`
- [ ] `logAudit` **nunca lança** (falha vai só para o console)
- [ ] Use `omitSensitive()` para remover `password` de `oldData`/`newData`
- [ ] `RESTORE` é gerado automaticamente ao clicar em Desfazer
- [ ] **Retenção 60 dias:** `pruneAuditLogs()` (chamado em `logAudit`) apaga > 60d; `getAuditLogs` só mostra ≤ 60d
- [ ] Painel admin (`AuditLogsTable`) tem filtros: Ação, Entidade, Área (admin/cms/blog) e Período
