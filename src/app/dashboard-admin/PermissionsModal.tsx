'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, Loader2, Globe, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { updateUserPermissions } from '@/modules/admin/actions/updateUserPermissions'

const PERMISSION_LABELS: Record<string, { label: string; description: string }> = {
  PROJECT_CREATE: { label: 'Criar Projeto', description: 'Permite criar novos sites/landing pages.' },
  PROJECT_EDIT: { label: 'Editar Projeto', description: 'Permite editar sites/landing pages existentes.' },
  PROJECT_DELETE: { label: 'Deletar Projeto', description: 'Permite deletar sites/landing pages.' },
  PAGE_CREATE: { label: 'Criar Páginas', description: 'Permite criar novas páginas.' },
  PAGE_DELETE: { label: 'Excluir Páginas', description: 'Permite excluir páginas existentes.' },
  PAGE_BUILD: { label: 'Construir Páginas (CMS)', description: 'Acesso ao construtor de schema das páginas.' },
  BLOG_MANAGE: { label: 'Gerenciar Blog', description: 'Permite criar, editar e excluir posts do blog.' },
  GUEST_MANAGE: { label: 'Gerenciar Convidados', description: 'Permite gerenciar acessos e postagens de convidados.' },
  TEAM_MANAGE: { label: 'Gerenciar Equipe', description: 'Permite criar e excluir usuários da empresa.' },
}

const PROJECT_TIER_PERMISSIONS = ['PROJECT_CREATE', 'PROJECT_EDIT', 'PROJECT_DELETE']
const PAGE_TIER_PERMISSIONS = ['PAGE_CREATE', 'PAGE_DELETE', 'PAGE_BUILD', 'BLOG_MANAGE', 'GUEST_MANAGE', 'TEAM_MANAGE']

const ALL_KEYS = Object.keys(PERMISSION_LABELS)
type PermissionTier = 'project' | 'page'
type ModuleType = 'sites' | 'landingPages'

interface Props {
  userId: string
  userName: string
  initialPermissions?: string | string[] | Record<string, Record<string, string[]>>
  module: ModuleType
  onClose: () => void
}

function normalizePermissions(
  permissions?: string | string[] | Record<string, Record<string, string[]>>
): Record<ModuleType, Record<PermissionTier, string[]>> {
  if (!permissions) {
    return {
      sites: { project: [], page: [] },
      landingPages: { project: [], page: [] },
    }
  }

  if (typeof permissions === 'string' && permissions.startsWith('{')) {
    try {
      const parsed = JSON.parse(permissions)
      if (
        parsed.sites &&
        parsed.landingPages &&
        parsed.sites.project &&
        parsed.sites.page
      ) {
        return parsed
      }
    } catch {
      return {
        sites: { project: [], page: [] },
        landingPages: { project: [], page: [] },
      }
    }
  }

  if (Array.isArray(permissions)) {
    const result: Record<ModuleType, Record<PermissionTier, string[]>> = {
      sites: { project: [], page: [] },
      landingPages: { project: [], page: [] },
    }

    for (const perm of permissions) {
      if (perm.startsWith('sites:project:')) {
        result.sites.project.push(perm.substring(14))
      } else if (perm.startsWith('sites:page:')) {
        result.sites.page.push(perm.substring(11))
      } else if (perm.startsWith('sites:')) {
        // Legacy format
        result.sites.page.push(perm.substring(6))
      } else if (perm.startsWith('landingPages:project:')) {
        result.landingPages.project.push(perm.substring(20))
      } else if (perm.startsWith('landingPages:page:')) {
        result.landingPages.page.push(perm.substring(17))
      } else if (perm.startsWith('landingPages:')) {
        // Legacy format
        result.landingPages.page.push(perm.substring(13))
      } else {
        // Legacy: simple permission applies to both modules, page tier
        result.sites.page.push(perm)
        result.landingPages.page.push(perm)
      }
    }
    return result
  }

  if (typeof permissions === 'object') {
    return permissions as Record<ModuleType, Record<PermissionTier, string[]>>
  }

  return {
    sites: { project: [], page: [] },
    landingPages: { project: [], page: [] },
  }
}

export function PermissionsModal({
  userId,
  userName,
  initialPermissions,
  module,
  onClose,
}: Props) {
  const router = useRouter()
  const normalized = normalizePermissions(initialPermissions)
  const [sitePerms, setSitePerms] = useState<Record<PermissionTier, Set<string>>>({
    project: new Set(normalized.sites.project),
    page: new Set(normalized.sites.page),
  })
  const [lpPerms, setLPPerms] = useState<Record<PermissionTier, Set<string>>>({
    project: new Set(normalized.landingPages.project),
    page: new Set(normalized.landingPages.page),
  })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const currentModulePerms = module === 'sites' ? sitePerms : lpPerms
  const setCurrentModulePerms = module === 'sites' ? setSitePerms : setLPPerms

  function toggle(tier: PermissionTier, key: string, checked: boolean) {
    setCurrentModulePerms((prev) => ({
      ...prev,
      [tier]: new Set(
        checked ? new Set([...prev[tier], key]) : new Set([...prev[tier]].filter((p) => p !== key))
      ),
    }))
  }

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const sitePermsArray = [
        ...Array.from(sitePerms.project).map((p) => `sites:project:${p}`),
        ...Array.from(sitePerms.page).map((p) => `sites:page:${p}`),
      ]
      const lpPermsArray = [
        ...Array.from(lpPerms.project).map((p) => `landingPages:project:${p}`),
        ...Array.from(lpPerms.page).map((p) => `landingPages:page:${p}`),
      ]

      const result = await updateUserPermissions({
        userId,
        permissions: [...sitePermsArray, ...lpPermsArray],
      })
      if (!result.ok) {
        setError(result.error ?? 'Erro ao salvar permissões.')
        return
      }
      router.refresh()
      onClose()
    })
  }

  const moduleLabel = module === 'sites' ? 'Sites' : 'Landing Pages'
  const moduleIcon = module === 'sites' ? <Globe className="w-4 h-4" /> : <Zap className="w-4 h-4" />

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-brand-text flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-brand-primary" />
            Permissões — {moduleIcon} {moduleLabel}
          </DialogTitle>
          <DialogDescription className="text-brand-muted text-xs">
            {userName} — {moduleLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto pr-1">
          {/* Seção de Permissões Gerais (Project) */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold text-brand-text">Permissões Gerais</h3>
              <p className="text-xs text-brand-muted">Criar, editar e deletar {moduleLabel.toLowerCase()}</p>
            </div>
            <div className="flex flex-col gap-2">
              {PROJECT_TIER_PERMISSIONS.map((key) => {
                const meta = PERMISSION_LABELS[key]
                const checked = currentModulePerms.project.has(key)
                return (
                  <div
                    key={key}
                    className="flex items-start justify-between gap-3 p-3 rounded-lg border border-brand-btn-light bg-brand-bg/40"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-text">{meta.label}</p>
                      <p className="text-xs text-brand-muted mt-0.5">{meta.description}</p>
                    </div>
                    <Switch
                      checked={checked}
                      onCheckedChange={(v) => toggle('project', key, v)}
                      disabled={isPending}
                      aria-label={meta.label}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Divisor */}
          <div className="border-t border-brand-btn-light" />

          {/* Seção de Permissões de Páginas */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold text-brand-text">Permissões de Páginas</h3>
              <p className="text-xs text-brand-muted">Gerenciar páginas dentro dos {moduleLabel.toLowerCase()}</p>
            </div>
            <div className="flex flex-col gap-2">
              {PAGE_TIER_PERMISSIONS.map((key) => {
                const meta = PERMISSION_LABELS[key]
                const checked = currentModulePerms.page.has(key)
                return (
                  <div
                    key={key}
                    className="flex items-start justify-between gap-3 p-3 rounded-lg border border-brand-btn-light bg-brand-bg/40"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-text">{meta.label}</p>
                      <p className="text-xs text-brand-muted mt-0.5">{meta.description}</p>
                    </div>
                    <Switch
                      checked={checked}
                      onCheckedChange={(v) => toggle('page', key, v)}
                      disabled={isPending}
                      aria-label={meta.label}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {error && (
          <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
            Salvar Permissões
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
