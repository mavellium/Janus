'use client'

import { useState, useCallback, forwardRef } from 'react'
import { AlertCircle } from 'lucide-react'

interface SlugInputProps {
  name?: string
  defaultValue?: string
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  id?: string
  autoFocus?: boolean
  label?: string
  helperText?: string
}

const INVALID_CHARS_REGEX = /[^a-z0-9-]/g
const VALID_KEY_REGEX = /^[a-z0-9-]$/

export const SlugInput = forwardRef<HTMLInputElement, SlugInputProps>(
  function SlugInput(
    {
      name,
      defaultValue,
      value,
      onChange,
      placeholder = 'acme-corp',
      required = false,
      disabled = false,
      className = '',
      id,
      autoFocus,
      label = 'Slug',
      helperText = 'Apenas letras minúsculas, números e hífens',
    },
    ref
  ) {
    const isControlled = value !== undefined && onChange !== undefined
    const [internalValue, setInternalValue] = useState(defaultValue ?? '')
    const [isInvalid, setIsInvalid] = useState(false)

    const currentValue = isControlled ? value : internalValue

    function sanitizeSlug(input: string): string {
      return input.toLowerCase().replace(INVALID_CHARS_REGEX, '').replace(/-{2,}/g, '-')
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const raw = e.target.value
      const sanitized = sanitizeSlug(raw)

      if (raw !== sanitized) {
        setIsInvalid(true)
        setTimeout(() => setIsInvalid(false), 600)
      }

      if (isControlled) {
        onChange!(sanitized)
      } else {
        setInternalValue(sanitized)
      }
    }

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return
        if (e.key.length === 1 && !VALID_KEY_REGEX.test(e.key)) {
          e.preventDefault()
          setIsInvalid(true)
          setTimeout(() => setIsInvalid(false), 600)
        }
      },
      []
    )

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-brand-text">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          name={name}
          type="text"
          value={currentValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete="off"
          inputMode="url"
          className={`
            flex h-10 w-full rounded-md border bg-brand-bg px-3 py-2 text-sm text-brand-text
            placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary
            disabled:cursor-not-allowed disabled:opacity-50 font-mono
            transition-colors duration-200
            ${isInvalid ? 'border-destructive focus:ring-destructive animate-pulse' : 'border-brand-btn-light'}
            ${className}
          `}
        />
        <div className="flex items-center gap-1.5">
          {isInvalid && <AlertCircle className="w-3 h-3 text-destructive shrink-0" />}
          <p className={`text-[11px] ${isInvalid ? 'text-destructive' : 'text-brand-muted'}`}>
            {helperText}
          </p>
        </div>
      </div>
    )
  }
)
