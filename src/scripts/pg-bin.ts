import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

const WINDOWS_PG_ROOTS = [
  'C:\\Program Files\\PostgreSQL',
  'C:\\Program Files (x86)\\PostgreSQL',
]

function findWindowsPgBin(): string | null {
  for (const root of WINDOWS_PG_ROOTS) {
    if (!fs.existsSync(root)) continue
    const versions = fs.readdirSync(root).sort((a, b) => Number(b) - Number(a))
    for (const v of versions) {
      const bin = path.join(root, v, 'bin')
      if (fs.existsSync(path.join(bin, 'pg_dump.exe'))) return bin
    }
  }
  return null
}

export function pgBin(executable: string): string {
  if (process.env.PGBIN) return path.join(process.env.PGBIN, executable)
  if (os.platform() === 'win32') {
    const bin = findWindowsPgBin()
    if (bin) return path.join(bin, `${executable}.exe`)
  }
  return executable
}
