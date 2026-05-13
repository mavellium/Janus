'use client'

import { useActionState, useRef, useState, useEffect } from 'react'
import { createGuestPost } from '@/modules/guests/actions/createGuestPost'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.ok) {
      onSuccess()
    }
  }, [state.ok, onSuccess])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-brand-text">Nova Postagem</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="companySlug" value={companySlug} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Título (opcional)</Label>
                <Input name="title" placeholder="Dê um título para sua foto" />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Mensagem</Label>
                <textarea
                  name="message"
                  required
                  placeholder="Escreva uma mensagem sobre esta foto..."
                  className="w-full h-24 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              {state.error && (
                <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
                  {state.error}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  Publicar
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Imagem</Label>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full aspect-video rounded-lg border-2 border-dashed border-border hover:border-brand-primary transition flex items-center justify-center bg-brand-btn-light/30"
              >
                {preview ? (
                  <div className="relative w-full h-full">
                    <Image src={preview} alt="Preview" fill className="object-cover rounded-lg" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-6 h-6 text-brand-muted" />
                    <span className="text-xs text-brand-muted text-center">Clique para selecionar uma foto</span>
                  </div>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                name="image"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                required
              />
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
