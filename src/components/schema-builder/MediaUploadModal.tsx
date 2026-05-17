'use client'

import { useState } from 'react'
import { Loader2, LinkIcon, Upload, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface MediaUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUrlSubmit: (url: string) => void
  onFileUpload: (file: File) => void
  mediaType: 'image' | 'video'
  isUploading?: boolean
  uploadError?: string
}

export function MediaUploadModal({
  isOpen,
  onClose,
  onUrlSubmit,
  onFileUpload,
  mediaType,
  isUploading = false,
  uploadError,
}: MediaUploadModalProps) {
  const [tab, setTab] = useState<'url' | 'upload'>('url')
  const [urlInput, setUrlInput] = useState('')
  const [urlError, setUrlError] = useState('')

  const mediaLabel = mediaType === 'image' ? 'Imagem' : 'Vídeo'
  const accept = mediaType === 'image' ? 'image/*' : 'video/*'

  const handleUrlSubmit = () => {
    setUrlError('')

    if (!urlInput.trim()) {
      setUrlError(`URL da ${mediaLabel.toLowerCase()} é obrigatória`)
      return
    }

    try {
      new URL(urlInput)
    } catch {
      setUrlError('URL inválida')
      return
    }

    onUrlSubmit(urlInput)
    setUrlInput('')
    onClose()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileUpload(file)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-brand-text">
            Adicionar {mediaLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2 border-b border-border">
            <button
              onClick={() => {
                setTab('url')
                setUrlError('')
              }}
              className={`flex-1 py-2 px-3 text-sm font-medium transition border-b-2 ${
                tab === 'url'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-brand-muted hover:text-brand-text'
              }`}
            >
              <LinkIcon className="w-4 h-4 inline mr-1.5" />
              URL
            </button>
            <button
              onClick={() => {
                setTab('upload')
                setUrlError('')
              }}
              className={`flex-1 py-2 px-3 text-sm font-medium transition border-b-2 ${
                tab === 'upload'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-brand-muted hover:text-brand-text'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-1.5" />
              Upload
            </button>
          </div>

          {tab === 'url' ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-brand-muted">
                  URL da {mediaLabel.toLowerCase()}
                </Label>
                <Input
                  type="url"
                  placeholder={`https://exemplo.com/${mediaType === 'image' ? 'imagem.jpg' : 'video.mp4'}`}
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value)
                    setUrlError('')
                  }}
                  disabled={isUploading}
                  className="bg-brand-bg border-border text-brand-text"
                />
                {urlError && (
                  <p className="text-xs text-destructive">{urlError}</p>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={onClose} disabled={isUploading}>
                  Cancelar
                </Button>
                <Button onClick={handleUrlSubmit} disabled={isUploading}>
                  {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  Adicionar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block">
                <div className="border-2 border-dashed border-border rounded-lg px-6 py-8 text-center cursor-pointer hover:border-brand-primary/50 transition">
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-brand-muted mx-auto mb-2" />
                  ) : (
                    <Upload className="w-8 h-8 text-brand-muted mx-auto mb-2" />
                  )}
                  <p className="text-sm font-medium text-brand-text">
                    {isUploading ? `Enviando ${mediaLabel.toLowerCase()}...` : `Clique para selecionar ${mediaLabel.toLowerCase()}`}
                  </p>
                  <p className="text-xs text-brand-muted mt-1">
                    ou arraste e solte
                  </p>
                </div>
                <input
                  type="file"
                  accept={accept}
                  className="sr-only"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>
              {uploadError && (
                <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded border border-destructive/20">
                  {uploadError}
                </p>
              )}
              {!isUploading && (
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
