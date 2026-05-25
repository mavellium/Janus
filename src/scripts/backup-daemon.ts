import * as fs from 'fs'
import * as path from 'path'
import * as cron from 'node-cron'
import { runBackup, type BackupType } from './backup'

const BACKUPS_DIR = path.resolve(process.cwd(), 'backups')

const RETENTION: Record<BackupType, number> = {
  manual: 10,
  daily: 7,
  weekly: 4,
  monthly: 3,
}

function cleanOldBackups(type: BackupType): void {
  if (!fs.existsSync(BACKUPS_DIR)) return

  const prefix = `janus-${type}-`
  const files = fs
    .readdirSync(BACKUPS_DIR)
    .filter((f) => f.startsWith(prefix) && f.endsWith('.sql'))
    .map((f) => ({ name: f, mtime: fs.statSync(path.join(BACKUPS_DIR, f)).mtime }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())

  const toDelete = files.slice(RETENTION[type])
  for (const file of toDelete) {
    fs.unlinkSync(path.join(BACKUPS_DIR, file.name))
    console.log(`Backup removido: ${file.name}`)
  }
}

async function executeBackup(type: BackupType): Promise<void> {
  try {
    console.log(`[${new Date().toISOString()}] Iniciando backup ${type}...`)
    const filepath = await runBackup(type)
    console.log(`[${new Date().toISOString()}] Backup ${type} concluído: ${filepath}`)
    cleanOldBackups(type)
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] Erro no backup ${type}:`,
      err instanceof Error ? err.message : String(err),
    )
  }
}

async function main() {
  console.log(`[${new Date().toISOString()}] Backup daemon iniciado`)

  await executeBackup('manual')

  cron.schedule('0 2 * * *', () => void executeBackup('daily'))
  cron.schedule('0 3 * * 0', () => void executeBackup('weekly'))
  cron.schedule('0 4 1 * *', () => void executeBackup('monthly'))

  console.log(`[${new Date().toISOString()}] Agendamentos registrados: diário 02:00, semanal dom 03:00, mensal dia 1 04:00`)
}

main().catch((err) => {
  console.error('Erro fatal no daemon:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
