'use client'

import { useState, useMemo, useCallback } from 'react'
import * as LucideIcons from 'lucide-react'
import { X, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const ALL_ICON_NAMES: string[] = Object.keys(LucideIcons).filter(
  (k) =>
    !k.endsWith('Icon') &&
    k !== 'LucideProvider' &&
    k !== 'createLucideIcon' &&
    k !== 'useLucideContext',
)

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (LucideIcons as Record<string, unknown>)[name] as React.ComponentType<{
    className?: string
    size?: number
  }>
  if (!Icon) return null
  return <Icon className={className} size={16} />
}

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
}

const MAX_VISIBLE = 300

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ALL_ICON_NAMES.slice(0, MAX_VISIBLE)
    return ALL_ICON_NAMES.filter((n) => n.toLowerCase().includes(q)).slice(0, MAX_VISIBLE)
  }, [query])

  const handleSelect = useCallback(
    (name: string) => {
      onChange(name)
      setOpen(false)
      setQuery('')
    },
    [onChange],
  )

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onChange('')
    },
    [onChange],
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-brand-text hover:bg-brand-btn-light/20 transition text-left"
      >
        {value ? (
          <>
            <DynamicIcon name={value} className="shrink-0 text-brand-text" />
            <span className="flex-1 font-mono text-xs truncate">{value}</span>
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && onChange('')}
              className="p-0.5 rounded hover:bg-brand-btn-light text-brand-muted hover:text-brand-text transition"
            >
              <X className="w-3 h-3" />
            </span>
          </>
        ) : (
          <span className="text-brand-muted flex-1">Selecionar ícone...</span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl h-[70vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-4 pt-4 pb-3 border-b border-border shrink-0">
            <DialogTitle className="text-sm">Selecionar Ícone</DialogTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-muted" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar ícone..."
                className="w-full bg-brand-bg border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <p className="text-[10px] text-brand-muted mt-1.5">
              {filtered.length === MAX_VISIBLE
                ? `Exibindo ${MAX_VISIBLE} de ${query ? ALL_ICON_NAMES.filter((n) => n.toLowerCase().includes(query.toLowerCase())).length : ALL_ICON_NAMES.length} ícones`
                : `${filtered.length} ícone${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`}
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-1">
              {filtered.map((name) => (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => handleSelect(name)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-lg text-center transition hover:bg-brand-btn-light/40 ${
                    value === name
                      ? 'bg-brand-primary/10 ring-1 ring-brand-primary text-brand-primary'
                      : 'text-brand-muted hover:text-brand-text'
                  }`}
                >
                  <DynamicIcon name={name} className="shrink-0" />
                  <span className="text-[9px] leading-tight truncate w-full">{name}</span>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
