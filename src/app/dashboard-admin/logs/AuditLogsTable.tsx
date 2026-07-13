'use client'

import { useMemo, useState, useTransition } from 'react'
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
  History,
  Download,
  X,
  UserSearch,
} from 'lucide-react'
import {
  AdminDataTable,
  type ColumnDef,
  type FilterDef,
} from '@/components/ui/AdminDataTable'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
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
  entityLabel: string | null
  userId: string | null
  userEmail: string | null
  userName: string | null
  impersonatedId: string | null
  impersonatedName: string | null
  companyId: string | null
  projectId: string | null
  createdAt: string | Date
}

export interface AuditCompanyOption {
  id: string
  name: string
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

const ENTITY_DISPLAY: Record<string, string> = {
  User: 'Usuário',
  UserCompany: 'Vínculo usuário-empresa',
  Company: 'Empresa',
  Project: 'Site / Projeto',
  Page: 'Página (CMS)',
  BlogPost: 'Artigo (Blog)',
  BlogCategory: 'Categoria (Blog)',
  BlogTag: 'Tag (Blog)',
  SiteScript: 'Script de site',
  GuestEntry: 'Convidado',
  GuestPost: 'Post de convidado',
  Impersonation: 'Inspeção de usuário',
  BlockedIp: 'IP bloqueado',
}

const REVERTIBLE_ENTITIES = new Set([
  'User',
  'Company',
  'Project',
  'Page',
  'BlogPost',
  'BlogCategory',
  'BlogTag',
  'SiteScript',
  'GuestEntry',
  'GuestPost',
])

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

function csvEscape(value: string): string {
  if (/[";\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export function AuditLogsTable({
  logs,
  totalCount,
  companies,
}: {
  logs: AuditLogRow[]
  totalCount: number
  companies: AuditCompanyOption[]
}) {
  const router = useRouter()
  const { toasts, toast, removeToast } = useToast()
  const [selected, setSelected] = useState<AuditLogRow | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [revertTarget, setRevertTarget] = useState<AuditLogRow | null>(null)
  const [isReverting, setIsReverting] = useState(false)
  const [timelineEntity, setTimelineEntity] = useState<AuditLogRow | null>(null)
  const [, startTransition] = useTransition()

  const visibleLogs = useMemo(() => {
    if (!timelineEntity) return logs
    return logs.filter(
      (log) =>
        log.entity === timelineEntity.entity &&
        log.entityId === timelineEntity.entityId,
    )
  }, [logs, timelineEntity])

  const actorOptions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const log of logs) {
      const key = log.userEmail ?? log.userName
      if (key && !seen.has(key)) {
        seen.set(key, log.userName ? `${log.userName} (${log.userEmail ?? '—'})` : key)
      }
    }
    return Array.from(seen.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [logs])

  const entityOptions = useMemo(() => {
    const set = new Set(logs.map((log) => log.entity))
    return Array.from(set)
      .map((entity) => ({ value: entity, label: ENTITY_DISPLAY[entity] ?? entity }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [logs])

  function openDiff(row: AuditLogRow) {
    setSelected(row)
    setViewerOpen(true)
  }

  function confirmRevert() {
    if (!revertTarget) return
    setIsReverting(true)
    startTransition(async () => {
      const result = await revertAuditAction(revertTarget.id)
      if (result.ok) {
        toast({ message: 'Ação revertida com sucesso', type: 'success' })
        router.refresh()
      } else {
        toast({
          message: result.error || 'Erro ao reverter ação',
          type: 'error',
        })
      }
      setIsReverting(false)
      setRevertTarget(null)
    })
  }

  function exportCsv() {
    const header = [
      'Data/Hora',
      'Usuário',
      'E-mail',
      'Em inspeção de',
      'Ação',
      'Entidade',
      'Registro',
      'ID do registro',
    ]
    const rows = visibleLogs.map((log) => [
      new Date(log.createdAt).toLocaleString('pt-BR'),
      log.userName ?? 'Sistema',
      log.userEmail ?? '',
      log.impersonatedName ?? '',
      ACTION_META[log.action]?.label ?? log.action,
      ENTITY_DISPLAY[log.entity] ?? log.entity,
      log.entityLabel ?? '',
      log.entityId,
    ])
    const csv = [header, ...rows]
      .map((row) => row.map(csvEscape).join(';'))
      .join('\n')
    const blob = new Blob([`﻿${csv}`], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
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
        <div className="flex flex-col min-w-0 gap-0.5">
          <span className="text-sm text-brand-text truncate">
            {row.userName || 'Sistema'}
          </span>
          <span className="text-xs text-brand-muted truncate">
            {row.userEmail || '—'}
          </span>
          {row.impersonatedName && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-cta"
              title={`Ação executada enquanto inspecionava ${row.impersonatedName}`}
            >
              <UserSearch className="w-3 h-3" />
              inspecionando {row.impersonatedName}
            </span>
          )}
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
      label: 'Registro',
      render: (row) => (
        <div className="flex flex-col min-w-0 gap-0.5">
          <span className="text-sm font-medium text-brand-text truncate max-w-[260px]">
            {row.entityLabel ?? row.entityId}
          </span>
          <span className="text-xs text-brand-muted truncate">
            {ENTITY_DISPLAY[row.entity] ?? row.entity}
          </span>
        </div>
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
      options: [{ value: '', label: 'Todas' }, ...entityOptions],
      predicate: (row, value) => row.entity === value,
    },
    {
      key: 'actor',
      label: 'Usuário',
      options: [{ value: '', label: 'Todos' }, ...actorOptions],
      predicate: (row, value) =>
        row.userEmail === value || row.userName === value,
    },
    {
      key: 'company',
      label: 'Empresa',
      options: [
        { value: '', label: 'Todas' },
        ...companies.map((company) => ({
          value: company.id,
          label: company.name,
        })),
      ],
      predicate: (row, value) => row.companyId === value,
    },
    {
      key: 'area',
      label: 'Área',
      options: [
        { value: '', label: 'Todas' },
        { value: 'admin', label: 'Administração' },
        { value: 'cms', label: 'CMS (Sites/Páginas)' },
        { value: 'blog', label: 'Blog' },
        { value: 'security', label: 'Segurança' },
        { value: 'guests', label: 'Convidados' },
      ],
      predicate: (row, value) => {
        if (value === 'admin')
          return ['User', 'UserCompany', 'Company'].includes(row.entity)
        if (value === 'cms')
          return ['Project', 'Page', 'SiteScript'].includes(row.entity)
        if (value === 'blog') return row.entity.startsWith('Blog')
        if (value === 'security')
          return ['Impersonation', 'BlockedIp'].includes(row.entity)
        if (value === 'guests') return row.entity.startsWith('Guest')
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

  const revertEntityName = revertTarget
    ? (ENTITY_DISPLAY[revertTarget.entity] ?? revertTarget.entity)
    : ''

  return (
    <>
      {timelineEntity && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg border border-brand-primary/30 bg-brand-primary/5 text-sm text-brand-text">
          <History className="w-4 h-4 text-brand-primary shrink-0" />
          <span className="min-w-0 truncate">
            Histórico de{' '}
            <strong>
              {timelineEntity.entityLabel ?? timelineEntity.entityId}
            </strong>{' '}
            ({ENTITY_DISPLAY[timelineEntity.entity] ?? timelineEntity.entity})
          </span>
          <button
            onClick={() => setTimelineEntity(null)}
            className="ml-auto inline-flex items-center gap-1 text-xs text-brand-muted hover:text-destructive transition shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            Limpar
          </button>
        </div>
      )}

      {logs.length < totalCount && !timelineEntity && (
        <p className="mb-3 text-xs text-brand-muted">
          Exibindo os {logs.length.toLocaleString('pt-BR')} eventos mais
          recentes de {totalCount.toLocaleString('pt-BR')} no período de
          retenção.
        </p>
      )}

      <AdminDataTable<AuditLogRow>
        data={visibleLogs}
        columns={columns}
        getRowId={(row) => row.id}
        filters={filters}
        searchPlaceholder="Buscar por usuário, registro, entidade ou ID..."
        emptyIcon={
          <ScrollText className="w-10 h-10 text-brand-muted opacity-40" />
        }
        emptyMessage="Nenhum evento de auditoria registrado"
        newButton={
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </Button>
        }
        searchPredicate={(row, term) =>
          (row.userEmail ?? '').toLowerCase().includes(term) ||
          (row.userName ?? '').toLowerCase().includes(term) ||
          (row.entityLabel ?? '').toLowerCase().includes(term) ||
          (row.impersonatedName ?? '').toLowerCase().includes(term) ||
          row.entity.toLowerCase().includes(term) ||
          row.entityId.toLowerCase().includes(term)
        }
        renderRowActions={(row) => {
          const canRevert =
            (row.action === 'UPDATE' || row.action === 'DELETE') &&
            REVERTIBLE_ENTITIES.has(row.entity)
          return (
            <>
              <Button
                size="icon-sm"
                variant="ghost"
                title="Ver detalhes e diferenças"
                onClick={() => openDiff(row)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                title="Ver histórico deste registro"
                onClick={() => setTimelineEntity(row)}
              >
                <History className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!canRevert}
                title={
                  canRevert
                    ? 'Desfazer esta ação'
                    : 'Esta ação não pode ser desfeita automaticamente'
                }
                onClick={() => setRevertTarget(row)}
              >
                <Undo2 className="w-3.5 h-3.5" />
                Desfazer
              </Button>
            </>
          )
        }}
      />

      <AlertDialog
        open={!!revertTarget}
        onOpenChange={(open) => {
          if (!open && !isReverting) setRevertTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desfazer esta ação?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  {revertTarget?.action === 'DELETE'
                    ? 'O registro excluído será recriado com o estado salvo na auditoria.'
                    : 'O registro voltará ao estado anterior à edição.'}
                </p>
                <p className="text-sm">
                  <span className="font-medium text-foreground">
                    {revertTarget?.entityLabel ?? revertTarget?.entityId}
                  </span>{' '}
                  · {revertEntityName}
                  {revertTarget && (
                    <>
                      {' '}
                      · {new Date(revertTarget.createdAt).toLocaleString('pt-BR')}
                    </>
                  )}
                </p>
                <p className="text-xs">
                  A reversão também será registrada na auditoria. Relações em
                  cascata (ex.: registros dependentes excluídos) não são
                  restauradas automaticamente.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReverting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isReverting}
              onClick={(event) => {
                event.preventDefault()
                confirmRevert()
              }}
            >
              {isReverting && (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              )}
              Desfazer ação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AuditDiffViewer
        log={selected}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  )
}
