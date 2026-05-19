'use client'

import { useEffect, useState, useTransition } from 'react'
import { Save, Loader2, PlusCircle, Upload, Video, ChevronDown } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MediaUploadModal } from './MediaUploadModal'
import { ImagePreviewModal } from './ImagePreviewModal'
import { updatePageContentData } from '@/modules/projects/actions/updatePageContentData'
import { uploadMedia } from '@/modules/upload/actions/uploadMedia'

interface DynamicFormProps {
  pageId: string
  schemaData: unknown
  initialContentData: unknown
  onSave?: () => void
  onChange?: (content: Record<string, unknown>) => void
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
  subFields?: SchemaField[]
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

const TYPE_ALIASES: Record<string, string> = {
  string: 'text',
  bool: 'boolean',
  int: 'number',
  integer: 'number',
  float: 'number',
}

function normalizeType(type: string): string {
  return TYPE_ALIASES[type] ?? type
}

function isFieldDescriptor(val: unknown): val is { type: string; label?: string; options?: SelectOption[]; itemFields?: unknown } {
  return (
    typeof val === 'object' &&
    val !== null &&
    'type' in val &&
    typeof (val as Record<string, unknown>).type === 'string'
  )
}

function normalizeFieldsFromObject(obj: Record<string, unknown>): SchemaField[] {
  return Object.entries(obj).map<SchemaField>(([key, value]) => {
    if (isFieldDescriptor(value)) {
      const desc = value as { type: string; label?: string; options?: SelectOption[]; itemFields?: unknown }
      const field: SchemaField = {
        name: key,
        label: desc.label ?? key,
        type: normalizeType(desc.type),
      }
      if (Array.isArray(desc.options)) field.options = desc.options
      if (desc.itemFields) {
        if (Array.isArray(desc.itemFields)) {
          field.itemFields = desc.itemFields as SchemaField[]
        } else if (typeof desc.itemFields === 'object' && desc.itemFields !== null) {
          field.itemFields = normalizeFieldsFromObject(desc.itemFields as Record<string, unknown>)
        }
      }
      return field
    }
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return {
        name: key,
        label: key,
        type: 'group',
        subFields: normalizeFieldsFromObject(value as Record<string, unknown>),
      }
    }
    return { name: key, label: key, type: 'text' }
  })
}

function normalizeSchema(schemaData: unknown): SchemaSection[] {
  if (Array.isArray(schemaData)) {
    return schemaData.map((s) => {
      const section = s as SchemaSection
      const fields = Array.isArray(section.fields)
        ? section.fields.map((f) => ({ ...f, type: normalizeType(f.type) }))
        : []
      return { ...section, fields }
    })
  }
  if (schemaData && typeof schemaData === 'object') {
    const obj = schemaData as Record<string, unknown>
    if ('sections' in obj && Array.isArray(obj.sections)) {
      return normalizeSchema(obj.sections)
    }
    return Object.entries(obj).map<SchemaSection>(([key, value]) => ({
      id: key,
      name: key,
      fields:
        typeof value === 'object' && value !== null && !Array.isArray(value)
          ? normalizeFieldsFromObject(value as Record<string, unknown>)
          : [],
    }))
  }
  return []
}

interface MediaModalState {
  open: boolean
  sectionKey: string
  fieldName: string
  mediaType: 'image' | 'video'
  isListItem?: boolean
  listFieldName?: string
  listIndex?: number
  groupName?: string
}

interface ImagePreviewState {
  open: boolean
  imageUrl: string
  sectionKey: string
  fieldName: string
  isListItem?: boolean
  listFieldName?: string
  listIndex?: number
  groupName?: string
}

export function DynamicForm({ pageId, schemaData, initialContentData, onSave, onChange }: DynamicFormProps) {
  const [content, setContent] = useState<Record<string, unknown>>(
    typeof initialContentData === 'object' && initialContentData !== null
      ? (initialContentData as Record<string, unknown>)
      : {},
  )
  useEffect(() => {
    onChange?.(content)
  }, [content, onChange])
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
  const [imagePreview, setImagePreview] = useState<ImagePreviewState>({
    open: false,
    imageUrl: '',
    sectionKey: '',
    fieldName: '',
  })

  const sections: SchemaSection[] = normalizeSchema(schemaData)

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

  const handleGroupChange = (
    sectionKey: string,
    groupName: string,
    subFieldName: string,
    value: unknown,
  ) => {
    setContent((prev) => {
      const sectionData =
        typeof prev[sectionKey] === 'object' && prev[sectionKey] !== null
          ? { ...(prev[sectionKey] as Record<string, unknown>) }
          : {}
      const groupData =
        typeof sectionData[groupName] === 'object' && sectionData[groupName] !== null
          ? { ...(sectionData[groupName] as Record<string, unknown>) }
          : {}
      groupData[subFieldName] = value
      sectionData[groupName] = groupData
      return { ...prev, [sectionKey]: sectionData }
    })
  }

  const handleSave = () => {
    setMessage(null)
    startTransition(async () => {
      const result = await updatePageContentData({ pageId, contentData: content })
      if (result.ok) {
        setMessage({ type: 'success', text: 'Conteúdo salvo com sucesso!' })
        onSave?.()
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
    groupName?: string,
  ) => {
    setMediaModal({
      open: true,
      sectionKey,
      fieldName,
      mediaType,
      isListItem,
      listFieldName,
      listIndex,
      groupName,
    })
  }

  const handleMediaModalClose = () => {
    setMediaModal({ ...mediaModal, open: false })
  }

  const handleMediaModalUrlSubmit = (url: string) => {
    const { sectionKey, fieldName, isListItem, listFieldName, listIndex, groupName } = mediaModal

    if (isListItem && listFieldName && listIndex !== undefined) {
      handleListItemChange(sectionKey, listFieldName, listIndex, fieldName, url)
    } else if (groupName) {
      handleGroupChange(sectionKey, groupName, fieldName, url)
    } else {
      handleChange(sectionKey, fieldName, url)
    }

    setMediaModal({ ...mediaModal, open: false })
  }

  const handleImagePreviewOpen = (
    sectionKey: string,
    fieldName: string,
    imageUrl: string,
    isListItem = false,
    listFieldName = '',
    listIndex = 0,
    groupName?: string,
  ) => {
    setImagePreview({
      open: true,
      imageUrl,
      sectionKey,
      fieldName,
      isListItem,
      listFieldName,
      listIndex,
      groupName,
    })
  }

  const handleImagePreviewClose = () => {
    setImagePreview({ ...imagePreview, open: false })
  }

  const handleImagePreviewRemove = () => {
    const { sectionKey, fieldName, isListItem, listFieldName, listIndex, groupName } = imagePreview

    if (isListItem && listFieldName && listIndex !== undefined) {
      handleListItemChange(sectionKey, listFieldName, listIndex, fieldName, '')
    } else if (groupName) {
      handleGroupChange(sectionKey, groupName, fieldName, '')
    } else {
      handleChange(sectionKey, fieldName, '')
    }
  }

  const handleImagePreviewEdit = () => {
    const { sectionKey, fieldName, isListItem, listFieldName, listIndex, groupName } = imagePreview

    handleMediaModalOpen(sectionKey, fieldName, 'image', isListItem, listFieldName, listIndex, groupName)
  }

  const handleMediaModalFileUpload = (file: File) => {
    const { sectionKey, fieldName, isListItem, listFieldName, listIndex, groupName } = mediaModal

    if (isListItem && listFieldName && listIndex !== undefined) {
      handleListMediaUpload(sectionKey, listFieldName, listIndex, fieldName, file)
    } else if (groupName) {
      handleGroupMediaUpload(sectionKey, groupName, fieldName, file)
    } else {
      handleMediaUpload(sectionKey, fieldName, file)
    }
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

  async function handleGroupMediaUpload(
    sectionKey: string,
    groupName: string,
    subFieldName: string,
    file: File | undefined,
  ) {
    if (!file) return
    const key = `${sectionKey}:${groupName}.${subFieldName}`
    setUploadingFields((prev) => new Set([...prev, key]))
    setUploadErrors((prev) => { const n = { ...prev }; delete n[key]; return n })
    const result = await uploadMedia({ file, folder: 'media' })
    setUploadingFields((prev) => { const n = new Set(prev); n.delete(key); return n })
    if (result.ok && result.url) {
      handleGroupChange(sectionKey, groupName, subFieldName, result.url)
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
                              <button
                                type="button"
                                onClick={() => handleImagePreviewOpen(sectionKey, field.name, strValue)}
                                className="relative w-full h-40 rounded-lg overflow-hidden border border-border group bg-brand-bg flex items-center justify-center hover:opacity-90 transition cursor-pointer"
                              >
                                <img src={strValue} alt="" className="w-full h-full object-cover" onDragStart={(e) => e.preventDefault()} />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                                  <span className="text-xs text-white font-medium opacity-0 group-hover:opacity-100">Clique para ampliar</span>
                                </div>
                              </button>
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
                                {isUploadingField ? 'Enviando...' : strValue ? 'Trocar imagem' : 'Adicionar imagem'}
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
                                {isUploadingField ? 'Enviando vídeo...' : strValue ? 'Trocar vídeo' : 'Adicionar vídeo'}
                              </span>
                            </button>
                            {uploadError && (
                              <p className="text-xs text-destructive">{uploadError}</p>
                            )}
                            {strValue && (
                              <>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleChange(sectionKey, field.name, '')}
                                    disabled={isUploadingField}
                                    className="px-3 py-1.5 rounded text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50"
                                  >
                                    Remover vídeo
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  value={strValue}
                                  readOnly
                                  className="w-full bg-brand-bg border border-border rounded-lg px-3 py-1.5 text-xs text-brand-muted font-mono truncate focus:outline-none"
                                />
                              </>
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
                                                    <button
                                                      type="button"
                                                      onClick={() => handleImagePreviewOpen(sectionKey, subField.name, subStr, true, field.name, idx)}
                                                      className="relative w-full h-20 rounded overflow-hidden border border-border group hover:opacity-90 transition cursor-pointer bg-brand-bg flex items-center justify-center"
                                                    >
                                                      <img src={subStr} alt="" className="w-full h-full object-cover" />
                                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                                                        <span className="text-[10px] text-white font-medium opacity-0 group-hover:opacity-100">Ampliar</span>
                                                      </div>
                                                    </button>
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
                        ) : field.type === 'group' ? (
                          <GroupRenderer
                            sectionKey={sectionKey}
                            groupName={field.name}
                            label={label}
                            subFields={field.subFields ?? []}
                            groupData={
                              typeof sectionData[field.name] === 'object' &&
                              sectionData[field.name] !== null &&
                              !Array.isArray(sectionData[field.name])
                                ? (sectionData[field.name] as Record<string, unknown>)
                                : {}
                            }
                            uploadingFields={uploadingFields}
                            uploadErrors={uploadErrors}
                            onChange={handleGroupChange}
                            onMediaOpen={handleMediaModalOpen}
                            onImagePreviewOpen={handleImagePreviewOpen}
                          />
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

      <ImagePreviewModal
        isOpen={imagePreview.open}
        onClose={handleImagePreviewClose}
        imageUrl={imagePreview.imageUrl}
        onRemove={handleImagePreviewRemove}
        onEdit={handleImagePreviewEdit}
      />
    </div>
  )
}

interface GroupRendererProps {
  sectionKey: string
  groupName: string
  label: string
  subFields: SchemaField[]
  groupData: Record<string, unknown>
  uploadingFields: Set<string>
  uploadErrors: Record<string, string>
  onChange: (sectionKey: string, groupName: string, subFieldName: string, value: unknown) => void
  onMediaOpen: (
    sectionKey: string,
    fieldName: string,
    mediaType: 'image' | 'video',
    isListItem?: boolean,
    listFieldName?: string,
    listIndex?: number,
    groupName?: string,
  ) => void
  onImagePreviewOpen: (
    sectionKey: string,
    fieldName: string,
    imageUrl: string,
    isListItem?: boolean,
    listFieldName?: string,
    listIndex?: number,
    groupName?: string,
  ) => void
}

function GroupRenderer({
  sectionKey,
  groupName,
  label,
  subFields,
  groupData,
  uploadingFields,
  uploadErrors,
  onChange,
  onMediaOpen,
  onImagePreviewOpen,
}: GroupRendererProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-brand-bg/40">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-brand-btn-light/20 hover:bg-brand-btn-light/40 transition text-left"
      >
        <span className="text-xs font-semibold text-brand-text uppercase tracking-wide">{label}</span>
        <ChevronDown className={`w-4 h-4 text-brand-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="p-3 space-y-3">
          {subFields.map((sub, idx) => {
            const rawValue = groupData[sub.name]
            const strValue = typeof rawValue === 'string' ? rawValue : ''
            const boolValue = typeof rawValue === 'boolean' ? rawValue : false
            const subLabel = sub.label || sub.name
            const uploadKey = `${sectionKey}:${groupName}.${sub.name}`
            const isUploading = uploadingFields.has(uploadKey)
            const uploadError = uploadErrors[uploadKey]

            return (
              <div key={idx} className="space-y-1.5">
                {sub.type !== 'group' && (
                  <label className="block text-xs font-medium text-brand-muted capitalize">{subLabel}</label>
                )}

                {sub.type === 'textarea' || sub.type === 'html' ? (
                  <textarea
                    value={strValue}
                    onChange={(e) => onChange(sectionKey, groupName, sub.name, e.target.value)}
                    className="w-full min-h-[80px] bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary resize-y"
                    placeholder={`${subLabel}...`}
                  />
                ) : sub.type === 'image' ? (
                  <div className="space-y-1.5">
                    {strValue && (
                      <button
                        type="button"
                        onClick={() => onImagePreviewOpen(sectionKey, sub.name, strValue, false, '', 0, groupName)}
                        className="relative w-full h-32 rounded-lg overflow-hidden border border-border group bg-brand-bg flex items-center justify-center hover:opacity-90 transition cursor-pointer"
                      >
                        <img src={strValue} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                          <span className="text-xs text-white font-medium opacity-0 group-hover:opacity-100">Ampliar</span>
                        </div>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onMediaOpen(sectionKey, sub.name, 'image', false, '', 0, groupName)}
                      disabled={isUploading}
                      className={`w-full flex items-center gap-2 bg-brand-bg border border-border rounded-lg px-3 py-2 hover:bg-brand-btn-light/20 transition ${
                        isUploading ? 'opacity-60 pointer-events-none' : ''
                      }`}
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-brand-muted shrink-0" />
                      ) : (
                        <Upload className="w-4 h-4 text-brand-muted shrink-0" />
                      )}
                      <span className="text-sm text-brand-muted">
                        {isUploading ? 'Enviando...' : strValue ? 'Trocar imagem' : 'Adicionar imagem'}
                      </span>
                    </button>
                    {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
                  </div>
                ) : sub.type === 'video' ? (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => onMediaOpen(sectionKey, sub.name, 'video', false, '', 0, groupName)}
                      disabled={isUploading}
                      className={`w-full flex items-center gap-2 bg-brand-bg border border-border rounded-lg px-3 py-2 hover:bg-brand-btn-light/20 transition ${
                        isUploading ? 'opacity-60 pointer-events-none' : ''
                      }`}
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-brand-muted shrink-0" />
                      ) : (
                        <Video className="w-4 h-4 text-brand-muted shrink-0" />
                      )}
                      <span className="text-sm text-brand-muted">
                        {isUploading ? 'Enviando vídeo...' : strValue ? 'Trocar vídeo' : 'Adicionar vídeo'}
                      </span>
                    </button>
                    {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
                  </div>
                ) : sub.type === 'color' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={strValue || '#000000'}
                      onChange={(e) => onChange(sectionKey, groupName, sub.name, e.target.value)}
                      className="w-10 h-9 p-1 rounded border border-border bg-brand-bg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={strValue}
                      onChange={(e) => onChange(sectionKey, groupName, sub.name, e.target.value)}
                      className="flex-1 bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-brand-text font-mono placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      placeholder="#000000"
                    />
                  </div>
                ) : sub.type === 'boolean' ? (
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={boolValue}
                      onCheckedChange={(checked) => onChange(sectionKey, groupName, sub.name, checked)}
                    />
                    <span className="text-sm text-brand-muted">{boolValue ? 'Ativado' : 'Desativado'}</span>
                  </div>
                ) : sub.type === 'number' ? (
                  <input
                    type="number"
                    value={strValue}
                    onChange={(e) => onChange(sectionKey, groupName, sub.name, e.target.value)}
                    className="w-full bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    placeholder="0"
                  />
                ) : sub.type === 'select' ? (
                  <Select
                    value={strValue}
                    onValueChange={(val) => onChange(sectionKey, groupName, sub.name, val)}
                  >
                    <SelectTrigger className="w-full bg-brand-bg border-border text-brand-text h-10">
                      <SelectValue placeholder={`Selecione ${subLabel.toLowerCase()}...`} />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(sub.options) &&
                        sub.options.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : sub.type === 'url' ? (
                  <input
                    type="url"
                    value={strValue}
                    onChange={(e) => onChange(sectionKey, groupName, sub.name, e.target.value)}
                    className="w-full bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    placeholder="https://..."
                  />
                ) : (
                  <input
                    type="text"
                    value={strValue}
                    onChange={(e) => onChange(sectionKey, groupName, sub.name, e.target.value)}
                    className="w-full bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    placeholder={`${subLabel}...`}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
