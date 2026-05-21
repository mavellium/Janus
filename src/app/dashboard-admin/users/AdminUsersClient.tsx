'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Plus, Loader2, UserCircle, CheckCircle2, Clock, Trash2, Pencil, KeyRound, Eye } from 'lucide-react'
import { adminCreateUser } from '@/modules/admin/actions/adminCreateUser'
import { adminEditUser } from '@/modules/admin/actions/adminEditUser'
import { adminDeleteUser } from '@/modules/admin/actions/adminDeleteUser'
import { startImpersonation } from '@/modules/auth/actions/startImpersonation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DeleteAlertModal } from '@/components/ui/delete-alert-modal'
import { PermissionsModal } from '../PermissionsModal'
import { PermissionsModuleSelector } from '../PermissionsModuleSelector'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Company {
  id: string
  name: string
  slug: string
}

interface User {
  id: string
  name: string | null
  email: string
  role: string
  permissions: string | string[] | Record<string, Record<string, string[]>>
  requiresPasswordReset: boolean
  createdAt: Date
  company: { id: string; name: string; slug: string }
}

type ModuleType = 'sites' | 'landingPages'
type PermissionTier = 'project' | 'page'

function CreateUserModal({ companies, onClose }: { companies: Company[]; onClose: () => void }) {
  const router = useRouter()
  const [companyId, setCompanyId] = useState('')
  const [role, setRole] = useState('DEFAULT')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('companyId', companyId)
    formData.set('role', role)
    setError(null)
    startTransition(async () => {
      const result = await adminCreateUser({ ok: false }, formData)
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
            Novo Usuário
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Nome</Label>
            <Input name="name" required placeholder="Nome completo" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>E-mail</Label>
            <Input name="email" type="email" required placeholder="email@exemplo.com" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Senha</Label>
            <Input name="password" type="password" required placeholder="Mínimo 8 caracteres" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Empresa</Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger className="w-full h-9 border-input bg-transparent">
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-full h-9 border-input bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEFAULT">Usuário</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isPending || !companyId || !role}>
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Criar Usuário
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditUserModal({ user, companies, onClose }: { user: User; companies: Company[]; onClose: () => void }) {
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
            Editar Usuário
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={user.id} />

          <div className="flex flex-col gap-1.5">
            <Label>Nome</Label>
            <Input name="name" required defaultValue={user.name ?? ''} placeholder="Nome completo" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>E-mail</Label>
            <Input name="email" type="email" required defaultValue={user.email} placeholder="email@exemplo.com" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Empresa</Label>
            <Select name="companyId" defaultValue={user.company.id}>
              <SelectTrigger className="w-full h-9 border-input bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

const ROLE_LABELS: Record<string, string> = {
  DEFAULT: 'Usuário',
  ADMIN: 'Admin',
  DEVELOPER: 'Desenvolvedor',
}

export function AdminUsersClient({ users, companies }: { users: User[]; companies: Company[] }) {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [permissionsModuleSelector, setPermissionsModuleSelector] = useState<User | null>(null)
  const [permissionsModal, setPermissionsModal] = useState<{ user: User; module: ModuleType } | null>(null)
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
          <h1 className="text-2xl font-bold text-brand-text">Usuários</h1>
          <p className="text-sm text-brand-muted mt-0.5">
            {users.length} usuário{users.length !== 1 ? 's' : ''} no sistema
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Novo Usuário
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Users className="w-10 h-10 text-brand-muted opacity-40" />
            <p className="text-sm text-brand-muted">Nenhum usuário cadastrado</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Usuário</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Empresa</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Senha</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Criado em</th>
                <th className="px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-brand-btn-light/30 transition">
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-brand-text">{user.name || '—'}</p>
                      <p className="text-xs text-brand-muted">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <code className="text-xs text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded">
                      {user.company.slug}
                    </code>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-btn-light text-brand-text">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      {user.requiresPasswordReset ? (
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
                    {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={async () => {
                          const result = await startImpersonation(user.id, user.company.slug, window.location.href)
                          if (result.ok) {
                            window.open(`/${user.company.slug}/dashboard`, '_self')
                          }
                        }}
                        className="p-1.5 rounded text-brand-muted hover:text-brand-primary hover:bg-brand-btn-light transition"
                        title="Visualizar como usuário"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditTarget(user)}
                        className="p-1.5 rounded text-brand-muted hover:text-brand-primary hover:bg-brand-btn-light transition"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setPermissionsModuleSelector(user)}
                        className="p-1.5 rounded text-brand-muted hover:text-brand-primary hover:bg-brand-btn-light transition"
                        title="Permissões"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(user)}
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

      {showCreate && <CreateUserModal companies={companies} onClose={() => setShowCreate(false)} />}
      {editTarget && <EditUserModal user={editTarget} companies={companies} onClose={() => setEditTarget(null)} />}
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
          description={`Esta ação excluirá permanentemente o usuário "${deleteTarget.name || deleteTarget.email}" e todos os dados associados.`}
        />
      )}
    </div>
  )
}
