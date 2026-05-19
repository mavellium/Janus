'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Trash2, Edit3 } from 'lucide-react'

interface ImagePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  onRemove: () => void
  onEdit: () => void
}

export function ImagePreviewModal({
  isOpen,
  onClose,
  imageUrl,
  onRemove,
  onEdit,
}: ImagePreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border-0 w-screen h-screen max-w-none max-h-screen p-0 flex flex-col">
        <VisuallyHidden>
          <DialogTitle>Visualizar imagem</DialogTitle>
        </VisuallyHidden>

        <div className="flex-1 flex items-center justify-center p-8">
          <img
            src={imageUrl}
            alt="Visualização ampliada"
            className="max-w-full max-h-full object-contain"
          />
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-8">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                onRemove()
                onClose()
              }}
              aria-label="Remover imagem"
              className="p-3 rounded-lg bg-destructive hover:bg-red-700 transition text-white inline-flex items-center justify-center"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                onEdit()
                onClose()
              }}
              aria-label="Alterar imagem"
              className="p-3 rounded-lg bg-brand-primary hover:bg-brand-hover transition text-white inline-flex items-center justify-center"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
