# Backup — Contexto Completo

Sistema de backup e restauração do banco PostgreSQL via `pg_dump`/`psql`/`pg_restore`. Três scripts em `src/scripts/`, zero dependências do Next.js, executados diretamente via `tsx`.

---

## Mapa de Arquivos

```
src/scripts/
  backup.ts         → núcleo: parseia DATABASE_URL, executa pg_dump, retorna caminho
  backup-daemon.ts  → daemon: backup imediato ao iniciar + 3 crons + rotação
  restore.ts        → CLI: recebe arquivo como argv[2], detecta formato, executa restauração
backups/            → diretório de saída criado automaticamente em process.cwd()
```

---

## `backup.ts` — Núcleo

**Exports públicos:**
```typescript
export type BackupType = 'manual' | 'daily' | 'weekly' | 'monthly'
export async function runBackup(type: BackupType): Promise<string>
// retorna o caminho absoluto do arquivo gerado
```

**O que faz internamente:**
1. Lê `process.env.DATABASE_URL` (falha com erro se ausente)
2. `parseConnectionUrl(url)` → `{ host, port, user, password, database }` via `new URL()`
3. Cria `backups/` se não existir (`fs.mkdirSync recursive`)
4. Monta nome: `janus-{type}-{ISO timestamp com `:` e `.` trocados por `-`}.sql`
   - Exemplo: `janus-daily-2026-05-25T02-00-00-000Z.sql`
5. Executa:
   ```
   pg_dump --host= --port= --username= --dbname= --no-password --format=plain --file="<path>"
   ```
   com `PGPASSWORD` injetado **apenas no `env` do processo filho** — nunca no console
6. Quando chamado diretamente (`require.main === module`), executa `runBackup('manual')`

---

## `backup-daemon.ts` — Daemon

**Constante de retenção (hardcoded):**
```typescript
const RETENTION: Record<BackupType, number> = {
  manual: 10,
  daily: 7,
  weekly: 4,
  monthly: 3,
}
```

**Sequência ao iniciar:**
1. Log `Backup daemon iniciado`
2. `await executeBackup('manual')` — backup imediato bloqueante
3. Registra 3 crons via `node-cron`:
   - `'0 2 * * *'`  → `executeBackup('daily')`   — todo dia 02:00
   - `'0 3 * * 0'`  → `executeBackup('weekly')`  — domingo 03:00
   - `'0 4 1 * *'`  → `executeBackup('monthly')` — dia 1 de cada mês 04:00
4. Log confirmando agendamentos registrados

**`executeBackup(type)`** (try/catch — nunca quebra o processo):
1. Chama `runBackup(type)` do `backup.ts`
2. Chama `cleanOldBackups(type)` após sucesso

**`cleanOldBackups(type)`:**
- Filtra arquivos com prefixo `janus-{type}-` e sufixo `.sql`
- Ordena por `mtime` decrescente (mais novo primeiro)
- Remove tudo além do limite `RETENTION[type]`
- Log de cada arquivo removido

---

## `restore.ts` — CLI

**Uso:**
```bash
pnpm db:restore backups/janus-daily-2026-05-25T02-00-00-000Z.sql
# ou com caminho absoluto
pnpm db:restore /backups/janus-weekly-....dump
```

**Lógica:**
1. `process.argv[2]` → path do arquivo (erro + exit 1 se ausente)
2. `path.resolve()` → normaliza para caminho absoluto
3. `fs.existsSync()` → falha com erro descritivo se não encontrar
4. Detecta formato pela extensão:
   - `.dump` → `pg_restore --clean --if-exists` (formato custom do pg_dump)
   - qualquer outra coisa (`.sql`) → `psql --file=`
5. `PGPASSWORD` injetado no env do processo filho — mesmo padrão do backup

**Flags importantes na restauração:**
- `--clean` → DROP objetos antes de recriar
- `--if-exists` → não falha se objeto não existir no banco destino
- `--no-password` → força não interatividade (senha vem via PGPASSWORD)

---

## Scripts `package.json`

```json
"backup:daemon": "npx tsx src/scripts/backup-daemon.ts",
"backup:now":    "npx tsx src/scripts/backup.ts manual",
"db:restore":    "npx tsx src/scripts/restore.ts"
```

> `backup:now` passa `manual` como `argv[2]`, mas `backup.ts` ignora esse argumento — sempre chama `runBackup('manual')` via `require.main`. O argumento não é usado.

---

## Regras de Segurança Inegociáveis

| Regra | Implementação |
|-------|--------------|
| Senha nunca em log | `PGPASSWORD` só no `env` do `execAsync`, nunca em `console.*` |
| Sem impressão de DATABASE_URL | Erros exibem `err.message` — a URL não aparece na mensagem do pg |
| Sem hardcode | Credenciais exclusivamente via `DATABASE_URL` do `.env` |

---

## Dependências

| Pacote | Versão | Tipo |
|--------|--------|------|
| `node-cron` | `^4.2.1` | production |
| `@types/node-cron` | `^3.0.11` | devDependency |
| `dotenv` | `^17.4.2` | production (já existia) |

Binários externos necessários no PATH do servidor: `pg_dump`, `psql`, `pg_restore`.

---

## O Que NÃO Existe (para evitar suposições erradas)

- ❌ Não há upload para S3/cloud — backups são locais em `backups/`
- ❌ Não há notificação por email/webhook em caso de falha
- ❌ Não há endpoint HTTP para disparar backup — só CLI
- ❌ `backup.ts` não usa o argumento `argv[2]` — ignora qualquer argumento passado
- ❌ `cleanOldBackups` não toca arquivos `.dump` — só `.sql`

---

## Pontos de Extensão Óbvios (ainda não implementados)

- Upload S3 após backup bem-sucedido (dentro de `executeBackup`, após `cleanOldBackups`)
- Webhook/Slack de alerta em caso de erro (dentro do `catch` de `executeBackup`)
- Suporte a `--format=custom` no `pg_dump` para gerar `.dump` (comprimido, mais eficiente)
- Variável de ambiente `BACKUP_RETENTION_DAILY` etc. para configurar retenção sem tocar código
