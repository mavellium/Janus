'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Pencil, Trash2, LayoutDashboard, Plus, Loader2, UsersRound } from 'lucide-react'
import { adminCreateCompany } from '@/modules/admin/actions/adminCreateCompany'
import { adminEditCompany } from '@/modules/admin/actions/adminEditCompany'
import { adminDeleteCompany } from '@/modules/admin/actions/adminDeleteCompany'
import { toggleGuestMode } from '@/modules/admin/actions/toggleGuestMode'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DeleteAlertModal } from '@/components/ui/delete-alert-modal'

interface Company {
  id: string
  name: string
  slug: string
  description: string | null
  guestModeEnabled: boolean
  createdAt: Date
  users: { id: string }[]
  projects: { id: string }[]
}

function CompanyFormModal({
  mode,
  company,
  onClose,
}: {
  mode: 'create' | 'edit'
  company?: Company
  onClose: () => void
}) {
  const router = useRouter()
  const action = mode === 'create' ? adminCreateCompany : adminEditCompany
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await action({ ok: false }, formData)
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
            <Building2 className="w-4 h-4 text-brand-primary" />
            {mode === 'create' ? 'Nova Empresa' : 'Editar Empresa'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'edit' && <input type="hidden" name="id" value={company?.id} />}

          <div className="flex flex-col gap-1.5">
            <Label>Nome</Label>
            <Input name="name" required defaultValue={company?.name} placeholder="Acme Corp" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Slug</Label>
            <Input
              name="slug"
              required
              defaultValue={company?.slug}
              placeholder="acme-corp"
              className="font-mono"
            />
            <p className="text-[11px] text-brand-muted">Apenas letras minúsculas, números e hífens</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Descrição (opcional)</Label>
            <Input name="description" defaultValue={company?.description ?? ''} placeholder="Descrição da empresa" />
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
              {mode === 'create' ? 'Criar' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function GuestModeSwitch({ company }: { company: Company }) {
  const [enabled, setEnabled] = useState(company.guestModeEnabled)
  const [, startTransition] = useTransition()

  function handleToggle(value: boolean) {
    setEnabled(value)
    startTransition(async () => {
      await toggleGuestMode(company.id, value)
    })
  }

  return (
    <div className="flex items-center justify-center gap-1.5">
      <Switch checked={enabled} onCheckedChange={handleToggle} />
    </div>
  )
}


export function AdminCompaniesClient({ companies }: { companies: Company[] }) {
  const router = useRouter()
  const [modal, setModal] = useState<null | 'create' | { mode: 'edit'; company: Company } | { mode: 'delete'; company: Company }>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete(id: string) {
    setIsDeleting(true)
    await adminDeleteCompany(id)
    setIsDeleting(false)
    setModal(null)
    router.refresh()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Empresas</h1>
          <p className="text-sm text-brand-muted mt-0.5">
            {companies.length} empresa{companies.length !== 1 ? 's' : ''} cadastrada{companies.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setModal('create')}>
          <Plus className="w-4 h-4 mr-1.5" />
          Nova Empresa
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Building2 className="w-10 h-10 text-brand-muted opacity-40" />
            <p className="text-sm text-brand-muted">Nenhuma empresa cadastrada</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Empresa</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Slug</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Usuários</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Projetos</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Convidados</th>
                <th className="px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-brand-btn-light/30 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-brand-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-brand-text">{company.name}</p>
                        {company.description && (
                          <p className="text-xs text-brand-muted truncate max-w-[180px]">{company.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <code className="text-xs text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded">
                      {company.slug}
                    </code>
                  </td>
                  <td className="px-5 py-4 text-center text-sm text-brand-text">{company.users.length}</td>
                  <td className="px-5 py-4 text-center text-sm text-brand-text">{company.projects.length}</td>
                  <td className="px-5 py-4 text-center">
                    <GuestModeSwitch company={company} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {company.guestModeEnabled && (
                        <Link
                          href={`/dashboard-admin/companies/${company.id}/guests`}
                          className="p-1.5 rounded text-brand-muted hover:text-brand-primary hover:bg-brand-btn-light transition"
                          title="Gerenciar convidados"
                        >
                          <UsersRound className="w-3.5 h-3.5" />
                        </Link>
                      )}
                      <Link
                        href={`/${company.slug}/dashboard`}
                        className="p-1.5 rounded text-brand-muted hover:text-brand-primary hover:bg-brand-btn-light transition"
                        title="Acessar Painel"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => setModal({ mode: 'edit', company })}
                        className="p-1.5 rounded text-brand-muted hover:text-brand-primary hover:bg-brand-btn-light transition"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setModal({ mode: 'delete', company })}
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

      {modal === 'create' && (
        <CompanyFormModal mode="create" onClose={() => setModal(null)} />
      )}
      {modal !== null && typeof modal === 'object' && modal.mode === 'edit' && (
        <CompanyFormModal mode="edit" company={modal.company} onClose={() => setModal(null)} />
      )}
      {modal !== null && typeof modal === 'object' && modal.mode === 'delete' && (
        <DeleteAlertModal
          isOpen
          onClose={() => setModal(null)}
          onConfirm={() => handleDelete(modal.company.id)}
          isDeleting={isDeleting}
          description={`Esta ação excluirá permanentemente "${modal.company.name}" e todos os projetos, páginas e usuários associados.`}
        />
      )}
    </div>
  )
}
