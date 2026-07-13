'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Loader2, ArrowRight, TableProperties, Braces } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  getAuditLogDiff,
  type AuditLogDiff,
} from '@/modules/admin/actions/getAuditLogDiff'
import type { AuditLogRow } from './AuditLogsTable'

const DiffEditor = dynamic(
  () => import('@monaco-editor/react').then((m) => m.DiffEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-card text-brand-muted">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    ),
  },
)

function toJsonString(value: unknown): string {
  if (value === null || value === undefined) return ''
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function toDisplayValue(value: unknown): string {
  if (value === undefined) return '—'
  if (value === null) return 'vazio'
  if (typeof value === 'string') return value || 'vazio'
  if (typeof value === 'object') {
    const json = JSON.stringify(value)
    return json.length > 120 ? `${json.slice(0, 120)}…` : json
  }
  return String(value)
}

interface FieldChange {
  field: string
  before: string
  after: string
}

function computeChanges(oldData: unknown, newData: unknown): FieldChange[] {
  const oldRecord =
    oldData && typeof oldData === 'object'
      ? (oldData as Record<string, unknown>)
      : {}
  const newRecord =
    newData && typeof newData === 'object'
      ? (newData as Record<string, unknown>)
      : {}

  const keys = new Set([...Object.keys(oldRecord), ...Object.keys(newRecord)])
  const changes: FieldChange[] = []

  for (const key of keys) {
    const before = oldRecord[key]
    const after = newRecord[key]
    if (JSON.stringify(before) === JSON.stringify(after)) continue
    changes.push({
      field: key,
      before: toDisplayValue(before),
      after: toDisplayValue(after),
    })
  }

  return changes.sort((a, b) => a.field.localeCompare(b.field))
}

const ACTION_LABEL: Record<string, string> = {
  CREATE: 'Criação',
  UPDATE: 'Edição',
  DELETE: 'Exclusão',
  RESTORE: 'Restauração',
}

type ViewMode = 'summary' | 'json'

export function AuditDiffViewer({
  log,
  open,
  onOpenChange,
}: {
  log: AuditLogRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [isDark, setIsDark] = useState(false)
  const [modeState, setModeState] = useState<{
    logId: string
    mode: ViewMode
  } | null>(null)
  const [result, setResult] = useState<{
    logId: string
    diff?: AuditLogDiff
    error?: string
  } | null>(null)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const update = () =>
      setIsDark(document.documentElement.classList.contains('dark'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!open || !log) return
    let cancelled = false

    getAuditLogDiff(log.id).then((response) => {
      if (cancelled) return
      setResult(
        response.ok
          ? { logId: log.id, diff: response.data }
          : { logId: log.id, error: response.error },
      )
    })

    return () => {
      cancelled = true
    }
  }, [open, log])

  const current = log && result?.logId === log.id ? result : null
  const loading = open && !!log && !current
  const diff = current?.diff ?? null
  const error = current?.error ?? null
  const viewMode: ViewMode =
    log && modeState?.logId === log.id ? modeState.mode : 'summary'

  const changes = diff ? computeChanges(diff.oldData, diff.newData) : []

  const modeButton = (mode: ViewMode, label: string, Icon: typeof Braces) => (
    <button
      onClick={() => log && setModeState({ logId: log.id, mode })}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
        viewMode === mode
          ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
          : 'text-brand-muted hover:text-brand-text border border-transparent'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[95vw] sm:max-w-3xl p-0 gap-0">
        <SheetHeader className="px-4 sm:px-6 py-4 border-b border-border text-left">
          <SheetTitle className="flex items-center gap-2 text-brand-text">
            Auditoria
            {log && (
              <span className="text-brand-muted font-normal">
                · {ACTION_LABEL[log.action] ?? log.action}
              </span>
            )}
          </SheetTitle>
          <SheetDescription>
            {log ? (
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-medium text-brand-text">
                  {log.entityLabel ?? log.entity}
                </span>
                <code className="font-mono text-xs text-brand-muted">
                  {log.entityId}
                </code>
                <span className="text-brand-muted">·</span>
                <span>{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                {log.userEmail && (
                  <>
                    <span className="text-brand-muted">·</span>
                    <span>{log.userEmail}</span>
                  </>
                )}
                {log.impersonatedName && (
                  <span className="text-brand-cta">
                    (inspecionando {log.impersonatedName})
                  </span>
                )}
              </span>
            ) : (
              'Selecione um registro'
            )}
          </SheetDescription>
        </SheetHeader>

        {log && (
          <>
            <div className="flex items-center gap-1 px-4 sm:px-6 py-2 border-b border-border">
              {modeButton('summary', 'Resumo', TableProperties)}
              {modeButton('json', 'JSON completo', Braces)}
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center text-brand-muted">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center px-6">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            ) : viewMode === 'summary' ? (
              <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4">
                {changes.length === 0 ? (
                  <p className="text-sm text-brand-muted">
                    Nenhuma diferença de campo registrada para este evento.
                  </p>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[520px] text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 text-xs font-semibold text-brand-muted uppercase tracking-wide">
                            Campo
                          </th>
                          <th className="text-left py-2 pr-4 text-xs font-semibold text-brand-muted uppercase tracking-wide">
                            Antes
                          </th>
                          <th className="w-6" />
                          <th className="text-left py-2 text-xs font-semibold text-brand-muted uppercase tracking-wide">
                            Depois
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {changes.map((change) => (
                          <tr key={change.field} className="align-top">
                            <td className="py-2.5 pr-4 font-mono text-xs text-brand-text whitespace-nowrap">
                              {change.field}
                            </td>
                            <td className="py-2.5 pr-4 text-brand-muted break-all">
                              {change.before}
                            </td>
                            <td className="py-2.5">
                              <ArrowRight className="w-3.5 h-3.5 text-brand-muted" />
                            </td>
                            <td className="py-2.5 text-brand-text break-all">
                              {change.after}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-2 border-b border-border text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                  <span>Antes (oldData)</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  <span>Depois (newData)</span>
                </div>
                <div className="flex-1 min-h-0">
                  <DiffEditor
                    height="100%"
                    language="json"
                    original={toJsonString(diff?.oldData)}
                    modified={toJsonString(diff?.newData)}
                    theme={isDark ? 'vs-dark' : 'light'}
                    options={{
                      readOnly: true,
                      renderSideBySide: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 13,
                      wordWrap: 'on',
                      automaticLayout: true,
                      lineNumbers: 'on',
                    }}
                  />
                </div>
              </>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
