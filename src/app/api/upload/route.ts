export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const mediaType = formData.get('mediaType') as string

    if (!file) {
      return Response.json({ ok: false, error: 'Nenhum arquivo selecionado' }, { status: 400 })
    }

    const bunnyHost = process.env.BUNNY_HOST
    const storageZone = process.env.BUNNY_STORAGE_ZONE
    const accessKey = process.env.BUNNY_ACCESS_KEY
    const pullZone = process.env.BUNNY_PULL_ZONE

    if (!bunnyHost || !storageZone || !accessKey || !pullZone) {
      return Response.json({ ok: false, error: 'Configuração de upload não disponível' }, { status: 500 })
    }

    const buffer = await file.arrayBuffer()
    const extension = file.name.split('.').pop() || (mediaType === 'VIDEO' ? 'mp4' : 'jpg')
    const fileName = `uid-${Date.now()}.${extension}`
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
