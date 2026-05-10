'use client'

import { useState } from 'react'
import { EditorNode } from '@/hooks/use-builder'
import { LayoutForm } from './forms/LayoutForm'
import { VideoPlayer } from './VideoPlayer'

interface PageSettings {
  backgroundColor?: string
  textColor?: string
  fontFamily?: string
}

interface PropertiesPanelProps {
  node: EditorNode | null
  onUpdate: (props: Record<string, unknown>) => void
  pageSettings?: PageSettings
  onUpdatePageSettings?: (settings: PageSettings) => void
}

function PropInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: '#161718' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-brand-muted/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
      />
    </div>
  )
}

function ColorPicker({
  label,
  value,
  onChange,
  defaultValue,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  defaultValue: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: '#161718' }}>
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value || defaultValue}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-14 rounded cursor-pointer border border-brand-muted/40"
        />
        <input
          type="text"
          value={value || defaultValue}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-brand-muted/40 rounded-lg text-sm uppercase"
        />
      </div>
    </div>
  )
}

function SpacingControl({
  label,
  values,
  onChange,
}: {
  label: string
  values: { top: string; right: string; bottom: string; left: string }
  onChange: (side: 'top' | 'right' | 'bottom' | 'left', value: string) => void
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: '#161718' }}>
        {label}
      </label>
      <div className="grid grid-cols-2 gap-2">
        <PropInput label="Top" value={values.top} onChange={(v) => onChange('top', v)} />
        <PropInput label="Right" value={values.right} onChange={(v) => onChange('right', v)} />
        <PropInput label="Bottom" value={values.bottom} onChange={(v) => onChange('bottom', v)} />
        <PropInput label="Left" value={values.left} onChange={(v) => onChange('left', v)} />
      </div>
    </div>
  )
}

export function PropertiesPanel({
  node,
  onUpdate,
  pageSettings,
  onUpdatePageSettings,
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<'element' | 'global'>('element')

  const style = (node?.props?.style as Record<string, string>) || {}

  const renderGlobalSettings = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-muted mb-3">
          Estilos Globais
        </h3>
        <div className="space-y-4">
          <ColorPicker
            label="Cor de Fundo Global"
            value={pageSettings?.backgroundColor || ''}
            defaultValue="#F5F5F5"
            onChange={(value) => onUpdatePageSettings?.({ ...pageSettings, backgroundColor: value })}
          />
          <ColorPicker
            label="Cor de Texto Principal"
            value={pageSettings?.textColor || ''}
            defaultValue="#161718"
            onChange={(value) => onUpdatePageSettings?.({ ...pageSettings, textColor: value })}
          />
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#161718' }}>
              Fonte Base
            </label>
            <select
              value={pageSettings?.fontFamily || ''}
              onChange={(e) => onUpdatePageSettings?.({ ...pageSettings, fontFamily: e.target.value })}
              className="w-full px-3 py-2 border border-brand-muted/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">Padrão do Sistema</option>
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Playfair Display">Playfair Display</option>
              <option value="Merriweather">Merriweather</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )

  const updateStyle = (key: string, value: string) => {
    if (node) {
      onUpdate({
        style: { ...style, [key]: value },
      })
    }
  }

  const renderLayoutSection = () => (
    <div className="border-b border-brand-muted/20 pb-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-muted mb-3">
        Layout
      </h3>
      <div className="space-y-4">
        <SpacingControl
          label="Margin"
          values={{
            top: (style.marginTop as string) || '',
            right: (style.marginRight as string) || '',
            bottom: (style.marginBottom as string) || '',
            left: (style.marginLeft as string) || '',
          }}
          onChange={(side, value) => updateStyle(`margin${side.charAt(0).toUpperCase() + side.slice(1)}`, value)}
        />
        <SpacingControl
          label="Padding"
          values={{
            top: (style.paddingTop as string) || '',
            right: (style.paddingRight as string) || '',
            bottom: (style.paddingBottom as string) || '',
            left: (style.paddingLeft as string) || '',
          }}
          onChange={(side, value) => updateStyle(`padding${side.charAt(0).toUpperCase() + side.slice(1)}`, value)}
        />
      </div>
    </div>
  )

  const renderTypographySection = () => {
    if (!node || (node.type !== 'Text' && node.type !== 'Heading')) return null

    return (
      <div className="border-b border-brand-muted/20 pb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-muted mb-3">
          Tipografia
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#161718' }}>
              Conteúdo
            </label>
            <textarea
              value={(node.props.content as string) || ''}
              onChange={(e) => onUpdate({ content: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-brand-muted/40 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#161718' }}>
                Tamanho
              </label>
              <select
                value={(node.props.fontSize as string) || ''}
                onChange={(e) => onUpdate({ fontSize: e.target.value })}
                className="w-full px-3 py-2 border border-brand-muted/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Padrão</option>
                <option value="12px">12px</option>
                <option value="14px">14px</option>
                <option value="16px">16px</option>
                <option value="18px">18px</option>
                <option value="20px">20px</option>
                <option value="24px">24px</option>
                <option value="32px">32px</option>
                <option value="48px">48px</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#161718' }}>
                Peso
              </label>
              <select
                value={(node.props.fontWeight as string) || ''}
                onChange={(e) => onUpdate({ fontWeight: e.target.value })}
                className="w-full px-3 py-2 border border-brand-muted/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Padrão</option>
                <option value="400">Normal (400)</option>
                <option value="500">Medium (500)</option>
                <option value="600">Semibold (600)</option>
                <option value="700">Bold (700)</option>
                <option value="900">Black (900)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#161718' }}>
              Alinhamento
            </label>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => onUpdate({ textAlign: align })}
                  className={`flex-1 py-1.5 px-2 rounded text-xs capitalize transition-colors ${
                    node.props.textAlign === align
                      ? 'bg-blue-500 text-white'
                      : 'bg-brand-muted/10 hover:bg-brand-muted/20'
                  }`}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>

          <ColorPicker
            label="Cor do Texto"
            value={(node.props.color as string) || ''}
            defaultValue="#161718"
            onChange={(value) => onUpdate({ color: value })}
          />
        </div>
      </div>
    )
  }

  const renderAppearanceSection = () => {
    if (!node) return null

    switch (node.type) {
      case 'Button':
        return (
          <div className="border-b border-brand-muted/20 pb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-muted mb-3">
              Aparência
            </h3>
            <div className="space-y-3">
              <PropInput
                label="Texto"
                value={(node.props.text as string) || ''}
                onChange={(v) => onUpdate({ text: v })}
              />
              <ColorPicker
                label="Cor de Fundo"
                value={(node.props.bgColor as string) || ''}
                defaultValue="#514030"
                onChange={(value) => onUpdate({ bgColor: value })}
              />
              <PropInput
                label="Border Radius"
                value={(node.props.borderRadius as string) || ''}
                onChange={(v) => onUpdate({ borderRadius: v })}
                placeholder="ex: 8px"
              />
            </div>
          </div>
        )

      case 'Hero':
        return (
          <div className="border-b border-brand-muted/20 pb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-muted mb-3">
              Aparência
            </h3>
            <div className="space-y-3">
              <PropInput
                label="Título"
                value={(node.props.title as string) || ''}
                onChange={(v) => onUpdate({ title: v })}
              />
              <PropInput
                label="Subtítulo"
                value={(node.props.subtitle as string) || ''}
                onChange={(v) => onUpdate({ subtitle: v })}
              />
              <ColorPicker
                label="Cor de Fundo"
                value={(node.props.bgColor as string) || ''}
                defaultValue="#EBE6DA"
                onChange={(value) => onUpdate({ bgColor: value })}
              />
              <ColorPicker
                label="Cor do Texto"
                value={(node.props.textColor as string) || ''}
                defaultValue="#161718"
                onChange={(value) => onUpdate({ textColor: value })}
              />
            </div>
          </div>
        )

      case 'Section':
      case 'Container':
        return (
          <div className="border-b border-brand-muted/20 pb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-muted mb-3">
              Layout e Dimensionamento
            </h3>
            <LayoutForm style={style} onUpdate={updateStyle} />
            <div className="mt-4 space-y-3">
              <ColorPicker
                label="Cor de Fundo"
                value={(node.props.backgroundColor as string) || ''}
                defaultValue="transparent"
                onChange={(value) => onUpdate({ backgroundColor: value })}
              />
              <PropInput
                label="Largura"
                value={(node.props.width as string) || ''}
                onChange={(v) => onUpdate({ width: v })}
                placeholder="px ou %"
              />
              <PropInput
                label="Altura"
                value={(node.props.height as string) || ''}
                onChange={(v) => onUpdate({ height: v })}
                placeholder="px ou %"
              />
            </div>
          </div>
        )

      case 'Video':
        return (
          <div className="border-b border-brand-muted/20 pb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-muted mb-3">
              Configurações de Vídeo
            </h3>
            <VideoPlayer node={node} onUpdate={onUpdate} />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <aside className="w-72 border-l border-brand-muted/40 bg-white overflow-y-auto flex flex-col">
      <div className="flex border-b border-brand-muted/40">
        <button
          onClick={() => setActiveTab('element')}
          className={`flex-1 py-3 text-sm font-medium transition ${
            activeTab === 'element'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-brand-muted hover:text-brand-primary'
          }`}
        >
          Elemento
        </button>
        <button
          onClick={() => setActiveTab('global')}
          className={`flex-1 py-3 text-sm font-medium transition ${
            activeTab === 'global'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-brand-muted hover:text-brand-primary'
          }`}
        >
          Global
        </button>
      </div>

      <div className="flex-1 p-5 overflow-y-auto">
        {activeTab === 'global' ? (
          renderGlobalSettings()
        ) : node ? (
          <div className="space-y-5">
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#161718' }}>
              {node.type}
            </h2>
            {renderLayoutSection()}
            {renderTypographySection()}
            {renderAppearanceSection()}
          </div>
        ) : (
          <div className="bg-brand-muted/10 p-4 rounded-lg text-center mt-4">
            <p className="text-xs text-brand-muted">
              Selecione um componente para editar suas propriedades
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}

