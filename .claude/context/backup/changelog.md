# Backup — Histórico

**Instrução:** Atualize aqui cada vez que mexer neste módulo.

---

### [2026-06-02] — Política de retenção: daily 3, sem weekly

**Arquivos:**
- `src/scripts/backup.ts`: `BackupType` removido `'weekly'` (agora `manual | daily | monthly`)
- `src/scripts/backup-daemon.ts`: `RETENTION.daily` 7→3, removido `weekly`; cron semanal (`0 3 * * 0`) removido — restam daily 02:00 e monthly dia 1 04:00

**Razão:** Pedido do usuário — manter 3 backups diários rotativos (mais novo sobrescreve o mais antigo) + 3 mensais; semanal desnecessário.

**Impacto:** `cleanOldBackups('daily')` mantém os 3 mais recentes por mtime, apaga o resto. Arquivos `janus-weekly-*` antigos não são mais gerados nem rotacionados (apagar manualmente se existirem).

---

### [2026-06-02] — Fix: pg_dump via spawn argv (Windows + quoting)

**Arquivos:**
- `src/scripts/backup.ts`: `spawn(cmd, {shell:true})` + `sh -c '...'` (aspas simples, quebra no cmd.exe do Windows) substituído por `spawn(command, args[])` sem shell; nice/ionice preservados via `sh -c '... "$@"'` como arg único do `docker`.

**Razão:** `pnpm backup:now` no Windows falhava com "não pode encontrar o caminho" — cmd.exe não entende aspas simples.

**Impacto:** Backup funciona em Windows e Linux. Verificado: `.sql.gz` íntegro (magic 1f 8b).

---

### [2026-05-31] — Otimização de CPU/RAM (streaming + gzip -1 + nice/ionice)

**Arquivos:**
- `src/scripts/backup.ts`: `runBackup` reescrito — `execAsync`(buffer 512MB) + `writeFileSync` substituídos por pipeline em streaming `pg_dump (stdout) → createGzip({level:1}) → createWriteStream`. `pg_dump` em modo docker agora roda com `nice -n 19` e `ionice -c3` (guard `command -v ionice`). Arquivo gerado passa a `.sql.gz`. Erro de `pg_dump` agora propaga código + stderr; arquivo parcial é removido.
- `src/scripts/backup-daemon.ts`: `cleanOldBackups` reconhece `.sql.gz`/`.sql`/`.dump`; log com duração e tamanho; backup no boot desativável via `BACKUP_ON_BOOT=false`.
- `src/scripts/restore.ts`: restauração retrocompatível — detecta `.gz` (docker: `gunzip -c | psql`; local: descomprime via zlib em temp e `psql --file`), mantém `.sql` e `.dump`.

**Razão:** Pico de CPU/lentidão durante backup numa VPS de 2 vCPU. Causa raiz: dump inteiro bufferizado em RAM (até 512MB) → swap → I/O satura e serviços param. Secundário: `pg_dump` sem prioridade competindo com a aplicação.

**Impacto:** RAM do processo de backup passa a constante (streaming). `pg_dump` cede CPU/IO ao app (nice/ionice). Backups menores em disco (gzip -1). Formato muda para `.sql.gz` — backups `.sql` antigos continuam restauráveis. Detalhes em `BACKUP_AUDIT.md` (raiz).

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
