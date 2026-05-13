'use client'

import { useState, useTransition } from 'react'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { softDeleteProject } from '@/modules/projects/actions/softDeleteProject'
import { useToast } from '@/hooks/use-toast'
import { ToastContainer } from '@/components/ui/toast-container'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface DeleteProjectModalProps {
  projectId: string
  projectName: string
  companySlug: string
}

export function DeleteProjectModal({ projectId, projectName, companySlug }: DeleteProjectModalProps) {
  const [open, setOpen] = useState(false)
  const [userName, setUserName] = useState('')
  const [reason, setReason] = useState('')
  const [hasConsent, setHasConsent] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toasts, toast, removeToast } = useToast()

  const isDisabled = !userName.trim() || !reason.trim() || !hasConsent || isPending

  function handleSubmit() {
    startTransition(async () => {
      const result = await softDeleteProject({ projectId, userName, reason, companySlug })
      if (result.ok) {
        toast({ message: 'Projeto inativado com sucesso', type: 'success' })
        setOpen(false)
        setUserName('')
        setReason('')
        setHasConsent(false)
      } else {
        toast({ message: result.error || 'Erro ao inativar projeto', type: 'error' })
      }
    })
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true) }}
        className="p-2 rounded-lg text-brand-muted hover:text-destructive hover:bg-destructive/10 transition"
        title="Inativar projeto"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-card rounded-xl shadow-lg p-4 sm:p-6 w-[95vw] max-w-md max-h-[90vh] overflow-y-auto mx-4 border border-brand-btn-light">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-destructive/15 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-destructive">Inativar Projeto</h2>
                <p className="text-xs text-brand-muted">{projectName}</p>
              </div>
            </div>

            <p className="text-sm text-brand-muted mb-6">
              Esta ação irá inativar o projeto. Ele não aparecerá mais nas listagens, mas seus dados serão preservados.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">
                  Seu Nome
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Nome completo para registro de auditoria"
                  disabled={isPending}
                  className="flex h-10 w-full rounded-md border border-brand-btn-light bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-destructive disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">
                  Motivo da exclusão
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Descreva o motivo da inativação..."
                  rows={3}
                  disabled={isPending}
                  className="flex w-full rounded-md border border-brand-btn-light bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-destructive disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>

              <div className="flex items-start space-x-3 pt-4 pb-2 bg-destructive/10 rounded-lg p-3 border border-destructive/30">
                <Checkbox
                  id="consent"
                  checked={hasConsent}
                  onCheckedChange={(checked) => setHasConsent(checked as boolean)}
                  disabled={isPending}
                  className="mt-0.5 w-5 h-5 bg-brand-bg border-2 border-brand-text data-[state=checked]:bg-brand-bg data-[state=checked]:border-brand-text"
                />
                <Label
                  htmlFor="consent"
                  className="text-sm font-medium text-destructive leading-relaxed cursor-pointer"
                >
                  Eu aceito inativar este projeto e compreendo que ele deixará de ser exibido na listagem.
                </Label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition border border-brand-btn-light text-brand-text hover:bg-brand-btn-light/40 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isDisabled}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition bg-destructive text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                      Inativando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2 inline" />
                      Excluir Projeto
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
