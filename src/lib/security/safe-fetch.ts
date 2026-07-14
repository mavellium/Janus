import { lookup } from 'node:dns/promises'
import { setDefaultResultOrder } from 'node:dns'
import { isIP } from 'node:net'

// Muitos provedores de hospedagem/containers têm rota de saída IPv6 ausente ou
// mal configurada mesmo quando o DNS retorna AAAA — a conexão falha silenciosamente
// em produção mas funciona em redes domésticas/dual-stack. `ipv4first` é a forma
// oficial do Node (dns.setDefaultResultOrder, doc: nodejs.org/api/dns.html) de
// priorizar IPv4 sem exigir um dispatcher/Agent customizado.
setDefaultResultOrder('ipv4first')

export type SafeFetchErrorCode =
  | 'INVALID_URL'
  | 'PRIVATE_ADDRESS_BLOCKED'
  | 'TIMEOUT'
  | 'TOO_LARGE'
  | 'TOO_MANY_REDIRECTS'
  | 'BLOCKED_BY_TARGET'
  | 'UNREACHABLE'

export class SafeFetchError extends Error {
  constructor(
    public readonly code: SafeFetchErrorCode,
    message?: string,
    options?: { cause?: unknown }
  ) {
    super(message ?? code, options)
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
const MAX_NETWORK_RETRIES = 1
const RETRY_DELAY_MS = 800

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

  let addresses: Array<{ address: string; family: number }>
  try {
    addresses = await lookup(hostname, { all: true })
  } catch (cause) {
    throw new SafeFetchError('UNREACHABLE', `DNS não resolveu ${hostname}`, { cause })
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchOnce(url: URL, timeoutMs: number): Promise<Response> {
  try {
    return await fetch(url, {
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
      throw new SafeFetchError('TIMEOUT', undefined, { cause: error })
    }
    const cause = error instanceof Error ? (error.cause ?? error) : error
    const code = cause && typeof cause === 'object' && 'code' in cause ? String(cause.code) : undefined
    console.error('[safeFetch] Falha de rede ao buscar', url.toString(), 'code=', code, 'error=', error)
    throw new SafeFetchError('UNREACHABLE', code ? `Falha de conexão (${code})` : 'Falha de conexão', {
      cause: error,
    })
  }
}

async function fetchWithRetry(url: URL, timeoutMs: number): Promise<Response> {
  let lastError: unknown
  for (let attempt = 0; attempt <= MAX_NETWORK_RETRIES; attempt++) {
    try {
      return await fetchOnce(url, timeoutMs)
    } catch (error) {
      lastError = error
      const isTimeout = error instanceof SafeFetchError && error.code === 'TIMEOUT'
      if (isTimeout || attempt === MAX_NETWORK_RETRIES) throw error
      await sleep(RETRY_DELAY_MS)
    }
  }
  throw lastError
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

    const response = await fetchWithRetry(url, timeoutMs)

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

    if (response.status === 403 || response.status === 429) {
      await response.body?.cancel()
      throw new SafeFetchError('BLOCKED_BY_TARGET', `O site respondeu com HTTP ${response.status}`)
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
