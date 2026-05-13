'use client'

import { useState, useTransition } from 'react'
import { deleteGuestPost } from '@/modules/guests/actions/deleteGuestPost'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Props {
  postId: string
  companySlug: string
}

export function DeletePostButton({ postId, companySlug }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteGuestPost(postId, companySlug)
      setShowConfirm(false)
    })
  }

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        className="flex-1"
        onClick={() => setShowConfirm(true)}
      >
        Excluir
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-brand-text">Excluir Postagem</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-brand-muted">
            Tem certeza que deseja excluir esta postagem? Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" disabled={isPending} onClick={handleDelete}>
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
