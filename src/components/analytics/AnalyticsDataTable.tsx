'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AnalyticsTableColumn<T> {
  key: string
  label: string
  align?: 'left' | 'right'
  sortable?: boolean
  sortValue?: (row: T) => number | string
  render: (row: T) => React.ReactNode
}

interface Props<T> {
  data: T[]
  columns: AnalyticsTableColumn<T>[]
  defaultSortKey?: string
  defaultSortDir?: 'asc' | 'desc'
  emptyMessage?: string
  getRowKey: (row: T, index: number) => string
}

export function AnalyticsDataTable<T>({
  data,
  columns,
  defaultSortKey,
  defaultSortDir = 'desc',
  emptyMessage,
  getRowKey,
}: Props<T>) {
  const [sortKey, setSortKey] = useState(defaultSortKey ?? columns[0]?.key)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSortDir)

  if (data.length === 0) {
    return (
      <p className="text-sm text-brand-muted text-center py-8">
        {emptyMessage ?? 'Sem dados no período selecionado'}
      </p>
    )
  }

  const activeColumn = columns.find((c) => c.key === sortKey)

  const sorted = [...data].sort((a, b) => {
    if (!activeColumn?.sortValue) return 0
    const av = activeColumn.sortValue(a)
    const bv = activeColumn.sortValue(b)
    if (typeof av === 'string' && typeof bv === 'string') {
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    }
    const an = Number(av)
    const bn = Number(bv)
    return sortDir === 'asc' ? an - bn : bn - an
  })

  function handleSort(key: string, sortable?: boolean) {
    if (!sortable) return
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full text-sm min-w-[480px]">
        <thead>
          <tr className="border-b border-brand-btn-light">
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key, col.sortable)}
                className={cn(
                  'py-2 px-3 font-medium text-[0.7rem] uppercase tracking-wide text-brand-muted whitespace-nowrap',
                  col.align === 'right' ? 'text-right' : 'text-left',
                  col.sortable && 'cursor-pointer hover:text-brand-text select-none',
                )}
              >
                <span
                  className={cn(
                    'inline-flex items-center gap-1',
                    col.align === 'right' && 'justify-end',
                  )}
                >
                  {col.label}
                  {col.sortable &&
                    sortKey === col.key &&
                    (sortDir === 'asc' ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    ))}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-btn-light">
          {sorted.map((row, i) => (
            <tr key={getRowKey(row, i)} className="hover:bg-brand-btn-light/30 transition">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn('py-2.5 px-3', col.align === 'right' ? 'text-right' : 'text-left')}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
