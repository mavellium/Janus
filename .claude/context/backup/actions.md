# Backup — Actions (Mutações / Escrita)

> Não são Server Actions do Next.js. São funções async exportadas consumidas pelo daemon e pela CLI.

---

## runBackup (`backup.ts`)

- **Assinatura:** `async (type: BackupType): Promise<string>`
- **Retorno:** caminho absoluto do arquivo gerado
- **Fluxo:**
  1. Lê `DATABASE_URL` → lança erro se ausente
  2. `parseConnectionUrl` → `DBConfig`
  3. Cria `backups/` se não existir (`fs.mkdirSync recursive`)
  4. Monta `filename` com `buildFilename(type)`
  5. Executa `pg_dump --format=plain` com `PGPASSWORD` no env do filho
  6. Retorna `filepath`
- **Uso como CLI:** `require.main === module` → chama `runBackup('manual')` diretamente

---

## executeBackup (`backup-daemon.ts`)

- **Assinatura:** `async (type: BackupType): Promise<void>`
- **Fluxo:**
  1. Log `[ISO] Iniciando backup {type}...`
  2. `await runBackup(type)` → obtém filepath
  3. Log `[ISO] Backup {type} concluído: {filepath}`
  4. `cleanOldBackups(type)` → rotação imediata
- **Erro:** capturado no `catch` — loga `err.message`, **processo não encerra**

---

## cleanOldBackups (`backup-daemon.ts`)

- **Assinatura:** `(type: BackupType): void`
- **Fluxo:**
  1. Lista `backups/` filtrando `janus-{type}-*.sql`
  2. Ordena por `mtime` decrescente (mais novo primeiro)
  3. `slice(RETENTION[type])` → tudo além do limite
  4. `fs.unlinkSync` em cada excedente + log por arquivo removido
- **Atenção:** só processa `.sql` — arquivos `.dump` não são afetados pela rotação

---

## Agendamentos Registrados (backup-daemon.ts `main()`)

| Cron | Tipo | Horário |
|------|------|---------|
| `0 2 * * *` | `daily` | Todo dia 02:00 (mantém 3) |
| `0 4 1 * *` | `monthly` | Dia 1 de cada mês 04:00 (mantém 3) |

Sequência de boot do daemon:
1. Log `Backup daemon iniciado`
2. `await executeBackup('manual')` — **bloqueante**, executa antes de registrar os crons (pulável via `BACKUP_ON_BOOT=false`)
3. `cron.schedule(...)` × 2
4. Log confirmando os 2 agendamentos
