'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, UserCircle, Loader2, X } from 'lucide-react'
import { startImpersonation } from '@/modules/auth/actions/startImpersonation'

interface User {
  id: string
  name: string | null
  email: string
  role: string
}

interface Props {
  companySlug: string
  users: User[]
  onClose: () => void
}

const ROLE_LABELS: Record<string, string> = {
  DEFAULT: 'Usuário',
  ADMIN: 'Admin',
  DEVELOPER: 'Desenvolvedor',
}

export function ImpersonationSelector({ companySlug, users, onClose }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = users.filter((u) => {
    const term = search.toLowerCase()
    return (
      (u.name?.toLowerCase().includes(term) ?? false) ||
      u.email.toLowerCase().includes(term) ||
      (ROLE_LABELS[u.role] ?? u.role).toLowerCase().includes(term)
    )
  })

  function handleSelect(userId: string) {
    setSelectedId(userId)
    startTransition(async () => {
      await startImpersonation(userId, companySlug, window.location.href)
      router.refresh()
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md mx-4 bg-card border border-border rounded-xl shadow-xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Selecionar Usuário para Simular</h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <UserCircle className="w-8 h-8 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">Nenhum usuário encontrado</p>
            </div>
          )}
          {filtered.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelect(user.id)}
              disabled={isPending}
              className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-accent transition disabled:opacity-50"
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <UserCircle className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.name || user.email}
                </p>
                {user.name && (
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded shrink-0">
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
              {isPending && selectedId === user.id && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
