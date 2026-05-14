'use server'

import sharp from 'sharp'

interface UploadImageParams {
  file: File
  folder?: string
}

export async function uploadImage({ file, folder }: UploadImageParams): Promise<{ ok: boolean; url?: string; error?: string }> {
  if (!file) {
    return { ok: false, error: 'Nenhum arquivo selecionado' }
  }

  if (!file.type.startsWith('image/')) {
    return { ok: false, error: 'O arquivo deve ser uma imagem' }
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const avifBuffer = await sharp(Buffer.from(arrayBuffer)).avif({ quality: 80 }).toBuffer()

    const fileName = `uid-${Date.now()}.avif`
    const path = folder ? `${folder}/${fileName}` : fileName

    const bunnyHost = process.env.BUNNY_HOST
    const storageZone = process.env.BUNNY_STORAGE_ZONE
    const accessKey = process.env.BUNNY_ACCESS_KEY
    const pullZone = process.env.BUNNY_PULL_ZONE

    if (!bunnyHost || !storageZone || !accessKey || !pullZone) {
      console.error('Configuração BunnyCDN ausente:', { bunnyHost, storageZone, hasAccessKey: !!accessKey, pullZone })
      return { ok: false, error: 'Configuração de upload não disponível' }
    }

    const response = await fetch(`https://${bunnyHost}/${storageZone}/${path}`, {
      method: 'PUT',
      headers: {
        'AccessKey': accessKey,
        'Content-Type': 'image/avif',
      },
      body: new Uint8Array(avifBuffer),
    })

    if (!response.ok) {
      console.error('Erro BunnyCDN:', { status: response.status, statusText: response.statusText, path })
      return { ok: false, error: `Falha ao fazer upload (${response.status})` }
    }

    const publicUrl = `https://${pullZone}/${path}`

    return { ok: true, url: publicUrl }
  } catch (error) {
    console.error('Erro completo no upload:', error)
    return { ok: false, error: 'Erro ao processar o upload' }
  }
}
