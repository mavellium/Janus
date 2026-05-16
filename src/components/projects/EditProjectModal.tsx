'use client'

import { useActionState, useEffect, useTransition } from 'react'
import { Edit, Loader2 } from 'lucide-react'
import { updateProject } from '@/modules/projects/actions/updateProject'

interface EditProjectModalProps {
  projectId: string
  initialName: string
  initialPreviewUrl?: string | null
  companySlug: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

type FormState = { error?: string; success?: boolean }

async function formAction(prevState: FormState, formData: FormData): Promise<FormState> {
  const projectId = formData.get('projectId') as string
  const name = formData.get('name') as string
  const companySlug = formData.get('companySlug') as string
  const previewUrl = formData.get('previewUrl') as string

  if (!name?.trim()) return { error: 'Nome do projeto é obrigatório' }

  const result = await updateProject({
    projectId,
    name: name.trim(),
    companySlug,
    previewUrl: previewUrl ? previewUrl.trim() : null,
  })

  if (!result.ok) return { error: result.error || 'Erro ao atualizar projeto' }
  return { success: true }
}

export function EditProjectModal({
  projectId,
  initialName,
  initialPreviewUrl,
  companySlug,
  open,
  onOpenChange,
}: EditProjectModalProps) {
  const [state, action, pending] = useActionState(formAction, {})
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (state.success) onOpenChange(false)
  }, [state.success, onOpenChange])


  return (
    open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
        <div className="relative bg-card rounded-xl shadow-lg p-4 sm:p-6 w-[95vw] max-w-md max-h-[90vh] overflow-y-auto mx-4 border border-brand-btn-light">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-brand-text">Editar Projeto</h2>
          </div>
          <form action={action} className="space-y-4">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="companySlug" value={companySlug} />

            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-brand-text mb-1">
                Nome do Projeto
              </label>
              <input
                id="name"
                name="name"
                type="text"
                defaultValue={initialName}
                placeholder="Nome do projeto"
                required
                disabled={pending}
                className="flex h-10 w-full rounded-md border border-brand-btn-light bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="previewUrl" className="block text-sm font-medium text-brand-text mb-1">
                URL de Preview do Site
              </label>
              <input
                id="previewUrl"
                name="previewUrl"
                type="text"
                defaultValue={initialPreviewUrl || ''}
                placeholder="Ex: https://meusite.com/api/preview"
                disabled={pending}
                className="flex h-10 w-full rounded-md border border-brand-btn-light bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {state.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={pending}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition border border-brand-btn-light text-brand-text hover:bg-brand-btn-light/40 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pending}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition bg-brand-cta text-white hover:bg-brand-cta-hover disabled:opacity-50"
              >
                {pending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2 inline" />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  )
}
