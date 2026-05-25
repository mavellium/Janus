# Backup — Entidades e Domínio

## Type: BackupType

```typescript
export type BackupType = 'manual' | 'daily' | 'weekly' | 'monthly'
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
  daily:    7,
  weekly:   4,
  monthly:  3,
}
```

Define quantos arquivos de cada tipo são mantidos. Hardcoded — para tornar configurável via env, substituir pelos valores de `process.env.BACKUP_RETENTION_*`.

## Nomenclatura de Arquivos

- **Padrão:** `janus-{type}-{ISO com `:` e `.` trocados por `-`}.sql`
- **Exemplo:** `janus-daily-2026-05-25T02-00-00-000Z.sql`
- **Formato gerado:** `plain` SQL (`.sql`) via `pg_dump --format=plain`
- **Formato custom:** `.dump` — detectado na restauração; usa `pg_restore`

## Segurança: Regra Absoluta

`PGPASSWORD` só existe no `env` do processo filho passado a `execAsync`. Nunca aparece em `console.*`, em mensagens de erro, nem na string do comando (`cmd`) — que loga `--no-password`.

## Erros

| Situação | Mensagem lançada |
|----------|-----------------|
| `DATABASE_URL` ausente | `'DATABASE_URL não definida no ambiente'` |
| Arquivo de backup não encontrado | `'Arquivo não encontrado: {path}'` |
| Falha do `pg_dump`/`psql`/`pg_restore` | Mensagem nativa do binário via `err.message` |

Erros de `executeBackup` no daemon são capturados no `catch` — o processo **não morre**, apenas loga e segue.
