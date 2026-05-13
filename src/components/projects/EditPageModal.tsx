'use client'

import { useActionState, useEffect } from 'react'
import { Edit, Loader2 } from 'lucide-react'
import { updatePage } from '@/modules/projects/actions/updatePage'

interface EditPageModalProps {
  pageId: string
  initialName: string
  initialSlug: string
  initialPreviewUrl?: string
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

type FormState = { error?: string; success?: boolean }

async function formAction(prevState: FormState, formData: FormData): Promise<FormState> {
  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const previewUrl = formData.get('previewUrl') as string
  const pageId = formData.get('pageId') as string
  const projectId = formData.get('projectId') as string

  if (!name?.trim()) {
    return { error: 'Nome da página é obrigatório' }
  }

  if (!slug?.trim()) {
    return { error: 'URL da página é obrigatório' }
  }

  const result = await updatePage({
    pageId,
    name: name.trim(),
    slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    projectId,
    previewUrl: previewUrl?.trim() || undefined,
  })

  if (!result.ok) {
    return { error: result.error || 'Erro ao atualizar página' }
  }

  return { success: true }
}

export function EditPageModal({
  pageId,
  initialName,
  initialSlug,
  initialPreviewUrl,
  projectId,
  open,
  onOpenChange,
}: EditPageModalProps) {
  const [state, action, pending] = useActionState(formAction, {})

  useEffect(() => {
    if (state.success) {
      onOpenChange(false)
    }
  }, [state.success, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative bg-card rounded-xl shadow-lg p-4 sm:p-6 w-[95vw] max-w-md max-h-[90vh] overflow-y-auto mx-4 border border-brand-btn-light">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-brand-text">Editar Página</h2>
        </div>
        <form action={action} className="space-y-4">
          <input type="hidden" name="pageId" value={pageId} />
          <input type="hidden" name="projectId" value={projectId} />

          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-brand-text mb-1">
              Nome da Página
            </label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={initialName}
              placeholder="Nome da página"
              required
              disabled={pending}
              className="flex h-10 w-full rounded-md border border-brand-btn-light bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="slug" className="block text-sm font-medium text-brand-text mb-1">
              Slug (URL)
            </label>
            <input
              id="slug"
              name="slug"
              type="text"
              defaultValue={initialSlug}
              placeholder="Ex: home"
              required
              disabled={pending}
              className="flex h-10 w-full rounded-md border border-brand-btn-light bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-brand-muted mt-1">
              Alterar o slug muda a URL da API pública.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="previewUrl" className="block text-sm font-medium text-brand-text mb-1">
              URL de Preview
            </label>
            <input
              id="previewUrl"
              name="previewUrl"
              type="url"
              defaultValue={initialPreviewUrl}
              placeholder="https://..."
              disabled={pending}
              className="flex h-10 w-full rounded-md border border-brand-btn-light bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-brand-muted mt-1">
              URL do iframe de preview para esta página específica.
            </p>
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
}
