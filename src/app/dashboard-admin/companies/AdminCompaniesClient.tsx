'use client'

import { useActionState, useState, useTransition } from 'react'
import { Building2, Pencil, Trash2, ExternalLink, Plus, Loader2, Code2, Copy, CheckCircle2 } from 'lucide-react'
import { adminCreateCompany } from '@/modules/admin/actions/adminCreateCompany'
import { adminEditCompany } from '@/modules/admin/actions/adminEditCompany'
import { adminDeleteCompany } from '@/modules/admin/actions/adminDeleteCompany'
import { toggleGuestMode } from '@/modules/admin/actions/toggleGuestMode'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

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
  const action = mode === 'create' ? adminCreateCompany : adminEditCompany
  const [state, formAction, isPending] = useActionState(action, { ok: false })

  if (state.ok) onClose()

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-brand-text flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-primary" />
            {mode === 'create' ? 'Nova Empresa' : 'Editar Empresa'}
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
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

          {state.error && (
            <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
              {state.error}
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

function DeleteDialog({ company, onClose }: { company: Company; onClose: () => void }) {
  const [isPending, setIsPending] = useState(false)

  async function handleDelete() {
    setIsPending(true)
    await adminDeleteCompany(company.id)
    onClose()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-brand-text">Excluir Empresa</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-brand-muted">
          Tem certeza que deseja excluir <strong className="text-brand-text">{company.name}</strong>? Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" disabled={isPending} onClick={handleDelete}>
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
            Excluir
          </Button>
        </div>
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

function GuestEndpointModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  const endpoint = '/api/v1/admin/guests'
  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${endpoint}` : endpoint

  function handleCopy() {
    navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-brand-text flex items-center gap-2">
            <Code2 className="w-4 h-4 text-brand-primary" />
            Endpoint de Convidados
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="bg-brand-btn-light/30 rounded-lg p-4 border border-border">
            <p className="text-xs text-brand-muted mb-2 uppercase font-semibold">Endpoint</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm text-brand-primary font-mono bg-brand-bg p-3 rounded border border-border">
                GET {endpoint}
              </code>
              <button
                onClick={handleCopy}
                className="p-2 rounded hover:bg-brand-btn-light transition"
                title="Copiar"
              >
                {copied ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-brand-muted" />
                )}
              </button>
            </div>
          </div>

          <div className="bg-brand-btn-light/30 rounded-lg p-4 border border-border">
            <p className="text-xs text-brand-muted mb-2 uppercase font-semibold">Estrutura da Resposta</p>
            <code className="block text-xs text-brand-text font-mono bg-brand-bg p-3 rounded border border-border overflow-auto max-h-40">
{`{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "name": "João Silva",
      "email": "joao@example.com",
      "company": { "id", "name", "slug" },
      "posts": [
        {
          "id": "uuid",
          "title": "Título",
          "message": "Mensagem...",
          "imageUrl": "https://...",
          "createdAt": "2026-05-13T..."
        }
      ],
      "createdAt": "2026-05-13T..."
    }
  ]
}`}
            </code>
          </div>

          <div className="flex justify-end">
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AdminCompaniesClient({ companies }: { companies: Company[] }) {
  const [modal, setModal] = useState<null | 'create' | { mode: 'edit'; company: Company } | { mode: 'delete'; company: Company }>(null)
  const [showEndpoint, setShowEndpoint] = useState(false)

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
                        <button
                          onClick={() => setShowEndpoint(true)}
                          className="p-1.5 rounded text-brand-muted hover:text-brand-primary hover:bg-brand-btn-light transition"
                          title="Ver endpoint de convidados"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <a
                        href={`/${company.slug}/dashboard`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded text-brand-muted hover:text-brand-primary hover:bg-brand-btn-light transition"
                        title="Acessar empresa"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
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
        <DeleteDialog company={modal.company} onClose={() => setModal(null)} />
      )}
      {showEndpoint && (
        <GuestEndpointModal onClose={() => setShowEndpoint(false)} />
      )}
    </div>
  )
}
