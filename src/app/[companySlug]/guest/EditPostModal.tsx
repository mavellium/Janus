'use client'

import { useActionState, useEffect } from 'react'
import { updateGuestPost } from '@/modules/guests/actions/updateGuestPost'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'

interface Post {
  id: string
  title: string | null
  message: string
  imageUrl: string
  createdAt: Date
}

interface Props {
  post: Post
  companySlug: string
  onClose: () => void
  onSuccess: () => void
}

export function EditPostModal({ post, companySlug, onClose, onSuccess }: Props) {
  const [state, formAction, isPending] = useActionState(updateGuestPost, { ok: false })

  useEffect(() => {
    if (state.ok) {
      onSuccess()
    }
  }, [state.ok, onSuccess])

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-brand-text">Editar Postagem</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="postId" value={post.id} />
          <input type="hidden" name="companySlug" value={companySlug} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Título (opcional)</Label>
                <Input name="title" placeholder="Dê um título para sua foto" defaultValue={post.title || ''} disabled={isPending} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Mensagem</Label>
                <textarea
                  name="message"
                  required
                  placeholder="Escreva uma mensagem sobre esta foto..."
                  defaultValue={post.message}
                  disabled={isPending}
                  className="w-full h-24 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {state.error && (
                <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
                  {state.error}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  Salvar
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Imagem</Label>
              <div className="w-full aspect-video rounded-lg overflow-hidden border border-border">
                <Image src={post.imageUrl} alt={post.title || 'Foto'} width={400} height={225} className="w-full h-full object-cover" />
              </div>
              <p className="text-xs text-brand-muted">A imagem não pode ser alterada</p>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
