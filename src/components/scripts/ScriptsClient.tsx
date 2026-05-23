'use client'

import { useActionState, useState, useTransition, useEffect } from 'react'
import { Code2, Plus, Pencil, Trash2, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { createScript } from '@/modules/scripts/actions/createScript'
import { updateScript } from '@/modules/scripts/actions/updateScript'
import { deleteScript } from '@/modules/scripts/actions/deleteScript'
import { toggleScript } from '@/modules/scripts/actions/toggleScript'
import type { SiteScriptRow } from '@/modules/scripts/queries/getScriptsByProjectId'

interface ScriptsClientProps {
  scripts: SiteScriptRow[]
  projectId: string
  companySlug: string
}

type FormState = { ok?: boolean; error?: string }

const POSITION_LABELS: Record<string, string> = {
  HEAD: '<head>',
  BODY_END: 'Final do <body>',
}

function ScriptModal({
  open,
  onClose,
  projectId,
  companySlug,
  script,
}: {
  open: boolean
  onClose: () => void
  projectId: string
  companySlug: string
  script?: SiteScriptRow
}) {
  const isEdit = !!script

  async function formAction(_: FormState, formData: FormData): Promise<FormState> {
    const result = isEdit
      ? await updateScript(_, formData)
      : await createScript(_, formData)
    if (result.ok) { onClose(); return { ok: true } }
    return { ok: false, error: result.error }
  }

  const [state, action, pending] = useActionState(formAction, {})

  useEffect(() => {
    if (state.ok) onClose()
  }, [state.ok, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-xl shadow-lg p-6 w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto mx-4 border border-brand-btn-light">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-brand-primary" />
            <h2 className="text-base font-semibold text-brand-text">
              {isEdit ? 'Editar Script' : 'Novo Script'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-brand-btn-light/40 text-brand-muted hover:text-brand-text transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form action={action} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={script.id} />}
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="companySlug" value={companySlug} />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-brand-text">Nome</label>
            <input
              name="name"
              type="text"
              defaultValue={script?.name ?? ''}
              placeholder="Ex: Google Analytics, Meta Pixel"
              required
              disabled={pending}
              className="flex h-10 w-full rounded-md border border-brand-btn-light bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-brand-text">Posição</label>
            <select
              name="position"
              defaultValue={script?.position ?? 'HEAD'}
              disabled={pending}
              className="flex h-10 w-full rounded-md border border-brand-btn-light bg-brand-bg px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50"
            >
              <option value="HEAD">{'<head>'}</option>
              <option value="BODY_END">Final do {'<body>'}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-brand-text">Código / Tag</label>
            <textarea
              name="code"
              defaultValue={script?.code ?? ''}
              placeholder={'<script>\n  // Cole aqui o código do script\n</script>'}
              required
              disabled={pending}
              rows={8}
              className="flex w-full rounded-md border border-brand-btn-light bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50 font-mono resize-y"
            />
          </div>

          {state.error && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {state.error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-brand-btn-light text-brand-text hover:bg-brand-btn-light/40 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-cta text-white hover:bg-brand-cta-hover transition disabled:opacity-50"
            >
              {pending ? <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" /> : null}
              {pending ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar Script'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteConfirm({
  script,
  companySlug,
  onClose,
}: {
  script: SiteScriptRow
  companySlug: string
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteScript({ id: script.id, companySlug })
      if (!result.ok) setError(result.error ?? 'Erro ao excluir')
      else onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-xl shadow-lg p-6 w-[95vw] max-w-sm mx-4 border border-brand-btn-light">
        <h2 className="text-base font-semibold text-brand-text mb-2">Excluir Script</h2>
        <p className="text-sm text-brand-muted mb-5">
          Tem certeza que deseja excluir <span className="font-medium text-brand-text">{script.name}</span>? Esta ação não pode ser desfeita.
        </p>
        {error && <p className="text-sm text-destructive mb-3">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-brand-btn-light text-brand-text hover:bg-brand-btn-light/40 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-destructive text-white hover:opacity-90 transition disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" /> : null}
            {isPending ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ScriptsClient({ scripts, projectId, companySlug }: ScriptsClientProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editScript, setEditScript] = useState<SiteScriptRow | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<SiteScriptRow | undefined>()
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function handleToggle(script: SiteScriptRow) {
    setTogglingId(script.id)
    startTransition(async () => {
      await toggleScript({ id: script.id, companySlug })
      setTogglingId(null)
    })
  }

  function openCreate() {
    setEditScript(undefined)
    setModalOpen(true)
  }

  function openEdit(script: SiteScriptRow) {
    setEditScript(script)
    setModalOpen(true)
  }

  return (
    <div className="p-6 sm:p-8 w-full">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Scripts</h1>
          <p className="text-sm text-brand-muted mt-1">
            {scripts.length} {scripts.length === 1 ? 'script' : 'scripts'} configurado{scripts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-cta text-white hover:bg-brand-cta-hover transition"
        >
          <Plus className="w-4 h-4" />
          Novo Script
        </button>
      </div>

      {scripts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-brand-btn-light/40 flex items-center justify-center mb-4">
            <Code2 className="w-7 h-7 text-brand-muted" />
          </div>
          <p className="text-base font-semibold text-brand-text mb-1">Nenhum script adicionado</p>
          <p className="text-sm text-brand-muted mb-6 max-w-xs">
            Adicione pixels de rastreamento, analytics ou chat ao seu site sem editar o código-fonte.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-cta text-white hover:bg-brand-cta-hover transition"
          >
            <Plus className="w-4 h-4" />
            Adicionar primeiro script
          </button>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-brand-btn-light overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-brand-btn-light bg-brand-btn-light/20">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide">Nome</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide">Posição</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-brand-muted uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-btn-light">
                {scripts.map((script) => (
                  <tr key={script.id} className="hover:bg-brand-btn-light/10 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <Code2 className="w-4 h-4 text-brand-muted shrink-0" />
                        <span className="text-sm font-medium text-brand-text">{script.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-btn-light/60 text-brand-muted font-mono">
                        {POSITION_LABELS[script.position] ?? script.position}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {togglingId === script.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-brand-muted" />
                        ) : (
                          <Switch
                            checked={script.isActive}
                            onCheckedChange={() => handleToggle(script)}
                            aria-label={`${script.isActive ? 'Desativar' : 'Ativar'} ${script.name}`}
                          />
                        )}
                        <span className={`text-xs font-medium ${script.isActive ? 'text-brand-primary' : 'text-brand-muted'}`}>
                          {script.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(script)}
                          className="p-2 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-btn-light/40 transition"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(script)}
                          className="p-2 rounded-lg text-brand-muted hover:text-destructive hover:bg-destructive/10 transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ScriptModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        projectId={projectId}
        companySlug={companySlug}
        script={editScript}
      />

      {deleteTarget && (
        <DeleteConfirm
          script={deleteTarget}
          companySlug={companySlug}
          onClose={() => setDeleteTarget(undefined)}
        />
      )}
    </div>
  )
}
