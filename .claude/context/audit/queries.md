# Audit — Queries

## getAuditLogs(limit = 200)
- **Retorna:** `AuditLogWithUser[]`
- **Ordenação:** `createdAt desc`
- **Select/Include:** `user { id, name, email }` (sem campos sensíveis)
- **Paginação:** `take: limit` (default 200)
- **Filtro soft delete:** N/A — AuditLog é append-only (sem `deletedAt`)
- **Uso:** `const logs = await getAuditLogs(200)`

> Os filtros (ação / entidade) e a busca (usuário / entidade / ID) são aplicados
> no **client** via `AdminDataTable` em `AuditLogsTable.tsx`, não na query.
