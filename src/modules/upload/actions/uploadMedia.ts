'use server'

import sharp from 'sharp'

interface UploadMediaParams {
  file: File
  folder?: string
}

export async function uploadMedia({
  file,
  folder,
}: UploadMediaParams): Promise<{ ok: boolean; url?: string; error?: string }> {
  if (!file) return { ok: false, error: 'Nenhum arquivo selecionado' }

  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')

  if (!isImage && !isVideo) return { ok: false, error: 'Tipo de arquivo não suportado' }

  const maxSize = isVideo ? 200 * 1024 * 1024 : 5 * 1024 * 1024
  if (file.size > maxSize) {
    return { ok: false, error: isVideo ? 'Vídeo deve ter no máximo 200MB' : 'Imagem deve ter no máximo 5MB' }
  }

  const bunnyHost = process.env.BUNNY_HOST
  const storageZone = process.env.BUNNY_STORAGE_ZONE
  const accessKey = process.env.BUNNY_ACCESS_KEY
  const pullZone = process.env.BUNNY_PULL_ZONE

  if (!bunnyHost || !storageZone || !accessKey || !pullZone) {
    return { ok: false, error: 'Configuração de upload não disponível' }
  }

  try {
    let body: Buffer
    let fileName: string
    let contentType: string

    if (isImage) {
      body = await sharp(Buffer.from(await file.arrayBuffer())).avif({ quality: 80 }).toBuffer()
      fileName = `uid-${Date.now()}.avif`
      contentType = 'image/avif'
    } else {
      const ext = file.name.split('.').pop() ?? 'mp4'
      fileName = `uid-${Date.now()}.${ext}`
      contentType = file.type
      body = Buffer.from(await file.arrayBuffer())
    }

    const path = folder ? `${folder}/${fileName}` : fileName

    const response = await fetch(`https://${bunnyHost}/${storageZone}/${path}`, {
      method: 'PUT',
      headers: { AccessKey: accessKey, 'Content-Type': contentType },
      body: body as BodyInit,
    })

    if (!response.ok) {
      return { ok: false, error: `Falha ao fazer upload (${response.status})` }
    }

    return { ok: true, url: `https://${pullZone}/${path}` }
  } catch {
    return { ok: false, error: 'Erro ao processar o upload' }
  }
}
