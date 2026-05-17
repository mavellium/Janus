'use client'

import { useState, useTransition } from 'react'
import { Save, Loader2, PlusCircle, Upload, Video } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MediaUploadModal } from './MediaUploadModal'
import { updatePageContentData } from '@/modules/projects/actions/updatePageContentData'
import { uploadMedia } from '@/modules/upload/actions/uploadMedia'

interface DynamicFormProps {
  pageId: string
  schemaData: unknown
  initialContentData: unknown
}

type SelectOption = {
  label: string
  value: string
}

type SchemaField = {
  name: string
  label?: string
  type: string
  options?: SelectOption[]
  itemFields?: SchemaField[]
}

type SchemaSection = {
  id?: string
  name?: string
  section?: string
  fields: SchemaField[]
}

function getSectionKey(section: SchemaSection): string {
  return section.id ?? section.name ?? section.section ?? ''
}

function getSectionLabel(section: SchemaSection): string {
  return section.name ?? section.section ?? section.id ?? ''
}

interface MediaModalState {
  open: boolean
  sectionKey: string
  fieldName: string
  mediaType: 'image' | 'video'
  isListItem?: boolean
  listFieldName?: string
  listIndex?: number
}

export function DynamicForm({ pageId, schemaData, initialContentData }: DynamicFormProps) {
  const [content, setContent] = useState<Record<string, unknown>>(
    typeof initialContentData === 'object' && initialContentData !== null
      ? (initialContentData as Record<string, unknown>)
      : {},
  )
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [uploadingFields, setUploadingFields] = useState<Set<string>>(new Set())
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({})
  const [mediaModal, setMediaModal] = useState<MediaModalState>({
    open: false,
    sectionKey: '',
    fieldName: '',
    mediaType: 'image',
  })

  let sections: SchemaSection[] = []
  if (Array.isArray(schemaData)) {
    sections = schemaData
  } else if (schemaData && typeof schemaData === 'object' && 'sections' in schemaData) {
    sections = (schemaData as Record<string, unknown>).sections as SchemaSection[]
  }

  const handleChange = (sectionKey: string, fieldName: string, value: unknown) => {
    setContent((prev) => ({
      ...prev,
      [sectionKey]: {
        ...(typeof prev[sectionKey] === 'object' && prev[sectionKey] !== null
          ? (prev[sectionKey] as Record<string, unknown>)
          : {}),
        [fieldName]: value,
      },
    }))
  }

  const handleSave = () => {
    setMessage(null)
    startTransition(async () => {
      const result = await updatePageContentData({ pageId, contentData: content })
      if (result.ok) {
        setMessage({ type: 'success', text: 'Conteúdo salvo com sucesso!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: result.error ?? 'Erro ao salvar' })
      }
    })
  }

  const handleMediaModalOpen = (
    sectionKey: string,
    fieldName: string,
    mediaType: 'image' | 'video',
    isListItem = false,
    listFieldName = '',
    listIndex = 0,
  ) => {
    setMediaModal({
      open: true,
      sectionKey,
      fieldName,
      mediaType,
      isListItem,
      listFieldName,
      listIndex,
    })
  }

  const handleMediaModalClose = () => {
    setMediaModal({ ...mediaModal, open: false })
  }

  const handleMediaModalUrlSubmit = (url: string) => {
    const { sectionKey, fieldName, isListItem, listFieldName, listIndex } = mediaModal

    if (isListItem && listFieldName && listIndex !== undefined) {
      handleListItemChange(sectionKey, listFieldName, listIndex, fieldName, url)
    } else {
      handleChange(sectionKey, fieldName, url)
    }

    setMediaModal({ ...mediaModal, open: false })
  }

  const handleMediaModalFileUpload = (file: File) => {
    const { sectionKey, fieldName, isListItem, listFieldName, listIndex } = mediaModal

    if (isListItem && listFieldName && listIndex !== undefined) {
      handleListMediaUpload(sectionKey, listFieldName, listIndex, fieldName, file)
    } else {
      handleMediaUpload(sectionKey, fieldName, file)
    }

    setMediaModal({ ...mediaModal, open: false })
  }

  async function handleMediaUpload(
    sectionKey: string,
    fieldName: string,
    file: File | undefined,
  ) {
    if (!file) return
    const key = `${sectionKey}:${fieldName}`
    setUploadingFields((prev) => new Set([...prev, key]))
    setUploadErrors((prev) => { const n = { ...prev }; delete n[key]; return n })
    const result = await uploadMedia({ file, folder: 'media' })
    setUploadingFields((prev) => { const n = new Set(prev); n.delete(key); return n })
    if (result.ok && result.url) {
      handleChange(sectionKey, fieldName, result.url)
    } else {
      setUploadErrors((prev) => ({ ...prev, [key]: result.error ?? 'Erro no upload' }))
    }
  }

  async function handleListMediaUpload(
    sectionKey: string,
    listFieldName: string,
    index: number,
    subFieldName: string,
    file: File | undefined,
  ) {
    if (!file) return
    const key = `${sectionKey}:${listFieldName}.${index}.${subFieldName}`
    setUploadingFields((prev) => new Set([...prev, key]))
    setUploadErrors((prev) => { const n = { ...prev }; delete n[key]; return n })
    const result = await uploadMedia({ file, folder: 'media' })
    setUploadingFields((prev) => { const n = new Set(prev); n.delete(key); return n })
    if (result.ok && result.url) {
      handleListItemChange(sectionKey, listFieldName, index, subFieldName, result.url)
    } else {
      setUploadErrors((prev) => ({ ...prev, [key]: result.error ?? 'Erro no upload' }))
    }
  }

  function getListItems(sectionKey: string, fieldName: string): Record<string, unknown>[] {
    const sectionData =
      typeof content[sectionKey] === 'object' && content[sectionKey] !== null
        ? (content[sectionKey] as Record<string, unknown>)
        : {}
    const val = sectionData[fieldName]
    return Array.isArray(val) ? val as Record<string, unknown>[] : []
  }

  function handleListAdd(sectionKey: string, fieldName: string, itemFields?: SchemaField[]) {
    const base = itemFields?.reduce<Record<string, unknown>>((acc, f) => {
      acc[f.name] = f.type === 'boolean' ? false : f.type === 'number' ? '' : ''
      return acc
    }, {}) ?? {}
    setContent((prev) => {
      const sectionData =
        typeof prev[sectionKey] === 'object' && prev[sectionKey] !== null
          ? { ...(prev[sectionKey] as Record<string, unknown>) }
          : {}
      const arr = Array.isArray(sectionData[fieldName]) ? [...(sectionData[fieldName] as Record<string, unknown>[])] : []
      return {
        ...prev,
        [sectionKey]: {
          ...sectionData,
          [fieldName]: [...arr, base],
        },
      }
    })
  }

  function handleListRemove(sectionKey: string, fieldName: string, index: number) {
    setContent((prev) => {
      const sectionData =
        typeof prev[sectionKey] === 'object' && prev[sectionKey] !== null
          ? { ...(prev[sectionKey] as Record<string, unknown>) }
          : {}
      const arr = Array.isArray(sectionData[fieldName]) ? [...(sectionData[fieldName] as Record<string, unknown>[])] : []
      arr.splice(index, 1)
      return {
        ...prev,
        [sectionKey]: {
          ...sectionData,
          [fieldName]: arr,
        },
      }
    })
  }

  function handleListItemChange(
    sectionKey: string,
    fieldName: string,
    index: number,
    subFieldName: string,
    value: unknown,
  ) {
    setContent((prev) => {
      const sectionData =
        typeof prev[sectionKey] === 'object' && prev[sectionKey] !== null
          ? { ...(prev[sectionKey] as Record<string, unknown>) }
          : {}
      const arr = Array.isArray(sectionData[fieldName]) ? [...(sectionData[fieldName] as Record<string, unknown>[])] : []
      arr[index] = { ...(arr[index] ?? {}), [subFieldName]: value }
      return {
        ...prev,
        [sectionKey]: {
          ...sectionData,
          [fieldName]: arr,
        },
      }
    })
  }

  if (sections.length === 0) {
    return (
      <div className="text-sm text-brand-muted p-4 border border-border rounded-lg bg-card">
        Nenhum schema definido. Vá para &quot;Construir&quot; para criar o schema JSON.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-sidebar-bg">
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {sections.map((section, sIdx) => {
          const sectionKey = getSectionKey(section)
          const sectionData =
            typeof content[sectionKey] === 'object' && content[sectionKey] !== null
              ? (content[sectionKey] as Record<string, unknown>)
              : {}

          return (
            <div key={sIdx} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="bg-brand-btn-light/30 px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-brand-text">{getSectionLabel(section)}</h3>
              </div>
              <div className="p-4 space-y-4">
                {Array.isArray(section.fields) &&
                  section.fields.map((field, fIdx) => {
                    const rawValue = sectionData[field.name]
                    const strValue = typeof rawValue === 'string' ? rawValue : ''
                    const boolValue = typeof rawValue === 'boolean' ? rawValue : false
                    const label = field.label || field.name
                    const uploadKey = `${sectionKey}:${field.name}`
                    const isUploadingField = uploadingFields.has(uploadKey)
                    const uploadError = uploadErrors[uploadKey]

                    return (
                      <div key={fIdx} className="space-y-1.5">
                        <label className="block text-xs font-medium text-brand-muted capitalize">
                          {label}
                        </label>

                        {field.type === 'textarea' ? (
                          <textarea
                            value={strValue}
                            onChange={(e) => handleChange(sectionKey, field.name, e.target.value)}
                            className="w-full min-h-[100px] bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary resize-y"
                            placeholder={`Digite ${label.toLowerCase()}...`}
                          />
                        ) : field.type === 'image' ? (
                          <div className="space-y-2">
                            {strValue && (
                              <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border group cursor-pointer">
                                <img src={strValue} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                  <span className="text-xs text-white font-medium">Clique para alterar</span>
                                </div>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => handleMediaModalOpen(sectionKey, field.name, 'image')}
                              disabled={isUploadingField}
                              className={`w-full flex items-center gap-2 bg-brand-bg border border-border rounded-lg px-3 py-2 hover:bg-brand-btn-light/20 transition ${
                                isUploadingField ? 'opacity-60 pointer-events-none' : ''
                              }`}
                            >
                              {isUploadingField ? (
                                <Loader2 className="w-4 h-4 animate-spin text-brand-muted shrink-0" />
                              ) : (
                                <Upload className="w-4 h-4 text-brand-muted shrink-0" />
                              )}
                              <span className="text-sm text-brand-muted">
                                {isUploadingField ? 'Enviando...' : 'Alterar imagem'}
                              </span>
                            </button>
                            {uploadError && (
                              <p className="text-xs text-destructive">{uploadError}</p>
                            )}
                            {strValue && (
                              <input
                                type="text"
                                value={strValue}
                                readOnly
                                className="w-full bg-brand-bg border border-border rounded-lg px-3 py-1.5 text-xs text-brand-muted font-mono truncate focus:outline-none"
                              />
                            )}
                          </div>
                        ) : field.type === 'number' ? (
                          <input
                            type="number"
                            value={strValue}
                            onChange={(e) => handleChange(sectionKey, field.name, e.target.value)}
                            className="w-full bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            placeholder="0"
                          />
                        ) : field.type === 'color' ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={strValue || '#000000'}
                              onChange={(e) => handleChange(sectionKey, field.name, e.target.value)}
                              className="w-10 h-9 p-1 rounded border border-border bg-brand-bg cursor-pointer"
                            />
                            <input
                              type="text"
                              value={strValue}
                              onChange={(e) => handleChange(sectionKey, field.name, e.target.value)}
                              className="flex-1 bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-brand-text font-mono placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
                              placeholder="#000000"
                            />
                          </div>
                        ) : field.type === 'boolean' ? (
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={boolValue}
                              onCheckedChange={(checked) =>
                                handleChange(sectionKey, field.name, checked)
                              }
                            />
                            <span className="text-sm text-brand-muted">
                              {boolValue ? 'Ativado' : 'Desativado'}
                            </span>
                          </div>
                        ) : field.type === 'select' ? (
                          <Select
                            value={strValue}
                            onValueChange={(val) => handleChange(sectionKey, field.name, val)}
                          >
                            <SelectTrigger className="w-full bg-brand-bg border-border text-brand-text h-10">
                              <SelectValue placeholder={`Selecione ${label.toLowerCase()}...`} />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.isArray(field.options) &&
                                field.options.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        ) : field.type === 'video' ? (
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => handleMediaModalOpen(sectionKey, field.name, 'video')}
                              disabled={isUploadingField}
                              className={`w-full flex items-center gap-2 bg-brand-bg border border-border rounded-lg px-3 py-2 hover:bg-brand-btn-light/20 transition ${
                                isUploadingField ? 'opacity-60 pointer-events-none' : ''
                              }`}
                            >
                              {isUploadingField ? (
                                <Loader2 className="w-4 h-4 animate-spin text-brand-muted shrink-0" />
                              ) : (
                                <Video className="w-4 h-4 text-brand-muted shrink-0" />
                              )}
                              <span className="text-sm text-brand-muted truncate">
                                {isUploadingField ? 'Enviando vídeo...' : 'Alterar vídeo'}
                              </span>
                            </button>
                            {uploadError && (
                              <p className="text-xs text-destructive">{uploadError}</p>
                            )}
                            {strValue && (
                              <input
                                type="text"
                                value={strValue}
                                readOnly
                                className="w-full bg-brand-bg border border-border rounded-lg px-3 py-1.5 text-xs text-brand-muted font-mono truncate focus:outline-none"
                              />
                            )}
                          </div>
                        ) : field.type === 'url' ? (
                          <input
                            type="url"
                            value={strValue}
                            onChange={(e) => handleChange(sectionKey, field.name, e.target.value)}
                            className="w-full bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            placeholder="https://..."
                          />
                        ) : field.type === 'html' ? (
                          <textarea
                            value={strValue}
                            onChange={(e) => handleChange(sectionKey, field.name, e.target.value)}
                            className="w-full min-h-[120px] bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-brand-text font-mono placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary resize-y"
                            placeholder="<h1>Conteúdo HTML...</h1>"
                          />
                        ) : field.type === 'list' ? (
                          <div className="space-y-3">
                            {(() => {
                              const items = getListItems(sectionKey, field.name)
                              return (
                                <>
                                  {items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="bg-brand-bg border border-border rounded-lg p-3 space-y-3"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-brand-muted">
                                          {field.label || field.name} {idx + 1}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleListRemove(sectionKey, field.name, idx)}
                                          className="text-xs text-destructive hover:underline"
                                        >
                                          Remover
                                        </button>
                                      </div>
                                      {Array.isArray(field.itemFields) &&
                                        field.itemFields.map((subField, sIdx) => {
                                          const subRaw = item[subField.name]
                                          const subStr = typeof subRaw === 'string' ? subRaw : ''
                                          const subBool = typeof subRaw === 'boolean' ? subRaw : false
                                          const subLabel = subField.label || subField.name
                                          return (
                                            <div key={sIdx} className="space-y-1">
                                              <label className="block text-[10px] font-medium text-brand-muted/70 uppercase">
                                                {subLabel}
                                              </label>
                                              {subField.type === 'image' ? (
                                                <div className="space-y-1.5">
                                                  {subStr && (
                                                    <div className="relative w-full h-20 rounded overflow-hidden border border-border group cursor-pointer">
                                                      <img src={subStr} alt="" className="w-full h-full object-cover" />
                                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                                        <span className="text-[10px] text-white font-medium">Alterar</span>
                                                      </div>
                                                    </div>
                                                  )}
                                                  <button
                                                    type="button"
                                                    onClick={() => handleMediaModalOpen(sectionKey, subField.name, 'image', true, field.name, idx)}
                                                    className="w-full flex items-center gap-2 bg-brand-bg border border-border rounded px-2.5 py-1.5 hover:bg-brand-btn-light/20 transition text-xs"
                                                  >
                                                    <Upload className="w-3.5 h-3.5 text-brand-muted shrink-0" />
                                                    <span className="text-brand-muted">Alterar imagem</span>
                                                  </button>
                                                </div>
                                              ) : subField.type === 'textarea' ? (
                                                <textarea
                                                  value={subStr}
                                                  onChange={(e) => handleListItemChange(sectionKey, field.name, idx, subField.name, e.target.value)}
                                                  className="w-full min-h-[60px] bg-brand-bg border border-border rounded-lg px-2.5 py-1.5 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary resize-y"
                                                  placeholder={`${subLabel}...`}
                                                />
                                              ) : subField.type === 'boolean' ? (
                                                <Switch
                                                  checked={subBool}
                                                  onCheckedChange={(checked) =>
                                                    handleListItemChange(sectionKey, field.name, idx, subField.name, checked)
                                                  }
                                                />
                                              ) : (
                                                <input
                                                  type="text"
                                                  value={subStr}
                                                  onChange={(e) => handleListItemChange(sectionKey, field.name, idx, subField.name, e.target.value)}
                                                  className="w-full bg-brand-bg border border-border rounded-lg px-2.5 py-1.5 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                                  placeholder={`${subLabel}...`}
                                                />
                                              )}
                                            </div>
                                          )
                                        })}
                                    </div>
                                  )
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleListAdd(sectionKey, field.name, field.itemFields)}
                                    className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-text transition"
                                  >
                                    <PlusCircle className="w-3.5 h-3.5" />
                                    Adicionar {field.label || field.name}
                                  </button>
                                </>
                              )
                            })()}
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={strValue}
                            onChange={(e) => handleChange(sectionKey, field.name, e.target.value)}
                            className="w-full bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            placeholder={`Digite ${label.toLowerCase()}...`}
                          />
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="shrink-0 p-4 border-t border-border bg-card flex items-center justify-between">
        <div className="text-xs">
          {message && (
            <span className={message.type === 'success' ? 'text-brand-primary' : 'text-destructive'}>
              {message.text}
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={isPending || uploadingFields.size > 0}
          className="inline-flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium bg-brand-cta text-white hover:bg-brand-cta-hover transition disabled:opacity-60"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isPending ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      <MediaUploadModal
        isOpen={mediaModal.open}
        onClose={handleMediaModalClose}
        onUrlSubmit={handleMediaModalUrlSubmit}
        onFileUpload={handleMediaModalFileUpload}
        mediaType={mediaModal.mediaType}
        isUploading={uploadingFields.has(`${mediaModal.sectionKey}:${mediaModal.fieldName}`)}
        uploadError={uploadErrors[`${mediaModal.sectionKey}:${mediaModal.fieldName}`]}
      />
    </div>
  )
}
