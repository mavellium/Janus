'use client'

import { Image as ImageIcon, ChevronDown, PlusCircle, Video } from 'lucide-react'

interface SelectOption {
  label: string
  value: string
}

interface SchemaField {
  name: string
  label?: string
  type: string
  options?: SelectOption[]
  itemFields?: SchemaField[]
}

interface SchemaSection {
  id?: string
  name?: string
  section?: string
  fields: SchemaField[]
}

interface LiveFormPreviewProps {
  sections: SchemaSection[]
  focusedSectionId?: string | null
}

function getSectionLabel(section: SchemaSection): string {
  return section.name ?? section.section ?? section.id ?? ''
}

function getSectionKey(section: SchemaSection, idx: number): string {
  return section.id ?? section.name ?? String(idx)
}

export function LiveFormPreview({ sections, focusedSectionId }: LiveFormPreviewProps) {
  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <p className="text-sm text-brand-muted">Nenhuma seção definida.</p>
        <p className="text-xs text-brand-muted/60 mt-1">Edite o JSON para ver o preview.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5">
      {sections.map((section, idx) => {
        const sectionKey = getSectionKey(section, idx)
        const isFocused = focusedSectionId === sectionKey
        return (
        <div
          id={`section-${sectionKey}`}
          key={sectionKey}
          className={`border rounded-xl overflow-hidden transition-all duration-500 ${
            isFocused ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-border'
          }`}
        >
          <div className="bg-brand-btn-light/20 px-4 py-2.5 border-b border-border">
            <h3 className="text-xs font-semibold text-brand-text">{getSectionLabel(section)}</h3>
          </div>
          <div className="p-4 space-y-3">
            {Array.isArray(section.fields) &&
              section.fields.map((field, fIdx) => (
                <div key={fIdx} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-brand-muted capitalize">
                      {field.label || field.name}
                    </label>
                    <span className="text-[10px] font-mono bg-brand-btn-light/50 text-brand-muted px-1.5 py-0.5 rounded">
                      {field.type}
                    </span>
                  </div>

                  {field.type === 'textarea' ? (
                    <textarea
                      disabled
                      placeholder={`${field.label || field.name}...`}
                      className="w-full min-h-[72px] bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-brand-muted placeholder:text-brand-muted/40 opacity-60 resize-none cursor-not-allowed"
                    />
                  ) : field.type === 'image' ? (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded border border-border bg-brand-bg flex items-center justify-center shrink-0 opacity-60">
                        <ImageIcon className="w-5 h-5 text-brand-muted" />
                      </div>
                      <input
                        type="text"
                        disabled
                        placeholder="https://..."
                        className="flex-1 bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-brand-muted placeholder:text-brand-muted/40 opacity-60 cursor-not-allowed"
                      />
                    </div>
                  ) : field.type === 'number' ? (
                    <input
                      type="number"
                      disabled
                      placeholder="0"
                      className="w-full bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-brand-muted placeholder:text-brand-muted/40 opacity-60 cursor-not-allowed"
                    />
                  ) : field.type === 'color' ? (
                    <div className="flex items-center gap-2 opacity-60">
                      <div className="w-10 h-9 rounded border border-border bg-brand-btn-light shrink-0" />
                      <input
                        type="text"
                        disabled
                        placeholder="#000000"
                        className="flex-1 bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-brand-muted font-mono placeholder:text-brand-muted/40 cursor-not-allowed"
                      />
                    </div>
                  ) : field.type === 'boolean' ? (
                    <div className="flex items-center gap-2 opacity-60">
                      <div className="w-9 h-5 rounded-full bg-brand-btn-light border border-border relative shrink-0">
                        <div className="w-3.5 h-3.5 rounded-full bg-brand-muted absolute top-0.5 left-0.5" />
                      </div>
                      <span className="text-xs text-brand-muted">Desativado</span>
                    </div>
                  ) : field.type === 'select' ? (
                    <div className="relative opacity-60">
                      <div className="w-full bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-brand-muted/40 flex items-center justify-between cursor-not-allowed">
                        <span>
                          {Array.isArray(field.options) && field.options.length > 0
                            ? `Selecione...`
                            : 'Sem opções'}
                        </span>
                        <ChevronDown className="w-4 h-4 text-brand-muted" />
                      </div>
                      {Array.isArray(field.options) && field.options.length > 0 && (
                        <p className="text-[10px] text-brand-muted/60 mt-1">
                          {field.options.map((o) => o.label).join(', ')}
                        </p>
                      )}
                    </div>
                  ) : field.type === 'video' ? (
                    <div className="flex items-center gap-3 opacity-60">
                      <div className="w-12 h-12 rounded border border-border bg-brand-bg flex items-center justify-center shrink-0">
                        <Video className="w-5 h-5 text-brand-muted" />
                      </div>
                      <span className="text-xs text-brand-muted">Arquivo de vídeo</span>
                    </div>
                  ) : field.type === 'url' ? (
                    <input
                      type="text"
                      disabled
                      placeholder="https://..."
                      className="w-full bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-brand-muted placeholder:text-brand-muted/40 opacity-60 cursor-not-allowed"
                    />
                  ) : field.type === 'html' ? (
                    <textarea
                      disabled
                      placeholder="<h1>Conteúdo HTML...</h1>"
                      className="w-full min-h-[88px] bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-brand-muted font-mono placeholder:text-brand-muted/40 opacity-60 resize-none cursor-not-allowed"
                    />
                  ) : field.type === 'list' ? (
                    <div className="space-y-2 opacity-60">
                      <div className="w-full bg-brand-bg border border-border rounded-lg px-3 py-2 text-xs text-brand-muted">
                        {Array.isArray(field.itemFields) && field.itemFields.map((f) => f.label || f.name).join(', ')}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-brand-muted">
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Itens dinâmicos</span>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      disabled
                      placeholder={`${field.label || field.name}...`}
                      className="w-full bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-brand-muted placeholder:text-brand-muted/40 opacity-60 cursor-not-allowed"
                    />
                  )}
                </div>
              ))}
          </div>
        </div>
        )
      })}
    </div>
  )
}
