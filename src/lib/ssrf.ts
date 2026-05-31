import { lookup } from 'dns/promises'
import { isIP } from 'net'

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
])

function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const parts = ip.split('.').map(Number)
    const [a, b] = parts
    if (a === 10) return true
    if (a === 127) return true
    if (a === 0) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a >= 224) return true
    return false
  }

  const normalized = ip.toLowerCase()
  if (normalized === '::1' || normalized === '::') return true
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true
  if (normalized.startsWith('fe80')) return true
  if (normalized.startsWith('::ffff:')) return isPrivateIp(normalized.slice(7))
  return false
}

export async function assertPublicUrl(rawUrl: string): Promise<URL> {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new Error('URL inválida')
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Protocolo não permitido')
  }

  const hostname = parsed.hostname.toLowerCase()
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new Error('Host não permitido')
  }

  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new Error('Endereço de rede privada não permitido')
    return parsed
  }

  const records = await lookup(hostname, { all: true })
  if (records.length === 0) throw new Error('Host não resolvido')
  for (const record of records) {
    if (isPrivateIp(record.address)) {
      throw new Error('Host resolve para rede privada não permitido')
    }
  }

  return parsed
}
