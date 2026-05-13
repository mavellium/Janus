'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ImageIcon, X } from 'lucide-react'
import { createBlogTag } from '@/modules/blog/actions/createBlogTag'
import { updateBlogTag } from '@/modules/blog/actions/updateBlogTag'
import { uploadImage } from '@/modules/upload/actions/uploadImage'
import Image from 'next/image'

interface Tag {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
}

interface TagModalProps {
  projectId: string
  tag?: Tag
  open: boolean
  onClose: () => void
}

export function TagModal({ projectId, tag, open, onClose }: TagModalProps) {
  const action = tag ? updateBlogTag : createBlogTag
  const [state, formAction, isPending] = useActionState(action, { ok: false, error: '' })
  const [imageUrl, setImageUrl] = useState(tag?.imageUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.ok) onClose()
  }, [state.ok, onClose])

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const result = await uploadImage({ file, folder: 'blog-tags' })
    if (result.ok && result.url) setImageUrl(result.url)
    setUploading(false)
    e.target.value = ''
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-brand-text">
            {tag ? 'Editar Tag' : 'Nova Tag'}
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {tag && <input type="hidden" name="id" value={tag.id} />}
          {!tag && <input type="hidden" name="projectId" value={projectId} />}
          <input type="hidden" name="imageUrl" value={imageUrl} />

          <div className="flex flex-col gap-1.5">
            <Label>Nome</Label>
            <Input name="name" required defaultValue={tag?.name} placeholder="Nome da tag" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Descrição (opcional)</Label>
            <Input name="description" defaultValue={tag?.description ?? ''} placeholder="Descrição" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Imagem (opcional)</Label>
            {imageUrl ? (
              <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border">
                <Image src={imageUrl} alt="preview" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 p-1 rounded bg-card/80 text-brand-text hover:bg-card transition"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center justify-center gap-2 h-20 border border-dashed border-border rounded-lg text-brand-muted text-sm hover:border-brand-primary hover:text-brand-primary transition"
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                {uploading ? 'Enviando...' : 'Selecionar imagem'}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>

          {'error' in state && state.error && (
            <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded border border-destructive/20">
              {state.error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isPending || uploading}>
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              {tag ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
