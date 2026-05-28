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

---

### [2026-05-28] — Suporte a Docker (resolver mismatch de versão)

**Arquivos:**
- `src/scripts/pg-bin.ts`: reescrito — detecta container Docker pela porta mapeada; exports: `resolvePgContext`, `buildPgCommand`
- `src/scripts/backup.ts`: modo docker captura stdout do `pg_dump` e salva localmente
- `src/scripts/restore.ts`: modo docker copia arquivo via `docker cp`, executa no container, remove depois

**Razão:** `pg_dump` local versão 17 não consegue fazer dump de servidor PostgreSQL 18 rodando em container Docker

**Impacto:** Container Docker é automaticamente preferido quando a porta do `DATABASE_URL` está mapeada em algum container em execução
