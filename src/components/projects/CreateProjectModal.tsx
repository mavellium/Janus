'use client'

import { useState, useEffect, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'
import { createProject } from '@/modules/projects/actions/createProject'

interface CreateProjectModalProps {
  type: 'LANDING_PAGE' | 'INSTITUTIONAL'
  companySlug: string
  trigger: React.ReactNode
}

type FormState = { error?: string; success?: boolean; projectId?: string; pageId?: string }

async function formAction(prevState: FormState, formData: FormData): Promise<FormState> {
  const name = formData.get('name') as string
  const type = formData.get('type') as 'LANDING_PAGE' | 'INSTITUTIONAL'
  const companySlug = formData.get('companySlug') as string

  if (!name?.trim()) {
    return { error: 'Nome do projeto é obrigatório' }
  }

  const result = await createProject({ name: name.trim(), type, companySlug })
  
  if (!result.ok) {
    return { error: result.error || 'Erro ao criar projeto' }
  }

  return { 
    success: true, 
    projectId: result.data?.projectId, 
    pageId: result.data?.pageId 
  }
}

export function CreateProjectModal({
  type,
  companySlug,
  trigger,
}: CreateProjectModalProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const [state, action, pending] = useActionState(formAction, {})

  useEffect(() => {
    if (state.success && state.projectId) {
      const basePath = type === 'LANDING_PAGE'
        ? `/${companySlug}/dashboard/landing-pages/${state.projectId}/pages`
        : `/${companySlug}/dashboard/sites/${state.projectId}/pages`

      router.push(basePath)
    }
  }, [state.success, state.projectId, type, companySlug, router])

  const typeLabel = type === 'LANDING_PAGE' ? 'Landing Page' : 'Site'

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger}
      </div>
      
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-card rounded-xl shadow-lg p-4 sm:p-6 w-[95vw] max-w-md max-h-[90vh] overflow-y-auto mx-4 border border-brand-btn-light">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-brand-text">Nova {typeLabel}</h2>
            </div>
            <form action={action} className="space-y-4">
              <input type="hidden" name="type" value={type} />
              <input type="hidden" name="companySlug" value={companySlug} />
              
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-brand-text mb-1">
                  Nome do Projeto
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Meu Projeto"
                  required
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
                  onClick={() => setOpen(false)}
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
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2 inline" />
                      Criar {typeLabel}
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
