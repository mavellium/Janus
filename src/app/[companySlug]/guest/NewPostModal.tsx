'use client'

import { useActionState, useRef, useState, useEffect, useTransition } from 'react'
import { createGuestPost } from '@/modules/guests/actions/createGuestPost'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Loader2, Upload } from 'lucide-react'
import Image from 'next/image'

interface Props {
  guestName: string
  companySlug: string
  onClose: () => void
  onSuccess: () => void
}

export function NewPostModal({ guestName, companySlug, onClose, onSuccess }: Props) {
  const [state, formAction, isPending] = useActionState(createGuestPost, { ok: false })
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const selectedFileRef = useRef<File | null>(null)

  useEffect(() => {
    if (state.ok) {
      onSuccess()
    }
  }, [state.ok, onSuccess])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      setUploadError('Apenas imagens e vídeos são permitidos')
      return
    }

    setUploadError(null)
    selectedFileRef.current = file
    setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!selectedFileRef.current) {
      setUploadError('Selecione uma imagem ou vídeo')
      return
    }

    const file = selectedFileRef.current
    const isImage = file.type.startsWith('image/')

    setIsUploading(true)
    setUploadProgress(0)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mediaType', isImage ? 'IMAGE' : 'VIDEO')

      let uploadedUrl = ''
      let uploadedMediaType = ''

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.timeout = 600000

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100)
            setUploadProgress(percentComplete)
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status !== 200) {
            reject(new Error(`HTTP ${xhr.status}`))
            return
          }

          try {
            const result = JSON.parse(xhr.responseText)
            if (!result.ok) {
              reject(new Error(result.error || 'Erro ao fazer upload'))
              return
            }
            uploadedUrl = result.url
            uploadedMediaType = result.mediaType
            resolve()
          } catch (error) {
            reject(error)
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Erro de conexão ao fazer upload'))
        })

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelado'))
        })

        xhr.addEventListener('timeout', () => {
          reject(new Error('Upload expirou (timeout). Tente um arquivo menor.'))
        })

        xhr.open('POST', '/api/upload')
        xhr.send(formData)
      })

      setUploadProgress(100)
      setIsUploading(false)

      const titleInput = formRef.current?.querySelector('input[name="title"]') as HTMLInputElement
      const messageInput = formRef.current?.querySelector('textarea[name="message"]') as HTMLTextAreaElement
      const companySlugInput = formRef.current?.querySelector('input[name="companySlug"]') as HTMLInputElement

      const formDataToSubmit = new FormData()
      formDataToSubmit.append('companySlug', companySlugInput?.value || '')
      formDataToSubmit.append('title', titleInput?.value || '')
      formDataToSubmit.append('message', messageInput?.value || '')
      formDataToSubmit.append('imageUrl', uploadedUrl)
      formDataToSubmit.append('mediaType', uploadedMediaType)

      console.log('Enviando formData:', {
        companySlug: formDataToSubmit.get('companySlug'),
        imageUrl: formDataToSubmit.get('imageUrl'),
        mediaType: formDataToSubmit.get('mediaType'),
        title: formDataToSubmit.get('title'),
        message: formDataToSubmit.get('message'),
      })

      await new Promise(resolve => setTimeout(resolve, 300))

      startTransition(() => {
        formAction(formDataToSubmit)
      })
    } catch (error) {
      console.error('Erro no upload:', error)
      setUploadError(error instanceof Error ? error.message : 'Erro ao enviar mídia')
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-brand-text">Nova Postagem</DialogTitle>
          <DialogDescription className="hidden" />
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="companySlug" value={companySlug} />

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Mídia (Foto ou Vídeo)</Label>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={isPending || isUploading || !!preview}
                className="w-full aspect-video rounded-lg border-2 border-dashed border-border hover:border-brand-primary transition flex items-center justify-center bg-brand-btn-light/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {preview ? (
                  <div className="relative w-full h-full">
                    {selectedFileRef.current?.type.startsWith('video') ? (
                      <video
                        src={preview}
                        className="w-full h-full object-cover rounded-lg"
                        controls
                      />
                    ) : (
                      <Image src={preview} alt="Preview" fill className="object-cover rounded-lg" />
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-6 h-6 text-brand-muted" />
                    <span className="text-xs text-brand-muted text-center">Clique para selecionar uma foto ou vídeo</span>
                  </div>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*, video/*, .heic, .heif, .mov, .mp4, .webm"
                className="hidden"
                onChange={handleFileChange}
              />
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <p className="text-xs text-brand-primary">
                        {uploadProgress === 100 ? 'Processando arquivo...' : 'Enviando para a nuvem...'}
                      </p>
                      {uploadProgress === 100 && (
                        <Loader2 className="w-3 h-3 animate-spin text-brand-primary" />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-brand-primary whitespace-nowrap">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-brand-btn-light rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-primary transition-all"
                      style={{
                        width: `${uploadProgress}%`,
                        transitionDuration: uploadProgress === 100 ? '0ms' : '300ms',
                      }}
                    />
                  </div>
                </div>
              )}
              {uploadError && (
                <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
                  {uploadError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Título (opcional)</Label>
              <Input name="title" placeholder="Dê um título para sua foto" disabled={isPending || isUploading || !preview} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Mensagem</Label>
              <textarea
                name="message"
                placeholder="Escreva uma mensagem sobre esta mídia..."
                required
                disabled={isPending || isUploading || !preview}
                className="w-full h-24 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {state.error && (
              <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
                {state.error}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending || isUploading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || isUploading || !preview} className="flex-1">
                {isPending || isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    {isUploading ? 'Enviando...' : 'Publicando...'}
                  </>
                ) : (
                  'Publicar'
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
