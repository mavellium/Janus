'use client'

import { useState, useActionState } from 'react'
import { Edit, Loader2 } from 'lucide-react'
import { updatePage } from '@/modules/projects/actions/updatePage'

interface EditPageModalProps {
  pageId: string
  initialName: string
  initialSlug: string
  projectId: string
  trigger: React.ReactNode
}

type FormState = { error?: string; success?: boolean }

async function formAction(prevState: FormState, formData: FormData): Promise<FormState> {
  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
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
    projectId 
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
  projectId,
  trigger,
}: EditPageModalProps) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(formAction, {})

  if (state.success) {
    setOpen(false)
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger}
      </div>
      
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-brand-bg rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
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
                  className="flex h-10 w-full rounded-md border border-brand-muted bg-brand-bg px-3 py-2 text-sm placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="slug" className="block text-sm font-medium text-brand-text mb-1">
                  URL da Página
                </label>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  defaultValue={initialSlug}
                  placeholder="/url-da-pagina"
                  required
                  disabled={pending}
                  className="flex h-10 w-full rounded-md border border-brand-muted bg-brand-bg px-3 py-2 text-sm placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              
              {state.error && (
                <p className="text-sm text-red-600">{state.error}</p>
              )}
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition border border-brand-muted text-brand-text hover:bg-brand-muted/20 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition bg-brand-primary text-brand-bg hover:bg-brand-hover disabled:opacity-50"
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
      )}
    </>
  )
}
