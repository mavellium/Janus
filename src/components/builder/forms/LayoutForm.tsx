'use client'

import {
  LayoutGrid,
  Grid3X3,
  Box,
  ArrowDown,
  ArrowRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  Space,
} from 'lucide-react'

interface LayoutFormProps {
  style: Record<string, string>
  onUpdate: (key: string, value: string) => void
}

const DISPLAY_OPTIONS = [
  { value: 'block', icon: Box, label: 'Bloco' },
  { value: 'flex', icon: LayoutGrid, label: 'Flex' },
  { value: 'grid', icon: Grid3X3, label: 'Grid' },
]

const FLEX_DIRECTION_OPTIONS = [
  { value: 'row', icon: ArrowRight, label: 'Linha' },
  { value: 'column', icon: ArrowDown, label: 'Coluna' },
]

const ALIGN_ITEMS_OPTIONS = [
  { value: 'flex-start', icon: AlignStartVertical, label: 'Início' },
  { value: 'center', icon: AlignCenterVertical, label: 'Centro' },
  { value: 'flex-end', icon: AlignEndVertical, label: 'Fim' },
]

const JUSTIFY_CONTENT_OPTIONS = [
  { value: 'flex-start', icon: AlignStartHorizontal, label: 'Início' },
  { value: 'center', icon: AlignCenterHorizontal, label: 'Centro' },
  { value: 'flex-end', icon: AlignEndHorizontal, label: 'Fim' },
  { value: 'space-between', icon: Space, label: 'Espaçado' },
]

function ToggleButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2 rounded-lg transition ${
        active
          ? 'bg-brand-primary text-white'
          : 'bg-brand-btn-light/40 text-brand-primary hover:bg-brand-btn-light'
      }`}
    >
      <Icon className="w-4 h-4 mb-1" />
      <span className="text-[10px]">{label}</span>
    </button>
  )
}

function DimensionInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 text-brand-text">
        {label}
      </label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-brand-btn-light rounded-lg text-sm bg-brand-bg text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
      />
    </div>
  )
}

export function LayoutForm({ style, onUpdate }: LayoutFormProps) {
  const display = style.display || 'block'
  const flexDirection = style.flexDirection || 'row'
  const alignItems = style.alignItems || 'stretch'
  const justifyContent = style.justifyContent || 'flex-start'

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-medium mb-2 text-brand-text">
          Dimensões
        </label>
        <div className="grid grid-cols-2 gap-3">
          <DimensionInput
            label="Largura"
            value={style.width}
            onChange={(value) => onUpdate('width', value)}
            placeholder="100%, 100vh, auto, px"
          />
          <DimensionInput
            label="Altura"
            value={style.height}
            onChange={(value) => onUpdate('height', value)}
            placeholder="100%, 100vh, auto, px"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-2 text-brand-text">
          Display
        </label>
        <div className="grid grid-cols-3 gap-2">
          {DISPLAY_OPTIONS.map((option) => (
            <ToggleButton
              key={option.value}
              active={display === option.value}
              onClick={() => onUpdate('display', option.value)}
              icon={option.icon}
              label={option.label}
            />
          ))}
        </div>
      </div>

      {display === 'flex' && (
        <>
          <div>
            <label className="block text-xs font-medium mb-2 text-brand-text">
              Direção
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FLEX_DIRECTION_OPTIONS.map((option) => (
                <ToggleButton
                  key={option.value}
                  active={flexDirection === option.value}
                  onClick={() => onUpdate('flexDirection', option.value)}
                  icon={option.icon}
                  label={option.label}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-2 text-brand-text">
              Alinhamento (Cross Axis)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ALIGN_ITEMS_OPTIONS.map((option) => (
                <ToggleButton
                  key={option.value}
                  active={alignItems === option.value}
                  onClick={() => onUpdate('alignItems', option.value)}
                  icon={option.icon}
                  label={option.label}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-2 text-brand-text">
              Justificação (Main Axis)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {JUSTIFY_CONTENT_OPTIONS.map((option) => (
                <ToggleButton
                  key={option.value}
                  active={justifyContent === option.value}
                  onClick={() => onUpdate('justifyContent', option.value)}
                  icon={option.icon}
                  label={option.label}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
