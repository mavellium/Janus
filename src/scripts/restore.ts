import * as fs from 'fs'
import * as path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as dotenv from 'dotenv'
import { pgBin } from './pg-bin'

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

  const env = { ...process.env, PGPASSWORD: db.password }

  if (isCustomFormat) {
    const cmd = `"${pgBin('pg_restore')}" --host=${db.host} --port=${db.port} --username=${db.user} --dbname=${db.database} --no-password --clean --if-exists "${resolved}"`
    await execAsync(cmd, { env })
  } else {
    const cmd = `"${pgBin('psql')}" --host=${db.host} --port=${db.port} --username=${db.user} --dbname=${db.database} --no-password --file="${resolved}"`
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
