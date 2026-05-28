# Backup — Histórico

**Instrução:** Atualize aqui cada vez que mexer neste módulo.

---

### [2026-05-25] — Implementação inicial

**Arquivos:**
- `src/scripts/backup.ts`: criado — núcleo runBackup + parseConnectionUrl
- `src/scripts/backup-daemon.ts`: criado — daemon com node-cron + rotação
- `src/scripts/restore.ts`: criado — CLI de restauração .sql/.dump
- `package.json`: adicionados scripts backup:daemon, backup:now, db:restore

**Razão:** Sistema de backup automatizado para proteção dos dados de produção do Janus CMS

**Impacto:** Nenhum impacto no Next.js ou nas rotas — scripts totalmente isolados

---

### [2026-05-28] — Resolução automática de binários PostgreSQL no Windows

**Arquivos:**
- `src/scripts/pg-bin.ts`: criado — resolve caminho de `pg_dump`/`psql`/`pg_restore` via `PGBIN` env ou varredura de `C:\Program Files\PostgreSQL\`
- `src/scripts/backup.ts`: usa `pgBin('pg_dump')` em vez de nome simples
- `src/scripts/restore.ts`: usa `pgBin('psql')` e `pgBin('pg_restore')`

**Razão:** No Windows o instalador do PostgreSQL não adiciona `bin/` ao PATH do sistema — `pg_dump` não era reconhecido

**Impacto:** Zero para Linux/macOS (fallback para nome simples). No Windows resolve automaticamente sem configuração manual
