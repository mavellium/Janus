import * as fs from 'fs'
import * as path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as dotenv from 'dotenv'
import { resolvePgContext, buildPgCommand } from './pg-bin'

dotenv.config()

const execAsync = promisify(exec)

interface DBConfig {
  host: string
  port: string
  user: string
  password: string
  database: string
}

function parseConnectionUrl(url: string): DBConfig {
  const parsed = new URL(url)
  return {
    host: parsed.hostname,
    port: parsed.port || '5432',
    user: parsed.username,
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ''),
  }
}

async function runRestore(filePath: string): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL não definida no ambiente')

  const resolved = path.resolve(filePath)
  if (!fs.existsSync(resolved)) throw new Error(`Arquivo não encontrado: ${resolved}`)

  const db = parseConnectionUrl(databaseUrl)
  const isCustomFormat = resolved.endsWith('.dump')
  const ctx = resolvePgContext(db.port)
  const env = { ...process.env, PGPASSWORD: db.password }

  if (ctx.mode === 'docker' && ctx.containerName) {
    const containerPath = `/tmp/${path.basename(resolved)}`
    await execAsync(`docker cp "${resolved}" ${ctx.containerName}:${containerPath}`)

    const baseArgs = `--host=127.0.0.1 --port=5432 --username=${db.user} --dbname=${db.database} --no-password`
    const cmd = isCustomFormat
      ? buildPgCommand(ctx, 'pg_restore', `${baseArgs} --clean --if-exists "${containerPath}"`)
      : buildPgCommand(ctx, 'psql', `${baseArgs} --file="${containerPath}"`)

    await execAsync(cmd, { env, maxBuffer: 512 * 1024 * 1024 })
    await execAsync(`docker exec ${ctx.containerName} rm -f ${containerPath}`)
  } else {
    const baseArgs = `--host=${db.host} --port=${db.port} --username=${db.user} --dbname=${db.database} --no-password`
    const cmd = isCustomFormat
      ? buildPgCommand(ctx, 'pg_restore', `${baseArgs} --clean --if-exists "${resolved}"`)
      : buildPgCommand(ctx, 'psql', `${baseArgs} --file="${resolved}"`)

    await execAsync(cmd, { env })
  }
}

const filePath = process.argv[2]

if (!filePath) {
  console.error('Uso: npx tsx src/scripts/restore.ts <caminho-do-backup>')
  process.exit(1)
}

runRestore(filePath)
  .then(() => {
    console.log(`Restauração concluída a partir de: ${filePath}`)
  })
  .catch((err) => {
    console.error('Erro ao restaurar backup:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  })
