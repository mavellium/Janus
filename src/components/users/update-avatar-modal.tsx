'use client'

import { useState, useTransition, useRef, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { uploadImage } from '@/modules/upload/actions/uploadImage'
import { updateAvatar } from '@/modules/users/actions/updateAvatar'
import { useToast } from '@/hooks/use-toast'
import { Camera, Link2, Loader2 } from 'lucide-react'

interface UpdateAvatarModalProps {
  userId: string
  currentImage?: string | null
  onAvatarUpdate?: (url: string) => void
}

export function UpdateAvatarModal({ userId, currentImage, onAvatarUpdate }: UpdateAvatarModalProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ message: 'O arquivo deve ser uma imagem', type: 'error' })
        return
      }
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }, [toast])

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setImageUrl(url)
    if (url && url.startsWith('http')) {
      setPreviewUrl(url)
    }
  }, [])

  const handleSave = useCallback(() => {
    startTransition(async () => {
      let finalImageUrl = ''

      if (activeTab === 'upload' && selectedFile) {
        const uploadResult = await uploadImage({ file: selectedFile, folder: 'avatars' })

        if (!uploadResult.ok) {
          console.error('Erro no upload:', uploadResult.error)
          toast({ message: uploadResult.error || 'Erro ao fazer upload', type: 'error' })
          return
        }

        finalImageUrl = uploadResult.url!
      } else if (activeTab === 'url' && imageUrl) {
        if (!imageUrl.startsWith('http')) {
          toast({ message: 'URL inválida', type: 'error' })
          return
        }
        finalImageUrl = imageUrl
      } else {
        toast({ message: 'Selecione uma imagem ou informe uma URL', type: 'error' })
        return
      }

      const updateResult = await updateAvatar(userId, finalImageUrl)

      if (updateResult.ok) {
        toast({ message: 'Foto atualizada com sucesso!', type: 'success' })
        onAvatarUpdate?.(finalImageUrl)
        setOpen(false)
        setSelectedFile(null)
        setPreviewUrl(null)
        setImageUrl('')
      } else {
        console.error('Erro na atualização:', updateResult.error)
        toast({ message: updateResult.error || 'Erro ao atualizar foto', type: 'error' })
      }
    })
  }, [activeTab, selectedFile, imageUrl, userId, onAvatarUpdate, toast])

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setSelectedFile(null)
      setPreviewUrl(null)
      setImageUrl('')
      setActiveTab('upload')
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Camera className="w-4 h-4 mr-2" />
          Alterar Foto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-brand-bg">
        <DialogHeader>
          <DialogTitle>Atualizar Foto de Perfil</DialogTitle>
          <DialogDescription>
            Escolha uma nova foto para seu perfil
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">
              <Camera className="w-4 h-4 mr-2" />
              Upload do PC
            </TabsTrigger>
            <TabsTrigger value="url">
              <Link2 className="w-4 h-4 mr-2" />
              Usar URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              {previewUrl && (
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-brand-primary">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending}
              >
                Selecionar Imagem
              </Button>
              <p className="text-xs text-brand-muted">
                Máximo 5MB. Formatos: JPG, PNG, GIF
              </p>
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              {previewUrl && imageUrl && (
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-brand-primary">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={() => setPreviewUrl(null)}
                  />
                </div>
              )}
              <Input
                placeholder="https://exemplo.com/imagem.jpg"
                value={imageUrl}
                onChange={handleUrlChange}
                disabled={isPending}
              />
              <p className="text-xs text-brand-muted">
                Cole a URL de uma imagem
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={isPending || (!selectedFile && !imageUrl)}
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Foto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
