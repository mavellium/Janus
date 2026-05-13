'use client'

import { useState, useTransition, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Loader2, BookOpen } from 'lucide-react'
import { updateProjectBlogEnabled } from '@/modules/admin/actions/updateProjectBlogEnabled'

interface Project {
  id: string
  name: string
  type: string
  blogEnabled: boolean
}

interface ProjectsBlogModalProps {
  companyId: string
  companyName: string
  open: boolean
  onClose: () => void
}

export function ProjectsBlogModal({
  companyId,
  companyName,
  open,
  onClose,
}: ProjectsBlogModalProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [projectStates, setProjectStates] = useState<Record<string, boolean>>({})
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch(`/api/dev/companies/${companyId}/projects`)
      .then(r => r.json())
      .then(d => {
        setProjects(d.projects || [])
        setProjectStates(Object.fromEntries((d.projects || []).map((p: Project) => [p.id, p.blogEnabled])))
        setLoading(false)
      })
  }, [open, companyId])

  function handleToggle(projectId: string, enabled: boolean) {
    setProjectStates(prev => ({ ...prev, [projectId]: enabled }))
    startTransition(async () => {
      await updateProjectBlogEnabled(projectId, enabled)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-brand-text flex items-center gap-2">
            <BookOpen size={16} />
            Gerenciar Blog — {companyName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-brand-muted py-6">
              <Loader2 size={14} className="animate-spin" />
              Carregando projetos...
            </div>
          ) : projects.length === 0 ? (
            <p className="text-sm text-brand-muted text-center py-6">
              Nenhum projeto nesta empresa
            </p>
          ) : (
            projects.map(project => (
              <div
                key={project.id}
                className="flex items-center justify-between px-4 py-3 rounded-lg border border-border hover:bg-brand-btn-light/20 transition"
              >
                <div>
                  <p className="text-sm font-medium text-brand-text">{project.name}</p>
                  <p className="text-xs text-brand-muted">
                    {project.type === 'INSTITUTIONAL' ? 'Site Institucional' : 'Landing Page'}
                  </p>
                </div>
                <Switch
                  checked={projectStates[project.id] ?? false}
                  onCheckedChange={v => handleToggle(project.id, v)}
                  disabled={pending}
                />
              </div>
            ))
          )}
        </div>

        {pending && (
          <div className="flex items-center justify-center gap-2 text-xs text-brand-muted py-2">
            <Loader2 size={12} className="animate-spin" />
            Atualizando...
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
