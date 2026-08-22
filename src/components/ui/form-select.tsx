'use client'

import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface FormSelectOption {
  value: string
  label: string
}

interface FormSelectProps {
  name: string
  options: FormSelectOption[]
  defaultValue?: string
  id?: string
  placeholder?: string
  className?: string
}

/**
 * `Select` do Radix embrulhado para uso em formulário: mesma altura dos `Input` (h-9), largura
 * total e submissão via `name`. Substitui o `<select>` nativo, cujo dropdown é desenhado pelo SO
 * e ignora o tema da aplicação.
 */
export function FormSelect({
  name,
  options,
  defaultValue,
  id,
  placeholder,
  className,
}: FormSelectProps) {
  return (
    <Select name={name} defaultValue={defaultValue}>
      <SelectTrigger id={id} className={cn('h-9 w-full text-brand-text', className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
