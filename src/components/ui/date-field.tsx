'use client'

import { useRef, useState } from 'react'
import { CalendarDays, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DateFieldProps {
  name: string
  id?: string
  defaultValue?: string
  className?: string
  clearable?: boolean
}

/**
 * Campo de data com ícone próprio. O indicador nativo do WebKit é uma imagem escura fixa, ilegível
 * no tema dark — escondemos ele e abrimos o mesmo seletor via `showPicker()` a partir do ícone.
 */
export function DateField({
  name,
  id,
  defaultValue = '',
  className,
  clearable = true,
}: DateFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(defaultValue)

  function openPicker() {
    const input = inputRef.current
    if (!input) return
    try {
      input.showPicker()
    } catch {
      input.focus()
    }
  }

  function clear() {
    setValue('')
    inputRef.current?.focus()
  }

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={openPicker}
        tabIndex={-1}
        aria-label="Abrir calendário"
        className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-l-md text-brand-muted transition-colors hover:text-brand-primary"
      >
        <CalendarDays className="h-4 w-4" />
      </button>

      <input
        ref={inputRef}
        id={id}
        type="date"
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className={cn(
          'h-9 w-full rounded-md border border-input bg-transparent pl-9 text-sm text-brand-text transition-colors',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
          clearable && value ? 'pr-9' : 'pr-3',
          '[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden',
        )}
      />

      {clearable && value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Limpar data"
          className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-r-md text-brand-muted transition-colors hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
