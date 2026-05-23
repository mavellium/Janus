'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { Edit, Loader2, Code2, Copy, RefreshCw, CheckCircle2, AlertCircle, Clock, BookOpen } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { updateProject } from '@/modules/projects/actions/updateProject'

interface EditProjectModalProps {
  projectId: string
  initialName: string
  initialPreviewUrl?: string | null
  initialBlogEnabled?: boolean
  canManageBlog?: boolean
  initialCmsEnabled?: boolean
  initialCmsSyncScriptUrl?: string | null
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
  const blogEnabled = formData.get('blogEnabled') === 'on'
  const cmsEnabled = formData.get('cmsEnabled') === 'on'

  if (!name?.trim()) return { error: 'Nome do projeto é obrigatório' }

  const result = await updateProject({
    projectId,
    name: name.trim(),
    companySlug,
    previewUrl: previewUrl ? previewUrl.trim() : null,
    blogEnabled,
    cmsEnabled,
  })

  if (!result.ok) return { error: result.error || 'Erro ao atualizar projeto' }
  return { success: true }
}

export function EditProjectModal({
  projectId,
  initialName,
  initialPreviewUrl,
  initialBlogEnabled,
  canManageBlog,
  initialCmsEnabled,
  initialCmsSyncScriptUrl,
  companySlug,
  open,
  onOpenChange,
}: EditProjectModalProps) {
  const [state, action, pending] = useActionState(formAction, {})
  const [, startTransition] = useTransition()
  const [blogEnabled, setBlogEnabled] = useState(initialBlogEnabled || false)
  const [cmsEnabled, setCmsEnabled] = useState(initialCmsEnabled || false)
  const [cmsSyncScriptUrl, setCmsSyncScriptUrl] = useState<string | null>(initialCmsSyncScriptUrl ?? null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [scriptActive, setScriptActive] = useState<boolean | null>(null)
  const [scriptFeedback, setScriptFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [skipNextCheck, setSkipNextCheck] = useState(false)

  useEffect(() => {
    if (state.success) onOpenChange(false)
  }, [state.success, onOpenChange])

  useEffect(() => {
    if (!open || !cmsEnabled || !cmsSyncScriptUrl) return
    checkScriptStatus()
  }, [open])

  useEffect(() => {
    if (!cmsEnabled || !cmsSyncScriptUrl) return
    if (skipNextCheck) { setSkipNextCheck(false); return }
    checkScriptStatus()
  }, [cmsSyncScriptUrl])

  async function checkScriptStatus() {
    setIsChecking(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/check-script`)
      const data = await res.json() as { ok: boolean; active?: boolean }
      if (data.ok) setScriptActive(data.active ?? false)
    } catch {
      setScriptActive(false)
    } finally {
      setIsChecking(false)
    }
  }

  async function handleGenerateScript() {
    setIsGenerating(true)
    setScriptFeedback(null)
    setScriptActive(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/generate-script`, { method: 'POST' })
      const data = await res.json() as { ok: boolean; url?: string; error?: string }
      if (data.ok && data.url) {
        setSkipNextCheck(true)
        setCmsSyncScriptUrl(data.url)
        setScriptFeedback({ type: 'success', message: 'Script gerado! Atualize a tag no seu site e clique em verificar.' })
        setTimeout(() => setScriptFeedback(null), 6000)
      } else {
        setScriptFeedback({ type: 'error', message: data.error ?? 'Erro ao gerar script' })
      }
    } catch {
      setScriptFeedback({ type: 'error', message: 'Erro de conexão' })
    } finally {
      setIsGenerating(false)
    }
  }

  function handleCopyTag() {
    if (!cmsSyncScriptUrl) return
    navigator.clipboard.writeText(`<script src="${cmsSyncScriptUrl}" defer></script>`)
    setScriptFeedback({ type: 'success', message: 'Tag copiada!' })
    setTimeout(() => setScriptFeedback(null), 3000)
  }

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
            <input type="hidden" name="cmsEnabled" value={cmsEnabled ? 'on' : ''} />

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
                placeholder="Ex: https://meusite.com"
                disabled={pending}
                className="flex h-10 w-full rounded-md border border-brand-btn-light bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {canManageBlog && (
              <div className="rounded-lg border border-brand-btn-light overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-brand-btn-light/30">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-brand-primary" />
                    <div>
                      <label htmlFor="blogEnabled" className="text-sm font-medium text-brand-text">
                        Módulo Blog
                      </label>
                      <p className="text-xs text-brand-muted mt-0.5">
                        Gerenciamento de posts e categorias
                      </p>
                    </div>
                  </div>
                  <input type="hidden" name="blogEnabled" value={blogEnabled ? 'on' : ''} />
                  <Switch
                    id="blogEnabled"
                    checked={blogEnabled}
                    onCheckedChange={setBlogEnabled}
                    disabled={pending}
                  />
                </div>
              </div>
            )}

            <div className="rounded-lg border border-brand-btn-light overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-brand-btn-light/30">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-brand-primary" />
                  <div>
                    <p className="text-sm font-medium text-brand-text">Módulo CMS Avançado</p>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Sincronize conteúdo no seu site via script externo
                    </p>
                  </div>
                </div>
                <Switch
                  id="cmsEnabled"
                  checked={cmsEnabled}
                  onCheckedChange={setCmsEnabled}
                  disabled={pending}
                />
              </div>

              {cmsEnabled && (
                <div className="p-3 space-y-3 border-t border-brand-btn-light">
                  <div className="flex items-center gap-2">
                    {isChecking ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-muted" />
                    ) : scriptActive === true ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-yellow-500" />
                    )}
                    <span className={`text-xs font-medium ${
                      isChecking ? 'text-brand-muted' :
                      scriptActive === true ? 'text-green-600 dark:text-green-400' :
                      'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {isChecking ? 'Verificando...' : scriptActive === true ? 'Script Ativo' : 'Script Pendente'}
                    </span>
                    {!isChecking && cmsSyncScriptUrl && (
                      <button
                        type="button"
                        onClick={checkScriptStatus}
                        className="ml-auto p-1 rounded hover:bg-brand-btn-light/40 text-brand-muted hover:text-brand-text transition"
                        title="Verificar novamente"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {cmsSyncScriptUrl ? (
                    <div className="space-y-2">
                      <p className="text-[10px] text-brand-muted uppercase tracking-wide font-semibold">Tag para seu HTML</p>
                      <div className="relative group">
                        <pre className="text-[10px] bg-brand-bg border border-border rounded p-2 pr-10 overflow-x-auto text-brand-text font-mono whitespace-pre-wrap break-all leading-relaxed">
                          {`<script src="${cmsSyncScriptUrl}" defer></script>`}
                        </pre>
                        <button
                          type="button"
                          onClick={handleCopyTag}
                          className="absolute top-1.5 right-1.5 p-1.5 rounded bg-brand-primary text-white hover:bg-brand-hover transition"
                          title="Copiar tag"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateScript}
                        disabled={isGenerating}
                        className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-text transition disabled:opacity-60"
                        title="Regerar script na CDN"
                      >
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        {isGenerating ? 'Gerando...' : 'Regerar script'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGenerateScript}
                      disabled={isGenerating}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium bg-brand-primary text-white hover:bg-brand-hover transition disabled:opacity-60"
                    >
                      {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Code2 className="w-3.5 h-3.5" />}
                      {isGenerating ? 'Gerando...' : 'Gerar Script CDN'}
                    </button>
                  )}

                  {scriptFeedback && (
                    <p className={`text-xs flex items-center gap-1.5 ${scriptFeedback.type === 'success' ? 'text-brand-primary' : 'text-destructive'}`}>
                      {scriptFeedback.type === 'success'
                        ? <CheckCircle2 className="w-3 h-3 shrink-0" />
                        : <AlertCircle className="w-3 h-3 shrink-0" />}
                      {scriptFeedback.message}
                    </p>
                  )}
                </div>
              )}
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
