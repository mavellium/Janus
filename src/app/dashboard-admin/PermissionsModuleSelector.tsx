'use client'

import { Globe, Zap } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface PermissionsModuleSelectorProps {
  userId: string
  userName: string
  open: boolean
  onClose: () => void
  onSelectModule: (module: 'sites' | 'landingPages') => void
}

export function PermissionsModuleSelector({
  userId,
  userName,
  open,
  onClose,
  onSelectModule,
}: PermissionsModuleSelectorProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-brand-text">Gerenciar Permissões — {userName}</DialogTitle>
          <DialogDescription className="text-brand-muted">
            Escolha o módulo para configurar permissões
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-6">
          <button
            onClick={() => {
              onSelectModule('sites')
              onClose()
            }}
            className="p-6 rounded-lg border-2 border-brand-btn-light hover:border-brand-primary hover:bg-brand-btn-light/40 transition flex flex-col items-center gap-3 text-center group"
          >
            <Globe className="w-8 h-8 text-brand-muted group-hover:text-brand-primary transition" />
            <div>
              <p className="font-semibold text-brand-text">Sites</p>
              <p className="text-xs text-brand-muted mt-1">Projetos Institucionais</p>
            </div>
          </button>

          <button
            onClick={() => {
              onSelectModule('landingPages')
              onClose()
            }}
            className="p-6 rounded-lg border-2 border-brand-btn-light hover:border-brand-primary hover:bg-brand-btn-light/40 transition flex flex-col items-center gap-3 text-center group"
          >
            <Zap className="w-8 h-8 text-brand-muted group-hover:text-brand-primary transition" />
            <div>
              <p className="font-semibold text-brand-text">Landing Pages</p>
              <p className="text-xs text-brand-muted mt-1">Campanhas e Promoções</p>
            </div>
          </button>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-brand-btn-light">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
