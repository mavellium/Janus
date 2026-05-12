'use client'

import { useState, useTransition } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { createPage } from '@/modules/projects/actions/createPage'

interface CreatePageModalProps {
  projectId: string
  companySlug: string
}

export function CreatePageModal({ projectId, companySlug }: CreatePageModalProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function generateSlug(value: string) {
    return value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setName(value)
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value))
    }
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await createPage({
        projectId,
        name: name.trim(),
        slug: slug.trim(),
        companySlug,
        previewUrl: previewUrl.trim() || undefined,
      })

      if (result.ok) {
        setOpen(false)
        setName('')
        setSlug('')
        setPreviewUrl('')
      } else {
        setError(result.error ?? 'Erro ao criar página')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-6 py-2 rounded-lg text-sm font-semibold text-white transition bg-brand-primary hover:bg-brand-hover"
      >
        Nova Página
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => !isPending && setOpen(false)} />
          <div className="relative bg-card rounded-lg shadow-lg p-6 w-full max-w-md mx-4 border border-brand-btn-light">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-brand-text">Nova Página</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="pageName" className="block text-sm font-medium text-brand-text mb-1">
                  Nome da Página
                </label>
                <input
                  id="pageName"
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="Ex: Página Inicial"
                  required
                  disabled={isPending}
                  className="flex h-10 w-full rounded-md border border-brand-btn-light bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="pageSlug" className="block text-sm font-medium text-brand-text mb-1">
                  Slug (URL)
                </label>
                <input
                  id="pageSlug"
                  type="text"
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); setError(null) }}
                  placeholder="Ex: home"
                  required
                  disabled={isPending}
                  className="flex h-10 w-full rounded-md border border-brand-btn-light bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="pagePreviewUrl" className="block text-sm font-medium text-brand-text mb-1">
                  URL de Preview (opcional)
                </label>
                <input
                  id="pagePreviewUrl"
                  type="url"
                  value={previewUrl}
                  onChange={(e) => { setPreviewUrl(e.target.value); setError(null) }}
                  placeholder="https://..."
                  disabled={isPending}
                  className="flex h-10 w-full rounded-md border border-brand-btn-light bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-xs text-brand-muted mt-1">
                  URL do iframe de preview para esta página.
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition border border-brand-btn-light text-brand-text hover:bg-brand-btn-light/40 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || !name.trim() || !slug.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition bg-brand-primary text-white hover:bg-brand-hover disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2 inline" />
                      Criar
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
