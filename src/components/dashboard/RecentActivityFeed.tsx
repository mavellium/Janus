import { Activity, FilePlus2, Pencil, Trash2, RotateCcw } from 'lucide-react'
import type { CompanyActivityEntry } from '@/modules/companies/queries/getRecentCompanyActivity'
import type { AuditActionType } from '@/lib/audit-logger'

const ACTION_VERBS: Record<AuditActionType, string> = {
  CREATE: 'criou',
  UPDATE: 'atualizou',
  DELETE: 'excluiu',
  RESTORE: 'restaurou',
}

const ENTITY_LABELS: Record<string, { article: string; noun: string }> = {
  Project: { article: 'o', noun: 'projeto' },
  Page: { article: 'a', noun: 'página' },
  BlogPost: { article: 'o', noun: 'post' },
  BlogCategory: { article: 'a', noun: 'categoria do blog' },
  BlogTag: { article: 'a', noun: 'tag do blog' },
}

const ACTION_ICONS: Record<AuditActionType, typeof FilePlus2> = {
  CREATE: FilePlus2,
  UPDATE: Pencil,
  DELETE: Trash2,
  RESTORE: RotateCcw,
}

const relativeFormatter = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

function relativeTime(date: Date): string {
  const diffMs = date.getTime() - Date.now()
  const diffMinutes = Math.round(diffMs / 60_000)
  if (Math.abs(diffMinutes) < 60) return relativeFormatter.format(diffMinutes, 'minute')
  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) return relativeFormatter.format(diffHours, 'hour')
  const diffDays = Math.round(diffHours / 24)
  return relativeFormatter.format(diffDays, 'day')
}

function describe(entry: CompanyActivityEntry): string {
  const verb = ACTION_VERBS[entry.action]
  const entity = ENTITY_LABELS[entry.entity] ?? { article: 'o', noun: 'item' }
  const label = entry.entityLabel ? ` "${entry.entityLabel}"` : ''
  return `${verb} ${entity.article} ${entity.noun}${label}`
}

export function RecentActivityFeed({ entries }: { entries: CompanyActivityEntry[] }) {
  return (
    <div className="bg-card rounded-xl border border-brand-btn-light p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-brand-primary" />
        <h3 className="text-lg font-semibold text-brand-text">Atividade recente</h3>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-brand-muted">Nenhuma atividade recente da sua equipe.</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => {
            const Icon = ACTION_ICONS[entry.action]
            return (
              <li key={entry.id} className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-brand-btn-light/60 flex items-center justify-center">
                  <Icon size={13} className="text-brand-muted" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-brand-text">
                    <span className="font-medium">{entry.actorName}</span> {describe(entry)}
                  </p>
                  <p className="text-xs text-brand-muted mt-0.5">
                    {relativeTime(entry.createdAt)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
