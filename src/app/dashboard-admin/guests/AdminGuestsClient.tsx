'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { UsersRound, Pencil, Trash2, Images, Code2, Copy } from 'lucide-react'
import { updateGuestAsAdmin } from '@/modules/admin/actions/updateGuestAsAdmin'
import { deleteGuestAsAdmin } from '@/modules/admin/actions/deleteGuestAsAdmin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DeleteAlertModal } from '@/components/ui/delete-alert-modal'

interface Guest {
  id: string
  name: string
  email: string
  createdAt: Date
  company: { id: string; name: string; slug: string }
}

function GuestEndpointModal() {
  const searchParams = useSearchParams()
  const isOpen = searchParams.get('endpoint') === 'true'

  const endpoint = '/api/v1/admin/guests'

  function handleCopy() {
    navigator.clipboard.writeText(`${window.location.origin}${endpoint}`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      const params = new URLSearchParams(searchParams)
      params.delete('endpoint')
      window.history.replaceState(null, '', `?${params.toString()}`)
    }}>
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
                <Copy className="w-4 h-4 text-brand-muted" />
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
            <Button onClick={() => {
              const params = new URLSearchParams(searchParams)
              params.delete('endpoint')
              window.history.replaceState(null, '', `?${params.toString()}`)
            }}>Fechar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function EditGuestModal({ guest }: { guest: Guest }) {
  const searchParams = useSearchParams()
  const isOpen = searchParams.get('editing') === guest.id
  const params = new URLSearchParams(searchParams)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const result = await updateGuestAsAdmin(formData)
    if (result.ok) {
      params.delete('editing')
      window.history.replaceState(null, '', `?${params.toString()}`)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      params.delete('editing')
      window.history.replaceState(null, '', `?${params.toString()}`)
    }}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-brand-text">Editar Convidado</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={guest.id} />

          <div className="flex flex-col gap-1.5">
            <Label>Nome</Label>
            <Input name="name" required defaultValue={guest.name} placeholder="Nome completo" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>E-mail</Label>
            <Input name="email" type="email" required defaultValue={guest.email} placeholder="email@exemplo.com" />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => {
              params.delete('editing')
              window.history.replaceState(null, '', `?${params.toString()}`)
            }}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteGuestModal({ guest }: { guest: Guest }) {
  const searchParams = useSearchParams()
  const isOpen = searchParams.get('deleting') === guest.id
  const params = new URLSearchParams(searchParams)

  async function handleDelete() {
    await deleteGuestAsAdmin(guest.id)
    params.delete('deleting')
    window.history.replaceState(null, '', `?${params.toString()}`)
  }

  return (
    <DeleteAlertModal
      isOpen={isOpen}
      onClose={() => {
        params.delete('deleting')
        window.history.replaceState(null, '', `?${params.toString()}`)
      }}
      onConfirm={handleDelete}
      isDeleting={false}
      description={`Esta ação excluirá permanentemente o convidado "${guest.name}" e todas as suas publicações.`}
    />
  )
}

function GuestRow({ guest }: { guest: Guest }) {
  const searchParams = useSearchParams()

  return (
    <tr className="hover:bg-brand-btn-light/30 transition">
      <td className="px-5 py-4">
        <div>
          <p className="text-sm font-medium text-brand-text">{guest.name}</p>
          <p className="text-xs text-brand-muted">{guest.email}</p>
        </div>
      </td>
      <td className="px-5 py-4">
        <code className="text-xs text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded">
          {guest.company.slug}
        </code>
      </td>
      <td className="px-5 py-4 text-sm text-brand-muted">
        {new Date(guest.createdAt).toLocaleDateString('pt-BR')}
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/dashboard-admin/guests/${guest.id}/posts`}
            className="p-1.5 rounded text-brand-muted hover:text-brand-primary hover:bg-brand-btn-light transition"
            title="Ver publicações"
          >
            <Images className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams)
              params.set('editing', guest.id)
              window.history.replaceState(null, '', `?${params.toString()}`)
            }}
            className="p-1.5 rounded text-brand-muted hover:text-brand-primary hover:bg-brand-btn-light transition"
            title="Editar"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams)
              params.set('deleting', guest.id)
              window.history.replaceState(null, '', `?${params.toString()}`)
            }}
            className="p-1.5 rounded text-brand-muted hover:text-destructive hover:bg-destructive/10 transition"
            title="Excluir"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

export function AdminGuestsClient({ guests }: { guests: Guest[] }) {
  const searchParams = useSearchParams()

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Convidados</h1>
          <p className="text-sm text-brand-muted mt-0.5">
            {guests.length} convidado{guests.length !== 1 ? 's' : ''} no sistema
          </p>
        </div>
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams)
            params.set('endpoint', 'true')
            window.history.replaceState(null, '', `?${params.toString()}`)
          }}
          className="p-1.5 rounded text-brand-muted hover:text-brand-primary hover:bg-brand-btn-light transition"
          title="Ver endpoint de convidados"
        >
          <Code2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {guests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <UsersRound className="w-10 h-10 text-brand-muted opacity-40" />
            <p className="text-sm text-brand-muted">Nenhum convidado cadastrado</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Convidado</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Empresa</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Criado em</th>
                  <th className="px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {guests.map((guest) => (
                  <GuestRow key={guest.id} guest={guest} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {guests.map((guest) => (
        <div key={guest.id}>
          <EditGuestModal guest={guest} />
          <DeleteGuestModal guest={guest} />
        </div>
      ))}
      <GuestEndpointModal />
    </div>
  )
}
