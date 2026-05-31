import { cookies } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_VIDEO_BYTES = 200 * 1024 * 1024

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/heic',
  'image/heif',
])
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/webm'])

const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
}

async function isAuthorized(): Promise<boolean> {
  const session = await auth()
  if (session?.user?.id) return true

  const cookieStore = await cookies()
  const guestId = cookieStore.get('guest_entry_id')?.value
  if (!guestId) return false

  const guest = await db.guestEntry.findUnique({ where: { id: guestId }, select: { id: true } })
  return !!guest
}

export async function POST(request: Request) {
  try {
    if (!(await isAuthorized())) {
      return Response.json({ ok: false, error: 'Não autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const mediaType = formData.get('mediaType') === 'VIDEO' ? 'VIDEO' : 'IMAGE'

    if (!file) {
      return Response.json({ ok: false, error: 'Nenhum arquivo selecionado' }, { status: 400 })
    }

    const allowedTypes = mediaType === 'VIDEO' ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES
    if (!allowedTypes.has(file.type)) {
      return Response.json({ ok: false, error: 'Tipo de arquivo não permitido' }, { status: 415 })
    }

    const maxBytes = mediaType === 'VIDEO' ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
    if (file.size > maxBytes) {
      return Response.json({ ok: false, error: 'Arquivo excede o tamanho máximo' }, { status: 413 })
    }

    const bunnyHost = process.env.BUNNY_HOST
    const storageZone = process.env.BUNNY_STORAGE_ZONE
    const accessKey = process.env.BUNNY_ACCESS_KEY
    const pullZone = process.env.BUNNY_PULL_ZONE

    if (!bunnyHost || !storageZone || !accessKey || !pullZone) {
      return Response.json({ ok: false, error: 'Configuração de upload não disponível' }, { status: 500 })
    }

    const buffer = await file.arrayBuffer()
    const extension = EXTENSION_BY_TYPE[file.type] ?? (mediaType === 'VIDEO' ? 'mp4' : 'jpg')
    const fileName = `uid-${Date.now()}-${crypto.randomUUID()}.${extension}`
    const path = `guest-posts/${fileName}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 300000)

    try {
      const response = await fetch(`https://${bunnyHost}/${storageZone}/${path}`, {
        method: 'PUT',
        headers: {
          'AccessKey': accessKey,
          'Content-Type': file.type,
        },
        body: new Uint8Array(buffer),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        const errorMsg = response.status === 504
          ? 'Upload expirou (timeout). Tente um arquivo menor ou uma conexão mais rápida.'
          : `Falha ao fazer upload (${response.status})`
        return Response.json(
          { ok: false, error: errorMsg },
          { status: response.status }
        )
      }

      const publicUrl = `https://${pullZone}/${path}`
      return Response.json({ ok: true, url: publicUrl, mediaType })
    } catch (error) {
      clearTimeout(timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        return Response.json({ ok: false, error: 'Timeout ao fazer upload para CDN (>30s)' }, { status: 504 })
      }
      throw error
    }
  } catch (error) {
    console.error('Erro no upload:', error)
    return Response.json({ ok: false, error: 'Erro ao processar o upload' }, { status: 500 })
  }
}
