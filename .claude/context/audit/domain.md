# Audit — Entidades e Domínio

## Entidade: AuditLog (Prisma model, tabela `audit_logs`)
- **Tipo:** Prisma model
- **Campos:** id (UUID), userId (UUID, fk→User CASCADE), action (`AuditAction`), entity (string, PascalCase do model), entityId (string), oldData (Json?), newData (Json?), createdAt (timestamp)
- **Índices:** userId, entity, entityId, action, createdAt
- **Invariantes:**
  - `entity` espelha o nome do model Prisma (PascalCase) — é a chave do mapa de reversão
  - `oldData`/`newData` guardam apenas campos **escalares** (sem relações), serializados via JSON; datas viram strings ISO
  - segredos (`password`) são removidos antes de persistir
  - append-only: AuditLog **não** tem soft delete

## Enum: AuditAction (`audit_action`)
- `CREATE` — criação de registro (apenas `newData`)
- `UPDATE` — edição (`oldData` → `newData`)
- `DELETE` — exclusão hard ou soft (`oldData` preenchido)
- `RESTORE` — gerado por `revertAuditAction` ao desfazer

## Interfaces / Types (`src/lib/audit-logger.ts`)
- `AuditActionType` = `'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE'`
- `LogAuditParams` — `{ userId, action, entity, entityId, oldData?, newData? }`
- `AuditLogWithUser` (`getAuditLogs.ts`) — AuditLog + `user { id, name, email }`
- `AuditLogRow` (`AuditLogsTable.tsx`) — shape serializável consumido pelo client
