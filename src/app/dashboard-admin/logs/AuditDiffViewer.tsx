'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Loader2, ArrowRight } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
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

const ACTION_LABEL: Record<string, string> = {
  CREATE: 'Criação',
  UPDATE: 'Edição',
  DELETE: 'Exclusão',
  RESTORE: 'Restauração',
}

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[95vw] sm:max-w-3xl p-0 gap-0"
      >
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
                <span className="font-medium text-brand-text">{log.entity}</span>
                <code className="font-mono text-xs text-brand-muted">
                  {log.entityId}
                </code>
                <span className="text-brand-muted">·</span>
                <span>{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
              </span>
            ) : (
              'Selecione um registro'
            )}
          </SheetDescription>
        </SheetHeader>

        {log && (
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
                original={toJsonString(log.oldData)}
                modified={toJsonString(log.newData)}
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
      </SheetContent>
    </Sheet>
  )
}
