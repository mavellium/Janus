import * as fs from 'fs'
import * as path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as dotenv from 'dotenv'

dotenv.config()

const execAsync = promisify(exec)

const BACKUPS_DIR = path.resolve(process.cwd(), 'backups')

export type BackupType = 'manual' | 'daily' | 'weekly' | 'monthly'

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

function buildFilename(type: BackupType): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `janus-${type}-${timestamp}.sql`
}

export async function runBackup(type: BackupType): Promise<string> {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL não definida no ambiente')

  const db = parseConnectionUrl(databaseUrl)

  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true })
  }

  const filename = buildFilename(type)
  const filepath = path.join(BACKUPS_DIR, filename)

  const cmd = `pg_dump --host=${db.host} --port=${db.port} --username=${db.user} --dbname=${db.database} --no-password --format=plain --file="${filepath}"`

  await execAsync(cmd, {
    env: {
      ...process.env,
      PGPASSWORD: db.password,
    },
  })

  return filepath
}

if (require.main === module) {
  runBackup('manual')
    .then((filepath) => {
      console.log(`Backup concluído: ${filepath}`)
    })
    .catch((err) => {
      console.error('Erro ao executar backup:', err instanceof Error ? err.message : String(err))
      process.exit(1)
    })
}
