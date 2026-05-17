'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Code2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ToastContainer } from '@/components/ui/toast-container'
import { updateUserPermissions } from '@/modules/admin/actions/updateUserPermissions'
import { useToast } from '@/hooks/use-toast'

const PERMISSION_LABELS: Record<string, { label: string; description: string }> = {
  PROJECT_CREATE: { label: 'Criar Projeto', description: 'Permite criar novos sites/landing pages.' },
  PROJECT_EDIT: { label: 'Editar Projeto', description: 'Permite editar sites/landing pages existentes.' },
  PROJECT_DELETE: { label: 'Deletar Projeto', description: 'Permite deletar sites/landing pages.' },
  PAGE_CREATE: { label: 'Criar Páginas', description: 'Permite criar novas páginas.' },
  PAGE_DELETE: { label: 'Excluir Páginas', description: 'Permite excluir páginas existentes.' },
  PAGE_BUILD: { label: 'Construir Páginas (CMS)', description: 'Acesso ao construtor de schema das páginas.' },
  BLOG_MANAGE: { label: 'Gerenciar Blog', description: 'Permite gerenciar o modulo do blog.' },
  TEAM_MANAGE: { label: 'Gerenciar Equipe', description: 'Permite criar e excluir usuários da empresa.' },
}

const PROJECT_TIER_PERMISSIONS = ['PROJECT_CREATE', 'PROJECT_EDIT', 'PROJECT_DELETE', 'BLOG_MANAGE']
const PAGE_TIER_PERMISSIONS = ['PAGE_CREATE', 'PAGE_DELETE', 'PAGE_BUILD', 'TEAM_MANAGE']

type ModuleType = 'sites' | 'landingPages'
type PermissionTier = 'project' | 'page'

interface Props {
  devId: string
  devName: string
  initialPermissions?: string | string[] | Record<string, Record<string, string[]>>
  initialModule?: ModuleType
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
      if (parsed.sites && parsed.landingPages && parsed.sites.project && parsed.sites.page) {
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
      const cleanPerm = perm.trim()
      if (cleanPerm.startsWith('sites:project:')) {
        const name = cleanPerm.substring(14).replace(/^:+|:+$/g, '').trim()
        if (name) result.sites.project.push(name)
      } else if (cleanPerm.startsWith('sites:page:')) {
        const name = cleanPerm.substring(11).replace(/^:+|:+$/g, '').trim()
        if (name) result.sites.page.push(name)
      } else if (cleanPerm.startsWith('sites:')) {
        const name = cleanPerm.substring(6).replace(/^:+|:+$/g, '').trim()
        if (name) result.sites.page.push(name)
      } else if (cleanPerm.startsWith('landingPages:project:')) {
        const name = cleanPerm.substring(20).replace(/^:+|:+$/g, '').trim()
        if (name) result.landingPages.project.push(name)
      } else if (cleanPerm.startsWith('landingPages:page:')) {
        const name = cleanPerm.substring(17).replace(/^:+|:+$/g, '').trim()
        if (name) result.landingPages.page.push(name)
      } else if (cleanPerm.startsWith('landingPages:')) {
        const name = cleanPerm.substring(13).replace(/^:+|:+$/g, '').trim()
        if (name) result.landingPages.page.push(name)
      } else if (cleanPerm) {
        result.sites.page.push(cleanPerm)
        result.landingPages.page.push(cleanPerm)
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

export function DevPermissionsModal({ devId, devName, initialPermissions, initialModule = 'sites', onClose }: Props) {
  const router = useRouter()
  const { toast, toasts, removeToast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [module, setModule] = useState<ModuleType>(initialModule)
  const [permissions, setPermissions] = useState<Record<ModuleType, Record<PermissionTier, string[]>>>(
    normalizePermissions(initialPermissions)
  )

  const togglePermission = (tier: PermissionTier, permission: string) => {
    const newPermissions = {
      ...permissions,
      [module]: {
        ...permissions[module],
        [tier]: permissions[module][tier].includes(permission)
          ? permissions[module][tier].filter((p) => p !== permission)
          : [...permissions[module][tier], permission],
      },
    }
    setPermissions(newPermissions)
    savePermissions(newPermissions)
  }

  const savePermissions = (permsToSave: Record<ModuleType, Record<PermissionTier, string[]>>) => {
    setError(null)
    startTransition(async () => {
      const permissionsArray: string[] = []

      Object.entries(permsToSave).forEach(([mod, tiers]) => {
        Object.entries(tiers).forEach(([tier, perms]) => {
          perms.forEach((perm) => {
            const cleanPerm = perm.replace(/^:+|:+$/g, '').trim()
            if (cleanPerm) {
              permissionsArray.push(`${mod}:${tier}:${cleanPerm}`)
            }
          })
        })
      })

      const result = await updateUserPermissions({ userId: devId, permissions: permissionsArray })
      if (!result.ok) {
        setError(result.error ?? 'Erro ao salvar permissões.')
      } else {
        toast({ message: 'Permissões salvas com sucesso!', type: 'success' })
        setTimeout(() => {
          router.refresh()
        }, 500)
      }
    })
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} inModal={false} />
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto p-0">
          <div className="relative w-full h-full">
            <div className="px-4 sm:px-6">
              <DialogHeader>
                <DialogTitle className="text-brand-text flex items-center gap-2 pt-4 mb-2">
                  <Code2 className="w-4 h-4 text-brand-primary" />
                  Permissões de {devName}
                </DialogTitle>
              </DialogHeader>

              <div className="flex gap-4 flex-col">
                <div className="flex gap-2 border-b border-brand-btn-light pb-3">
                  <button
                    onClick={() => setModule('sites')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      module === 'sites'
                        ? 'bg-brand-primary text-white'
                        : 'text-brand-text hover:bg-brand-btn-light'
                    }`}
                  >
                    Sites
                  </button>
                  <button
                    onClick={() => setModule('landingPages')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      module === 'landingPages'
                        ? 'bg-brand-primary text-white'
                        : 'text-brand-text hover:bg-brand-btn-light'
                    }`}
                  >
                    Landing Pages
                  </button>
                </div>

                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-brand-text mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Permissões Gerais
                    </h3>
                    <div className="space-y-2">
                      {PROJECT_TIER_PERMISSIONS.map((perm) => (
                        <div key={perm} className="flex items-center justify-between p-3 bg-brand-btn-light/30 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-brand-text">
                              {PERMISSION_LABELS[perm]?.label || perm}
                            </p>
                            <p className="text-xs text-brand-muted">
                              {PERMISSION_LABELS[perm]?.description || ''}
                            </p>
                          </div>
                          <Switch
                            checked={permissions[module]['project'].includes(perm)}
                            onCheckedChange={() => togglePermission('project', perm)}
                            disabled={isPending}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-brand-text mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Permissões de Páginas
                    </h3>
                    <div className="space-y-2">
                      {PAGE_TIER_PERMISSIONS.map((perm) => (
                        <div key={perm} className="flex items-center justify-between p-3 bg-brand-btn-light/30 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-brand-text">
                              {PERMISSION_LABELS[perm]?.label || perm}
                            </p>
                            <p className="text-xs text-brand-muted">
                              {PERMISSION_LABELS[perm]?.description || ''}
                            </p>
                          </div>
                          <Switch
                            checked={permissions[module]['page'].includes(perm)}
                            onCheckedChange={() => togglePermission('page', perm)}
                            disabled={isPending}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
                    {error}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-brand-btn-light">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
