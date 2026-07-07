'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Eye,
  Undo2,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  ScrollText,
} from 'lucide-react'
import {
  AdminDataTable,
  type ColumnDef,
  type FilterDef,
} from '@/components/ui/AdminDataTable'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { ToastContainer } from '@/components/ui/toast-container'
import { revertAuditAction } from '@/modules/admin/actions/revertAuditAction'
import { AuditDiffViewer } from './AuditDiffViewer'

export type AuditActionValue = 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE'

export interface AuditLogRow {
  id: string
  action: AuditActionValue
  entity: string
  entityId: string
  oldData: unknown
  newData: unknown
  createdAt: string | Date
  user: { id: string; name: string | null; email: string } | null
}

const ACTION_META: Record<
  AuditActionValue,
  { label: string; className: string; Icon: typeof Plus }
> = {
  CREATE: {
    label: 'Criação',
    className: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
    Icon: Plus,
  },
  UPDATE: {
    label: 'Edição',
    className: 'bg-brand-cta/10 text-brand-cta border-brand-cta/20',
    Icon: Pencil,
  },
  DELETE: {
    label: 'Exclusão',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    Icon: Trash2,
  },
  RESTORE: {
    label: 'Restauração',
    className: 'bg-brand-text/10 text-brand-text border-border',
    Icon: RotateCcw,
  },
}

function ActionBadge({ action }: { action: AuditActionValue }) {
  const meta = ACTION_META[action] ?? ACTION_META.UPDATE
  const { Icon } = meta
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${meta.className}`}
    >
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  )
}

export function AuditLogsTable({ logs }: { logs: AuditLogRow[] }) {
  const router = useRouter()
  const { toasts, toast, removeToast } = useToast()
  const [selected, setSelected] = useState<AuditLogRow | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [revertingId, setRevertingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function openDiff(row: AuditLogRow) {
    setSelected(row)
    setViewerOpen(true)
  }

  function handleRevert(row: AuditLogRow) {
    setRevertingId(row.id)
    startTransition(async () => {
      const result = await revertAuditAction(row.id)
      if (result.ok) {
        toast({ message: 'Ação revertida com sucesso', type: 'success' })
        router.refresh()
      } else {
        toast({
          message: result.error || 'Erro ao reverter ação',
          type: 'error',
        })
      }
      setRevertingId(null)
    })
  }

  const columns: ColumnDef<AuditLogRow>[] = [
    {
      key: 'createdAt',
      label: 'Data/Hora',
      className: 'whitespace-nowrap',
      render: (row) => (
        <span className="text-sm text-brand-muted whitespace-nowrap">
          {new Date(row.createdAt).toLocaleString('pt-BR')}
        </span>
      ),
    },
    {
      key: 'user',
      label: 'Usuário',
      render: (row) => (
        <div className="flex flex-col min-w-0">
          <span className="text-sm text-brand-text truncate">
            {row.user?.name || 'Sistema'}
          </span>
          <span className="text-xs text-brand-muted truncate">
            {row.user?.email || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Ação',
      render: (row) => <ActionBadge action={row.action} />,
    },
    {
      key: 'entity',
      label: 'Entidade',
      render: (row) => (
        <span className="text-sm font-medium text-brand-text">
          {row.entity}
        </span>
      ),
    },
    {
      key: 'entityId',
      label: 'ID',
      optional: true,
      render: (row) => (
        <code
          className="block max-w-[160px] truncate font-mono text-xs text-brand-muted"
          title={row.entityId}
        >
          {row.entityId}
        </code>
      ),
    },
  ]

  const filters: FilterDef<AuditLogRow>[] = [
    {
      key: 'action',
      label: 'Ação',
      options: [
        { value: '', label: 'Todas' },
        { value: 'CREATE', label: 'Criação' },
        { value: 'UPDATE', label: 'Edição' },
        { value: 'DELETE', label: 'Exclusão' },
        { value: 'RESTORE', label: 'Restauração' },
      ],
      predicate: (row, value) => row.action === value,
    },
    {
      key: 'entity',
      label: 'Entidade',
      options: [
        { value: '', label: 'Todas' },
        { value: 'User', label: 'Usuário' },
        { value: 'Project', label: 'Site / Projeto' },
        { value: 'Page', label: 'Página (CMS)' },
        { value: 'BlogPost', label: 'Artigo (Blog)' },
        { value: 'BlogCategory', label: 'Categoria (Blog)' },
        { value: 'BlogTag', label: 'Tag (Blog)' },
      ],
      predicate: (row, value) => row.entity === value,
    },
    {
      key: 'area',
      label: 'Área',
      options: [
        { value: '', label: 'Todas' },
        { value: 'admin', label: 'Administração' },
        { value: 'cms', label: 'CMS (Sites/Páginas)' },
        { value: 'blog', label: 'Blog' },
      ],
      predicate: (row, value) => {
        if (value === 'admin') return row.entity === 'User'
        if (value === 'cms') return row.entity === 'Project' || row.entity === 'Page'
        if (value === 'blog') return row.entity.startsWith('Blog')
        return true
      },
    },
    {
      key: 'period',
      label: 'Período',
      options: [
        { value: '', label: 'Últimos 60 dias' },
        { value: '1', label: 'Últimas 24h' },
        { value: '7', label: 'Últimos 7 dias' },
        { value: '30', label: 'Últimos 30 dias' },
      ],
      predicate: (row, value) =>
        new Date(row.createdAt).getTime() >=
        Date.now() - Number(value) * 86_400_000,
    },
  ]

  return (
    <>
      <AdminDataTable<AuditLogRow>
        data={logs}
        columns={columns}
        getRowId={(row) => row.id}
        filters={filters}
        searchPlaceholder="Buscar por usuário, entidade ou ID..."
        emptyIcon={
          <ScrollText className="w-10 h-10 text-brand-muted opacity-40" />
        }
        emptyMessage="Nenhum evento de auditoria registrado"
        searchPredicate={(row, term) =>
          (row.user?.email ?? '').toLowerCase().includes(term) ||
          (row.user?.name ?? '').toLowerCase().includes(term) ||
          row.entity.toLowerCase().includes(term) ||
          row.entityId.toLowerCase().includes(term)
        }
        renderRowActions={(row) => {
          const canRevert = row.action === 'UPDATE' || row.action === 'DELETE'
          const isReverting = revertingId === row.id
          return (
            <>
              <Button
                size="icon-sm"
                variant="ghost"
                title="Ver diferenças"
                onClick={() => openDiff(row)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!canRevert || isReverting}
                title={
                  canRevert
                    ? 'Desfazer esta ação'
                    : 'Apenas edições e exclusões podem ser desfeitas'
                }
                onClick={() => handleRevert(row)}
              >
                {isReverting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Undo2 className="w-3.5 h-3.5" />
                )}
                Desfazer
              </Button>
            </>
          )
        }}
      />

      <AuditDiffViewer
        log={selected}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  )
}
