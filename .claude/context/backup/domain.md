# Backup — Entidades e Domínio

## Type: BackupType

```typescript
export type BackupType = 'manual' | 'daily' | 'monthly'
```

Determina o prefixo do arquivo gerado e a política de retenção aplicada na rotação.

## Interface: DBConfig

```typescript
interface DBConfig {
  host: string
  port: string      // default '5432' se ausente na URL
  user: string
  password: string  // decodeURIComponent aplicado
  database: string  // pathname sem a barra inicial
}
```

Extraída de `DATABASE_URL` via `new URL()`. Usada para montar os argumentos dos binários pg.

## Constante: RETENTION (backup-daemon.ts)

```typescript
const RETENTION: Record<BackupType, number> = {
  manual:  10,
  daily:    3,
  monthly:  3,
}
```

Define quantos arquivos de cada tipo são mantidos. Hardcoded — para tornar configurável via env, substituir pelos valores de `process.env.BACKUP_RETENTION_*`.

## Nomenclatura de Arquivos

- **Padrão:** `janus-{type}-{ISO com `:` e `.` trocados por `-`}.sql.gz`
- **Exemplo:** `janus-daily-2026-05-25T02-00-00-000Z.sql.gz`
- **Formato gerado:** `plain` SQL via `pg_dump --format=plain`, comprimido em streaming com gzip nível 1 (`.sql.gz`)
- **Pipeline:** `pg_dump (stdout) → createGzip({level:1}) → createWriteStream`. Em modo docker o `pg_dump` roda com `nice -n 19` + `ionice -c3` (guard `command -v ionice`). Sem buffer em memória.
- **Legado/compat:** `.sql` (sem compressão) e `.dump` (custom) continuam restauráveis

## Utilitário: pg-bin (`pg-bin.ts`)

```typescript
export interface PgExecContext {
  mode: 'docker' | 'local'
  containerName?: string  // presente quando mode === 'docker'
  binPath?: string        // presente quando mode === 'local' e PGBIN definido
}

export function resolvePgContext(port: string): PgExecContext
export function buildPgCommand(ctx: PgExecContext, executable: string, args: string): string
```

`resolvePgContext` determina onde executar os binários pg, por prioridade:

| Prioridade | Condição | Resultado |
|-----------|----------|-----------|
| 1 | `PGBIN` definido no env | `mode: 'local'` com `binPath` |
| 2 | `BACKUP_PG_CONTAINER` definido no env | `mode: 'docker'` com esse container (nome explícito) |
| 3 | Container Docker mapeando a porta do banco | `mode: 'docker'` com `containerName` |
| 4 | Windows + PG instalado em `Program Files` | `mode: 'local'` com `binPath` local |
| 5 | Fallback | `mode: 'local'` sem `binPath` (assume PATH) |

> **`BACKUP_PG_CONTAINER` é obrigatório em hosts com múltiplos Postgres.** A
> detecção por porta (prio 3) pode pegar o container errado se outro projeto
> mapear a mesma porta. Em produção, fixe o nome (ex.: `janus-db-prod`).

`buildPgCommand` monta o comando final:
- **docker:** `docker exec {container} {executable} {args}`
- **local:** `"{binPath}/{executable}" {args}` ou `"{executable}" {args}`

**Por que Docker é preferido:** evita mismatch de versão entre o `pg_dump` local e o servidor. O pg dentro do container sempre tem a mesma versão do servidor.

**Modo Docker — backup:** stdout do `pg_dump` (rodado com `nice`/`ionice` dentro do container) é transmitido em streaming por `createGzip({level:1})` direto para `createWriteStream` — sem buffer em memória.

**Modo Docker — restore:** arquivo local é copiado para `/tmp/` dentro do container via `docker cp`, executado com host `127.0.0.1:5432` (porta interna), depois removido.

## Segurança: Regra Absoluta

`PGPASSWORD` só existe no `env` do processo filho passado a `execAsync`. Nunca aparece em `console.*`, em mensagens de erro, nem na string do comando (`cmd`) — que loga `--no-password`.

## Erros

| Situação | Mensagem lançada |
|----------|-----------------|
| `DATABASE_URL` ausente | `'DATABASE_URL não definida no ambiente'` |
| Arquivo de backup não encontrado | `'Arquivo não encontrado: {path}'` |
| Falha do `pg_dump`/`psql`/`pg_restore` | Mensagem nativa do binário via `err.message` |

Erros de `executeBackup` no daemon são capturados no `catch` — o processo **não morre**, apenas loga e segue.
