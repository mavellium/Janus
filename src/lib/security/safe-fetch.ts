import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

export type SafeFetchErrorCode =
  | 'INVALID_URL'
  | 'PRIVATE_ADDRESS_BLOCKED'
  | 'TIMEOUT'
  | 'TOO_LARGE'
  | 'TOO_MANY_REDIRECTS'
  | 'UNREACHABLE'

export class SafeFetchError extends Error {
  constructor(
    public readonly code: SafeFetchErrorCode,
    message?: string
  ) {
    super(message ?? code)
    this.name = 'SafeFetchError'
  }
}

export interface SafeFetchOptions {
  timeoutMs?: number
  maxBytes?: number
}

export interface SafeFetchResult {
  body: string
  finalUrl: string
  status: number
  responseTimeMs: number
}

const MAX_REDIRECTS = 3
const DEFAULT_TIMEOUT_MS = 10_000
const DEFAULT_MAX_BYTES = 3 * 1024 * 1024

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true
  const [a, b] = parts
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  )
}

function isPrivateIpv6(ip: string): boolean {
  const lower = ip.toLowerCase()
  if (lower === '::' || lower === '::1') return true
  if (lower.startsWith('::ffff:')) {
    const mapped = lower.slice(7)
    return isIP(mapped) === 4 ? isPrivateIpv4(mapped) : true
  }
  return (
    lower.startsWith('fc') ||
    lower.startsWith('fd') ||
    lower.startsWith('fe8') ||
    lower.startsWith('fe9') ||
    lower.startsWith('fea') ||
    lower.startsWith('feb')
  )
}

export function isPrivateAddress(ip: string): boolean {
  const family = isIP(ip)
  if (family === 4) return isPrivateIpv4(ip)
  if (family === 6) return isPrivateIpv6(ip)
  return true
}

async function assertPublicHost(url: URL): Promise<void> {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new SafeFetchError('INVALID_URL', 'Apenas http/https são permitidos')
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, '')

  if (isIP(hostname)) {
    if (isPrivateAddress(hostname)) {
      throw new SafeFetchError('PRIVATE_ADDRESS_BLOCKED')
    }
    return
  }

  let addresses: Array<{ address: string }>
  try {
    addresses = await lookup(hostname, { all: true })
  } catch {
    throw new SafeFetchError('UNREACHABLE', `DNS não resolveu ${hostname}`)
  }

  if (addresses.length === 0) {
    throw new SafeFetchError('UNREACHABLE', `DNS não resolveu ${hostname}`)
  }

  for (const { address } of addresses) {
    if (isPrivateAddress(address)) {
      throw new SafeFetchError('PRIVATE_ADDRESS_BLOCKED')
    }
  }
}

async function readBodyLimited(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) return ''

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel()
      throw new SafeFetchError('TOO_LARGE')
    }
    chunks.push(value)
  }

  const merged = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder('utf-8').decode(merged)
}

export async function safeFetch(
  rawUrl: string,
  { timeoutMs = DEFAULT_TIMEOUT_MS, maxBytes = DEFAULT_MAX_BYTES }: SafeFetchOptions = {}
): Promise<SafeFetchResult> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new SafeFetchError('INVALID_URL')
  }

  const startedAt = Date.now()

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    await assertPublicHost(url)

    let response: Response
    try {
      response = await fetch(url, {
        redirect: 'manual',
        cache: 'no-store',
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          'User-Agent': 'JanusSeoBot/1.0 (analise de SEO; +https://mavellium.com.br)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      })
    } catch (error) {
      if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
        throw new SafeFetchError('TIMEOUT')
      }
      throw new SafeFetchError('UNREACHABLE')
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      await response.body?.cancel()
      if (!location) throw new SafeFetchError('UNREACHABLE', 'Redirecionamento sem destino')
      try {
        url = new URL(location, url)
      } catch {
        throw new SafeFetchError('INVALID_URL', 'Redirecionamento inválido')
      }
      continue
    }

    const body = await readBodyLimited(response, maxBytes)
    return {
      body,
      finalUrl: url.toString(),
      status: response.status,
      responseTimeMs: Date.now() - startedAt,
    }
  }

  throw new SafeFetchError('TOO_MANY_REDIRECTS')
}
