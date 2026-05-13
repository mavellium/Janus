'use client'

import { useActionState, useState } from 'react'
import { Users, Plus, Loader2, UserCircle } from 'lucide-react'
import { createUser } from '@/modules/dev/actions/createUser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  createdAt: Date
  company: { id: string; name: string; slug: string }
}

function CreateUserModal({ companies, onClose }: { companies: Company[]; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createUser, { ok: false })
  const [companyId, setCompanyId] = useState('')

  if (state.ok) onClose()

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-brand-text flex items-center gap-2">
            <UserCircle className="w-4 h-4 text-brand-primary" />
            Novo Usuário
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="companyId" value={companyId} />

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
            <Select onValueChange={setCompanyId} required>
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

          {state.error && (
            <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
              {state.error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isPending || !companyId}>
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Criar Usuário
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

export function UsersClient({ users, companies }: { users: User[]; companies: Company[] }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Usuários</h1>
          <p className="text-sm text-brand-muted mt-0.5">
            {users.length} usuário{users.length !== 1 ? 's' : ''} no sistema
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Criado em</th>
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
                  <td className="px-5 py-4 text-sm text-brand-muted">
                    {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {showModal && <CreateUserModal companies={companies} onClose={() => setShowModal(false)} />}
    </div>
  )
}
