'use client'

import { Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface DeleteAlertModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description?: string
  isDeleting?: boolean
}

export function DeleteAlertModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Você tem certeza absoluta?',
  description = 'Esta ação não pode ser desfeita. Isso excluirá permanentemente este registro e todos os dados associados a ele nos nossos servidores.',
  isDeleting = false,
}: DeleteAlertModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-brand-text">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-brand-muted">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Não, cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
            Sim, excluir
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
