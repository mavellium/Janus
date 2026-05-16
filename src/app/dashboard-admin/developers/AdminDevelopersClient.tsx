'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Code2, Plus, Loader2, UserCircle, CheckCircle2, Clock, LayoutDashboard, Trash2, Pencil, KeyRound } from 'lucide-react'
import { createDeveloper } from '@/modules/admin/actions/createDeveloper'
import { adminEditUser } from '@/modules/admin/actions/adminEditUser'
import { adminDeleteUser } from '@/modules/admin/actions/adminDeleteUser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DeleteAlertModal } from '@/components/ui/delete-alert-modal'
import { PermissionsModal } from '../PermissionsModal'
import { PermissionsModuleSelector } from '../PermissionsModuleSelector'

interface Developer {
  id: string
  name: string | null
  email: string
  role: string
  permissions: string | string[] | Record<string, Record<string, string[]>>
  requiresPasswordReset: boolean
  createdAt: Date
}

type ModuleType = 'sites' | 'landingPages'
type PermissionTier = 'project' | 'page'

function CreateDeveloperModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await createDeveloper({ ok: false }, formData)
      if (!result.ok) {
        setError(result.error ?? 'Erro desconhecido.')
      } else {
        router.refresh()
        onClose()
      }
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-brand-text flex items-center gap-2">
            <UserCircle className="w-4 h-4 text-brand-primary" />
            Novo Desenvolvedor
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Nome</Label>
            <Input name="name" required placeholder="Nome completo" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>E-mail</Label>
            <Input name="email" type="email" required placeholder="dev@exemplo.com" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Senha</Label>
            <Input name="password" type="password" required placeholder="Mínimo 8 caracteres" />
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Criar Desenvolvedor
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditDeveloperModal({ developer, onClose }: { developer: Developer; onClose: () => void }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await adminEditUser(formData)
      if (!result.ok) {
        setError(result.error ?? 'Erro desconhecido.')
      } else {
        router.refresh()
        onClose()
      }
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-brand-text flex items-center gap-2">
            <UserCircle className="w-4 h-4 text-brand-primary" />
            Editar Desenvolvedor
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={developer.id} />

          <div className="flex flex-col gap-1.5">
            <Label>Nome</Label>
            <Input name="name" required defaultValue={developer.name ?? ''} placeholder="Nome completo" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>E-mail</Label>
            <Input name="email" type="email" required defaultValue={developer.email} placeholder="dev@exemplo.com" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Nova senha (opcional)</Label>
            <Input name="password" type="password" placeholder="Deixe em branco para manter" />
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AdminDevelopersClient({
  developers,
}: {
  developers: Developer[]
}) {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<Developer | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Developer | null>(null)
  const [permissionsModuleSelector, setPermissionsModuleSelector] = useState<Developer | null>(null)
  const [permissionsModal, setPermissionsModal] = useState<{ user: Developer; module: ModuleType } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete(id: string) {
    setIsDeleting(true)
    await adminDeleteUser(id)
    setIsDeleting(false)
    setDeleteTarget(null)
    router.refresh()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Desenvolvedores</h1>
          <p className="text-sm text-brand-muted mt-0.5">
            {developers.length} desenvolvedor{developers.length !== 1 ? 'es' : ''} no sistema
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Novo Desenvolvedor
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {developers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Code2 className="w-10 h-10 text-brand-muted opacity-40" />
            <p className="text-sm text-brand-muted">Nenhum desenvolvedor cadastrado</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Desenvolvedor</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Senha</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Criado em</th>
                <th className="px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {developers.map((dev) => (
                <tr key={dev.id} className="hover:bg-brand-btn-light/30 transition">
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-brand-text">{dev.name || '—'}</p>
                      <p className="text-xs text-brand-muted">{dev.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      {dev.requiresPasswordReset ? (
                        <>
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <span className="text-xs text-yellow-600 font-medium">Pendente</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">Redefinida</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-brand-muted">
                    {new Date(dev.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/dev/${dev.id}/dashboard`}
                        className="p-1.5 rounded text-brand-muted hover:text-brand-primary hover:bg-brand-btn-light transition"
                        title="Acessar Painel Dev"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => setEditTarget(dev)}
                        className="p-1.5 rounded text-brand-muted hover:text-brand-primary hover:bg-brand-btn-light transition"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setPermissionsModuleSelector(dev)}
                        className="p-1.5 rounded text-brand-muted hover:text-brand-primary hover:bg-brand-btn-light transition"
                        title="Permissões"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(dev)}
                        className="p-1.5 rounded text-brand-muted hover:text-destructive hover:bg-destructive/10 transition"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {showCreate && <CreateDeveloperModal onClose={() => setShowCreate(false)} />}
      {editTarget && <EditDeveloperModal developer={editTarget} onClose={() => setEditTarget(null)} />}
      {permissionsModuleSelector && (
        <PermissionsModuleSelector
          userId={permissionsModuleSelector.id}
          userName={permissionsModuleSelector.name || permissionsModuleSelector.email}
          open
          onClose={() => setPermissionsModuleSelector(null)}
          onSelectModule={(module) => {
            setPermissionsModuleSelector(null)
            setPermissionsModal({
              user: permissionsModuleSelector,
              module,
            })
          }}
        />
      )}
      {permissionsModal && (
        <PermissionsModal
          userId={permissionsModal.user.id}
          userName={permissionsModal.user.name || permissionsModal.user.email}
          initialPermissions={permissionsModal.user.permissions}
          module={permissionsModal.module}
          onClose={() => setPermissionsModal(null)}
        />
      )}

      {deleteTarget && (
        <DeleteAlertModal
          isOpen
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget.id)}
          isDeleting={isDeleting}
          description={`Esta ação excluirá permanentemente o desenvolvedor "${deleteTarget.name || deleteTarget.email}" e todos os dados associados.`}
        />
      )}
    </div>
  )
}
