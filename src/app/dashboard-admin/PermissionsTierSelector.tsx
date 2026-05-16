'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { FileText, Layers } from 'lucide-react'

interface Props {
  open: boolean
  module: 'sites' | 'landingPages'
  onSelectTier: (tier: 'project' | 'page') => void
  onClose: () => void
}

export function PermissionsTierSelector({ open, module, onSelectTier, onClose }: Props) {
  const moduleLabel = module === 'sites' ? 'Sites' : 'Landing Pages'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-brand-text flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-primary" />
            Tipo de Permissão — {moduleLabel}
          </DialogTitle>
          <DialogDescription className="text-brand-muted text-xs">
            Selecione qual tipo de permissão deseja gerenciar
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onSelectTier('project')}
            className="flex flex-col items-center gap-3 p-4 rounded-lg border-2 border-brand-btn-light bg-brand-bg/40 hover:border-brand-primary hover:bg-brand-primary/5 transition-colors cursor-pointer"
          >
            <Layers className="w-6 h-6 text-brand-primary" />
            <div className="text-center">
              <p className="text-sm font-medium text-brand-text">Permissões de Projeto</p>
              <p className="text-xs text-brand-muted mt-1">Criar, editar, deletar {moduleLabel.toLowerCase()}</p>
            </div>
          </button>

          <button
            onClick={() => onSelectTier('page')}
            className="flex flex-col items-center gap-3 p-4 rounded-lg border-2 border-brand-btn-light bg-brand-bg/40 hover:border-brand-primary hover:bg-brand-primary/5 transition-colors cursor-pointer"
          >
            <FileText className="w-6 h-6 text-brand-primary" />
            <div className="text-center">
              <p className="text-sm font-medium text-brand-text">Permissões de Página</p>
              <p className="text-xs text-brand-muted mt-1">Criar, editar, construir páginas</p>
            </div>
          </button>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
