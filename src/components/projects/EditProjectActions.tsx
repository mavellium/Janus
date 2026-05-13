'use client'

import { useState, useTransition } from 'react'
import { Settings, Loader2 } from 'lucide-react'
import { updateProject } from '@/modules/projects/actions/updateProject'

interface EditProjectActionsProps {
  projectId: string
  initialName: string
  companySlug: string
}

export function EditProjectActions({
  projectId,
  initialName,
  companySlug,
}: EditProjectActionsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    if (!name.trim()) return

    startTransition(async () => {
      const result = await updateProject({
        projectId,
        name: name.trim(),
        companySlug,
      })

      if (result.ok) {
        setIsEditing(false)
      }
    })
  }

  function handleCancel() {
    setName(initialName)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex-1 flex items-center gap-1">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') handleCancel()
          }}
          className="flex-1 px-2 py-1.5 text-xs rounded border border-brand-muted bg-brand-bg focus:outline-none focus:ring-1 focus:ring-brand-primary"
          autoFocus
        />
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-2 py-1.5 text-xs rounded bg-brand-cta text-white hover:bg-brand-cta-hover disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Salvar'}
        </button>
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="px-2 py-1.5 text-xs rounded border border-brand-muted text-brand-text hover:bg-brand-muted/20 disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold text-white transition flex items-center justify-center gap-2 bg-brand-cta hover:bg-brand-cta-hover"
    >
      <Settings className="w-3 h-3" />
      Editar
    </button>
  )
}
