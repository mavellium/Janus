# Backup — Padrões de Código

## Disparar backup manualmente de outro script

```typescript
import { runBackup } from '@/scripts/backup'

const filepath = await runBackup('manual')
console.log(`Gerado: ${filepath}`)
```

## Adicionar novo tipo de backup ao daemon

1. Adicionar ao tipo em `backup.ts`:
```typescript
export type BackupType = 'manual' | 'daily' | 'weekly' | 'monthly' | 'pre-deploy'
```

2. Adicionar retenção em `backup-daemon.ts`:
```typescript
const RETENTION: Record<BackupType, number> = {
  ...
  'pre-deploy': 5,
}
```

3. Registrar o cron (ou chamar diretamente):
```typescript
cron.schedule('0 1 * * *', () => void executeBackup('pre-deploy'))
```

## Executar restauração de um backup específico

```bash
pnpm db:restore backups/janus-daily-2026-05-25T02-00-00-000Z.sql
```

## Padrão seguro de execução com PGPASSWORD

```typescript
await execAsync(cmd, {
  env: {
    ...process.env,
    PGPASSWORD: db.password, // nunca em console.log ou na string cmd
  },
})
```

## Estrutura de try/catch do daemon (nunca quebra o processo)

```typescript
async function executeBackup(type: BackupType): Promise<void> {
  try {
    const filepath = await runBackup(type)
    cleanOldBackups(type)
  } catch (err) {
    console.error(`Erro no backup ${type}:`, err instanceof Error ? err.message : String(err))
    // processo continua — não relança o erro
  }
}
```

## O Que NÃO Implementar Aqui

- ❌ Upload S3 → adicionar dentro de `executeBackup` após `cleanOldBackups`
- ❌ Webhook/Slack de falha → adicionar no `catch` de `executeBackup`
- ❌ Endpoint HTTP para disparar → criar route handler separado que chama `runBackup`
- ❌ Formato `.dump` no pg_dump atual → trocar `--format=plain` por `--format=custom` e extensão `.dump`
