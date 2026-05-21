'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import dynamic from 'next/dynamic'
import { Save, Loader2, CheckCircle2, AlertCircle, Plus, BookOpen, X, Copy } from 'lucide-react'
import { DynamicFieldRenderer } from './DynamicFieldRenderer'
import { MediaUploadModal } from '@/components/schema-builder/MediaUploadModal'
import { updatePageContentData } from '@/modules/projects/actions/updatePageContentData'
import { uploadMedia } from '@/modules/upload/actions/uploadMedia'

const MonacoEditor = dynamic(() => import('@monaco-editor/react').then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-card text-brand-muted">
      <Loader2 className="w-5 h-5 animate-spin" />
    </div>
  ),
})

const INBUILT_TEMPLATES: { label: string; template: Record<string, unknown> }[] = [
  {
    label: 'Hero',
    template: {
      active: true,
      title: '',
      subtitle: '',
      backgroundImage: '',
      backgroundVideo: '',
      cta: { text: 'Saiba Mais', href: '/', icon: 'ArrowRight' },
    },
  },
  {
    label: 'Cards',
    template: {
      title: '',
      items: [
        { title: '', description: '', image: '', icon: '', link: '' },
      ],
    },
  },
  {
    label: 'Equipe',
    template: {
      title: '',
      members: [
        { name: '', role: '', bio: '', photo: '', linkedin: '' },
      ],
    },
  },
  {
    label: 'Depoimentos',
    template: {
      title: '',
      testimonials: [
        { name: '', role: '', company: '', photo: '', text: '' },
      ],
    },
  },
  {
    label: 'FAQ',
    template: {
      title: '',
      items: [
        { question: '', answer: '' },
      ],
    },
  },
  {
    label: 'Parágrafos',
    template: {
      title: '',
      paragraphs: ['', ''],
    },
  },
  {
    label: 'CTA',
    template: {
      title: '',
      subtitle: '',
      backgroundColor: '#000000',
      cta: { text: 'Começar agora', href: '/', icon: 'ArrowRight' },
    },
  },
  {
    label: 'SEO',
    template: {
      metaTitle: '',
      metaDescription: '',
      ogImage: '',
      ogTitle: '',
    },
  },
  {
    label: 'Mídia',
    template: {
      active: true,
      image: '',
      video: '',
      caption: '',
      altText: '',
    },
  },
  {
    label: 'Estatísticas',
    template: {
      title: '',
      items: [
        { label: '', value: 0, suffix: '+', icon: '' },
      ],
    },
  },
]

interface AdvancedJsonEditorProps {
  pageId: string
  data: Record<string, unknown>
  initialUiSchema?: Record<string, unknown>
  onReplaceData?: (data: Record<string, unknown>) => void
  onDataChange?: (data: Record<string, unknown>) => void
  onUiSchemaChange?: (uiSchema: Record<string, unknown>) => void
  onSave?: () => void
  isDevMode: boolean
  showFormPanel?: boolean
}

interface MediaModalState {
  open: boolean
  path: string[]
  mediaType: 'image' | 'video'
}

function setDeep(
  obj: Record<string, unknown>,
  path: string[],
  value: unknown,
): Record<string, unknown> {
  if (path.length === 0) return obj
  const clone = structuredClone(obj)
  let current: Record<string, unknown> | unknown[] = clone
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]
    const nextKey = path[i + 1]
    const isNextIndex = /^\d+$/.test(nextKey)
    if (Array.isArray(current)) {
      const idx = parseInt(key, 10)
      if (current[idx] === undefined || current[idx] === null) {
        current[idx] = isNextIndex ? [] : {}
      }
      current = current[idx] as Record<string, unknown> | unknown[]
    } else {
      const rec = current as Record<string, unknown>
      if (rec[key] === undefined || rec[key] === null) {
        rec[key] = isNextIndex ? [] : {}
      }
      current = rec[key] as Record<string, unknown> | unknown[]
    }
  }
  const lastKey = path[path.length - 1]
  if (Array.isArray(current)) {
    ;(current as unknown[])[parseInt(lastKey, 10)] = value
  } else {
    ;(current as Record<string, unknown>)[lastKey] = value
  }
  return clone
}

export function AdvancedJsonEditor({
  pageId,
  data,
  initialUiSchema = {},
  onReplaceData,
  onDataChange,
  onUiSchemaChange,
  onSave,
  isDevMode,
  showFormPanel = true,
}: AdvancedJsonEditorProps) {
  const [localData, setLocalData] = useState<Record<string, unknown>>(data)
  const [rawJson, setRawJson] = useState(() => JSON.stringify(data, null, 2))
  const [isJsonValid, setIsJsonValid] = useState(true)
  const [uiSchemaLocal, setUiSchemaLocal] = useState<Record<string, unknown>>(initialUiSchema)
  const [rawUiSchema, setRawUiSchema] = useState(() => JSON.stringify(initialUiSchema, null, 2))
  const [isUiSchemaValid, setIsUiSchemaValid] = useState(true)
  const [activeEditorTab, setActiveEditorTab] = useState<'data' | 'ui'>('data')
  const [showDocs, setShowDocs] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )
  const [promptCopied, setPromptCopied] = useState(false)
  const [uploadingPaths, setUploadingPaths] = useState<Set<string>>(new Set())
  const [mediaModal, setMediaModal] = useState<MediaModalState>({
    open: false,
    path: [],
    mediaType: 'image',
  })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const update = () => setIsDark(document.documentElement.classList.contains('dark'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  useEffect(() => {
    if (initialUiSchema && typeof initialUiSchema === 'object' && !Array.isArray(initialUiSchema)) {
      setUiSchemaLocal(initialUiSchema as Record<string, unknown>)
      setRawUiSchema(JSON.stringify(initialUiSchema, null, 2))
    }
  }, [initialUiSchema])

  useEffect(() => {
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      setLocalData(data)
      setRawJson(JSON.stringify(data, null, 2))
    }
  }, [data])

  const fireReplace = useCallback(
    (next: Record<string, unknown>) => {
      if (!onReplaceData) return
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => onReplaceData(next), 400)
    },
    [onReplaceData],
  )

  const handleFieldChange = useCallback(
    (path: string[], value: unknown) => {
      setLocalData((prev) => {
        const next = setDeep(prev, path, value)
        setRawJson(JSON.stringify(next, null, 2))
        fireReplace(next)
        onDataChange?.(next)
        return next
      })
    },
    [fireReplace, onDataChange],
  )

  const handleRawJsonChange = (val: string | undefined) => {
    const str = val ?? ''
    setRawJson(str)
    try {
      const parsed = JSON.parse(str)
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        const next = parsed as Record<string, unknown>
        setLocalData(next)
        setIsJsonValid(true)
        fireReplace(next)
        onDataChange?.(next)
      } else {
        setIsJsonValid(false)
      }
    } catch {
      setIsJsonValid(false)
    }
  }

  const handleRawUiSchemaChange = (val: string | undefined) => {
    const str = val ?? ''
    setRawUiSchema(str)
    try {
      const parsed = JSON.parse(str)
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        const next = parsed as Record<string, unknown>
        setUiSchemaLocal(next)
        setIsUiSchemaValid(true)
        onUiSchemaChange?.(next)
      } else {
        setIsUiSchemaValid(false)
      }
    } catch {
      setIsUiSchemaValid(false)
    }
  }

  const handleInjectTemplate = (label: string, template: Record<string, unknown>) => {
    const key = label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '_')
    const sectionKey = Object.prototype.hasOwnProperty.call(localData, key) ? `${key}_${Date.now()}` : key
    const next = { ...localData, [sectionKey]: template }
    setLocalData(next)
    setRawJson(JSON.stringify(next, null, 2))
    onReplaceData?.(next)
    onDataChange?.(next)
  }

  const handleSave = () => {
    setFeedback(null)
    startTransition(async () => {
      const result = await updatePageContentData({ pageId, contentData: localData })
      if (result.ok) {
        setFeedback({ type: 'success', message: 'Salvo com sucesso!' })
        onSave?.()
        setTimeout(() => setFeedback(null), 3000)
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Erro ao salvar' })
      }
    })
  }

  const handleOpenMediaModal = (path: string[], mediaType: 'image' | 'video') => {
    setMediaModal({ open: true, path, mediaType })
  }

  const handleMediaUrlSubmit = (url: string) => {
    handleFieldChange(mediaModal.path, url)
    setMediaModal((prev) => ({ ...prev, open: false }))
  }

  const handleMediaFileUpload = async (file: File) => {
    const pathKey = mediaModal.path.join('.')
    const currentPath = mediaModal.path
    setUploadingPaths((prev) => new Set([...prev, pathKey]))
    const result = await uploadMedia({ file, folder: 'media' })
    setUploadingPaths((prev) => {
      const n = new Set(prev)
      n.delete(pathKey)
      return n
    })
    if (result.ok && result.url) {
      handleFieldChange(currentPath, result.url)
      setMediaModal((prev) => ({ ...prev, open: false }))
    }
  }

  const handleCopyPrompt = () => {
    const prompt = `Eu tenho um JSON de dados e preciso criar um UI Schema para que meus usuários possam editá-lo de forma amigável.

Meu JSON é:
[COLE SEU JSON AQUI]

Por favor, gere um UI Schema seguindo essas regras:

1. Para cada chave raiz, crie uma entrada com ui:label (nome bonito)
2. Para campos dentro de arrays, use a notação "chave.*.nomeDoCampo"
3. Use ui:widget para definir o tipo de entrada:
   - "text" para textos curtos
   - "textarea" para textos longos
   - "image" para URLs de imagens (com upload)
   - "video" para URLs de vídeos
   - "color" para cores
   - "boolean" para sim/não
   - "icon" para selecionar ícone visual (galeria com todos os ícones lucide)
   - "hidden" para campos técnicos que o usuário não deve ver
4. Adicione ui:description com dicas úteis para o usuário
5. Sempre use emojis nos ui:label para melhorar a UI

Retorne o resultado em JSON válido, pronto para copiar e colar na aba "INTERFACE".`
    navigator.clipboard.writeText(prompt)
    setPromptCopied(true)
    setTimeout(() => setPromptCopied(false), 2000)
  }

  const entries = Object.entries(localData)

  const formPanel = (
    <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2 sm:space-y-3">
      <div className="flex flex-col gap-2 sm:gap-3">
        {entries.map(([key, val]) => {
          const uiEntry = uiSchemaLocal[key]
          const uiConfig =
            typeof uiEntry === 'object' && uiEntry !== null
              ? (uiEntry as {
                  'ui:label'?: string
                  'ui:description'?: string
                  'ui:widget'?: string
                })
              : {}
          if (uiConfig['ui:widget'] === 'hidden') return null
          const label = uiConfig['ui:label'] ?? key
          return (
            <div key={key} className="space-y-1.5">
              <label className="block text-[11px] sm:text-xs font-medium text-brand-muted capitalize truncate">
                {label}
              </label>
              {uiConfig['ui:description'] && (
                <p className="text-[10px] text-brand-muted leading-relaxed">
                  {uiConfig['ui:description']}
                </p>
              )}
              <DynamicFieldRenderer
                dataKey={key}
                value={val}
                path={[key]}
                onChange={handleFieldChange}
                onOpenMediaModal={handleOpenMediaModal}
                uploadingPaths={uploadingPaths}
                uiSchema={uiSchemaLocal}
              />
            </div>
          )
        })}
      </div>
    </div>
  )

  const monacoOptions = {
    minimap: { enabled: false },
    formatOnPaste: true,
    formatOnType: true,
    tabSize: 2,
    fontSize: 13,
    scrollBeyondLastLine: false,
    wordWrap: 'on' as const,
    automaticLayout: true,
  }

  return (
    <div className="flex flex-col h-full bg-sidebar-bg">
      {isDevMode ? (
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
          <div className={`flex flex-col border-b lg:border-b-0 lg:border-r border-border overflow-hidden ${
            showFormPanel ? 'w-full lg:w-2/5' : 'w-full'
          }`}>
            <div className="px-2.5 py-1.5 border-b border-border shrink-0 flex items-center justify-between gap-1.5 bg-card">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveEditorTab('data')}
                  className={`px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide transition ${
                    activeEditorTab === 'data'
                      ? 'bg-brand-primary text-white'
                      : 'text-brand-muted hover:text-brand-text'
                  }`}
                >
                  Dados
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEditorTab('ui')}
                  className={`px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide transition flex items-center gap-1 ${
                    activeEditorTab === 'ui'
                      ? 'bg-brand-primary text-white'
                      : 'text-brand-muted hover:text-brand-text'
                  }`}
                >
                  Interface
                  {!isUiSchemaValid && activeEditorTab !== 'ui' && (
                    <AlertCircle className="w-2.5 h-2.5 text-destructive" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {activeEditorTab === 'data' && !isJsonValid && (
                  <span className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="w-3 h-3" />
                    Inválido
                  </span>
                )}
                {activeEditorTab === 'ui' && !isUiSchemaValid && (
                  <span className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="w-3 h-3" />
                    Inválido
                  </span>
                )}
                {activeEditorTab === 'ui' && (
                  <button
                    type="button"
                    onClick={() => setShowDocs((v) => !v)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition ${
                      showDocs
                        ? 'bg-brand-primary text-white border-brand-primary'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Docs
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-0 relative">
              <div className={activeEditorTab === 'data' ? 'absolute inset-0' : 'hidden'}>
                <MonacoEditor
                  height="100%"
                  language="json"
                  value={rawJson}
                  onChange={handleRawJsonChange}
                  theme={isDark ? 'vs-dark' : 'light'}
                  options={monacoOptions}
                />
              </div>
              <div className={activeEditorTab === 'ui' ? 'absolute inset-0' : 'hidden'}>
                <MonacoEditor
                  height="100%"
                  language="json"
                  value={rawUiSchema}
                  onChange={handleRawUiSchemaChange}
                  theme={isDark ? 'vs-dark' : 'light'}
                  options={monacoOptions}
                />
              </div>
            </div>

            {activeEditorTab === 'data' && (
              <div className="shrink-0 px-2.5 py-1.5 border-t border-border bg-card">
                <p className="text-[10px] font-semibold text-brand-muted uppercase tracking-wide mb-1.5">
                  Templates
                </p>
                <div className="flex flex-wrap gap-1">
                  {INBUILT_TEMPLATES.map((t) => (
                    <button
                      key={t.label}
                      type="button"
                      onClick={() => handleInjectTemplate(t.label, t.template)}
                      className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-brand-btn-light hover:bg-brand-btn-light/80 rounded transition text-brand-text whitespace-nowrap"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {showFormPanel && (
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">{formPanel}</div>
          )}

          {showDocs && (
            <div className="absolute right-0 top-0 h-full w-80 bg-card border-l border-border flex flex-col z-10 shadow-lg">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-brand-muted" />
                  <span className="text-xs font-semibold text-brand-text">📖 Como personalizar a tela do cliente</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDocs(false)}
                  className="p-1 rounded hover:bg-brand-btn-light/40 text-brand-muted hover:text-brand-text transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto text-xs text-brand-muted">
                <div className="px-3 py-3 border-b border-border bg-brand-bg/40">
                  <p className="leading-relaxed text-brand-text">
                    <span className="font-semibold">O JSON de Dados</span> é o motor do site — feito para o sistema ler.
                    O <span className="font-semibold">UI Schema</span> é a &quot;maquiagem&quot; — feito para deixar a tela amigável para o cliente usar.
                  </p>
                  <p className="mt-1.5 leading-relaxed">
                    Ele não altera os dados do banco. Apenas troca nomes, esconde códigos sensíveis e muda o visual das caixinhas.
                  </p>
                </div>

                <div className="px-3 py-3 border-b border-border">
                  <p className="text-[10px] font-semibold text-brand-muted uppercase tracking-wide mb-2.5">
                    1. O que cada comando faz?
                  </p>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <code className="text-[10px] font-mono text-brand-primary bg-brand-bg border border-border rounded px-1.5 py-0.5">ui:label</code>
                        <span className="font-medium text-brand-text">O Nome Bonito</span>
                      </div>
                      <p className="leading-relaxed pl-0.5">Substitui a chave técnica por um nome que qualquer um entenda.</p>
                      <p className="mt-0.5 pl-0.5 text-brand-text/60 italic">Ex: Em vez de <code className="font-mono not-italic">hero_title</code>, o cliente lê &quot;Título Principal&quot;.</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <code className="text-[10px] font-mono text-brand-primary bg-brand-bg border border-border rounded px-1.5 py-0.5">ui:description</code>
                        <span className="font-medium text-brand-text">A Instrução</span>
                      </div>
                      <p className="leading-relaxed pl-0.5">Coloca um textinho de ajuda logo abaixo da caixinha.</p>
                      <p className="mt-0.5 pl-0.5 text-brand-text/60 italic">Ex: &quot;Recomendamos textos com no máximo 3 linhas.&quot;</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <code className="text-[10px] font-mono text-brand-primary bg-brand-bg border border-border rounded px-1.5 py-0.5">ui:widget</code>
                        <span className="font-medium text-brand-text">A Ferramenta</span>
                      </div>
                      <p className="leading-relaxed pl-0.5">Obriga o sistema a usar um formato específico de preenchimento, caso a adivinhação automática falhe.</p>
                      <p className="mt-0.5 pl-0.5 text-brand-text/60 italic">Ex: O sistema achou que <code className="font-mono not-italic">bio</code> era texto curto — você usa <code className="font-mono not-italic">&quot;textarea&quot;</code> para forçar caixa grande.</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <code className="text-[10px] font-mono text-brand-primary bg-brand-bg border border-border rounded px-1.5 py-0.5">hidden</code>
                        <span className="font-medium text-brand-text">O Invisível</span>
                      </div>
                      <p className="leading-relaxed pl-0.5">Esconde o campo da visão do cliente. Perfeito para proteger IDs ou variáveis de sistema.</p>
                    </div>
                  </div>
                </div>

                <div className="px-3 py-3 border-b border-border">
                  <p className="text-[10px] font-semibold text-brand-muted uppercase tracking-wide mb-2.5">
                    2. Caixa de ferramentas (valores do ui:widget)
                  </p>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left pb-1.5 font-semibold text-brand-text text-[10px] pr-3">Palavra</th>
                        <th className="text-left pb-1.5 font-semibold text-brand-text text-[10px]">O que aparece para o cliente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {([
                        ['text', 'Linha de texto normal e curta.'],
                        ['textarea', 'Caixa grande para textos longos (ex: resumos, biografias).'],
                        ['image', 'Botão de fazer upload de foto direto para a nuvem.'],
                        ['video', 'Botão de upload de vídeo.'],
                        ['color', 'Seletor visual de cores (paleta).'],
                        ['boolean', 'Botãozinho de ligar/desligar (Switch).'],
                        ['icon', 'Seletor visual de ícone — abre galeria com todos os ícones disponíveis.'],
                        ['hidden', 'Invisível. O cliente não vê e não consegue alterar.'],
                      ] as [string, string][]).map(([word, desc]) => (
                        <tr key={word} className="border-b border-border/40">
                          <td className="py-1.5 pr-3 align-top">
                            <code className="font-mono text-[10px] text-brand-primary">{word}</code>
                          </td>
                          <td className="py-1.5 leading-relaxed align-top">{desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-3 py-3 border-b border-border">
                  <p className="text-[10px] font-semibold text-brand-muted uppercase tracking-wide mb-1.5">
                    3. A regra do asterisco <code className="text-brand-primary normal-case">*</code> (listas e repetições)
                  </p>
                  <p className="leading-relaxed mb-2">
                    Você não precisa escrever a regra 10 vezes para uma lista com 10 itens. O <code className="font-mono text-brand-primary">*</code> significa <span className="font-medium text-brand-text">&quot;para TODOS os itens desta lista&quot;</span>.
                  </p>
                  <div className="space-y-1.5 bg-brand-bg border border-border rounded p-2">
                    <p><span className="font-medium text-brand-text">Campo único:</span> use o caminho direto — <code className="font-mono text-[10px] text-brand-primary">hero.title</code></p>
                    <p><span className="font-medium text-brand-text">Lista (Array):</span> use asterisco — <code className="font-mono text-[10px] text-brand-primary">cards.*.image</code></p>
                    <p className="text-brand-text/60 italic text-[10px] pt-0.5">Isso avisa: &quot;Vá na lista de cards e transforme a imagem de todos eles num botão de upload&quot;.</p>
                  </div>
                </div>

                <div className="px-3 py-3">
                  <p className="text-[10px] font-semibold text-brand-muted uppercase tracking-wide mb-2">
                    4. Exemplo na prática
                  </p>
                  <pre className="text-[10px] font-mono text-brand-text leading-relaxed bg-brand-bg border border-border rounded p-2 overflow-x-auto whitespace-pre">{`{
  "card": {
    "ui:label": "👥 Integrantes da Equipe"
  },
  "card.*.id": {
    "ui:widget": "hidden"
  },
  "card.*.photo": {
    "ui:label": "Foto de Perfil",
    "ui:widget": "image"
  },
  "card.*.bio": {
    "ui:label": "Biografia / História",
    "ui:description": "Escreva um resumo profissional.",
    "ui:widget": "textarea"
  }
}`}</pre>
                  <div className="mt-2.5 space-y-1.5 bg-brand-bg border border-border rounded p-2">
                    <p className="text-[10px] font-semibold text-brand-text mb-1">O que essa configuração fez na tela do cliente:</p>
                    <p className="leading-relaxed">✅ O bloco ganhou o título <span className="font-medium text-brand-text">&quot;👥 Integrantes da Equipe&quot;</span>.</p>
                    <p className="leading-relaxed">✅ O campo <code className="font-mono text-[10px]">id</code> de todos os cards ficou <span className="font-medium text-brand-text">invisível</span>.</p>
                    <p className="leading-relaxed">✅ O campo <code className="font-mono text-[10px]">photo</code> virou um <span className="font-medium text-brand-text">botão de upload de imagem</span>.</p>
                    <p className="leading-relaxed">✅ O campo <code className="font-mono text-[10px]">bio</code> virou uma <span className="font-medium text-brand-text">caixa de texto grande</span> com instrução embaixo.</p>
                  </div>
                </div>

                <div className="px-3 py-3">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <p className="text-[10px] font-semibold text-brand-muted uppercase tracking-wide">
                      5. Prompt para gerar UI Schema com IA
                    </p>
                    <button
                      type="button"
                      onClick={handleCopyPrompt}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-brand-btn-light hover:bg-brand-btn-light/80 text-brand-text transition"
                      title="Copiar prompt"
                    >
                      <Copy className="w-3 h-3" />
                      {promptCopied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  <p className="leading-relaxed text-[10px] mb-2">Copie e cole este prompt em qualquer IA (ChatGPT, Claude, etc) junto com seu JSON de dados:</p>
                  <pre className="text-[10px] font-mono text-brand-text leading-relaxed bg-brand-bg border border-border rounded p-2 overflow-x-auto whitespace-pre-wrap">{`Eu tenho um JSON de dados e preciso criar um UI Schema para que meus usuários possam editá-lo de forma amigável.

Meu JSON é:
[COLE SEU JSON AQUI]

Por favor, gere um UI Schema seguindo essas regras:

1. Para cada chave raiz, crie uma entrada com ui:label (nome bonito)
2. Para campos dentro de arrays, use a notação "chave.*.nomeDoCampo"
3. Use ui:widget para definir o tipo de entrada:
   - "text" para textos curtos
   - "textarea" para textos longos
   - "image" para URLs de imagens (com upload)
   - "video" para URLs de vídeos
   - "color" para cores
   - "boolean" para sim/não
   - "icon" para selecionar ícone visual (galeria com todos os ícones lucide)
   - "hidden" para campos técnicos que o usuário não deve ver
4. Adicione ui:description com dicas úteis para o usuário
5. Sempre use emojis nos ui:label para melhorar a UI

Retorne o resultado em JSON válido, pronto para copiar e colar na aba "INTERFACE".`}</pre>
                  <p className="text-[10px] text-brand-muted/60 mt-2 italic">Dica: Quanto mais detalhes sobre os dados, melhor será o UI Schema gerado!</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        formPanel
      )}

      {!isDevMode && (
        <div className="shrink-0 px-3 py-2 border-t border-border bg-card flex items-center justify-between gap-2">
          <div className="text-[10px] min-w-0">
            {feedback && (
              <span
                className={`flex items-center gap-1 ${
                  feedback.type === 'success' ? 'text-brand-primary' : 'text-destructive'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                ) : (
                  <AlertCircle className="w-3 h-3 shrink-0" />
                )}
                <span className="truncate">{feedback.message}</span>
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={isPending || !isJsonValid}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-brand-cta text-white hover:bg-brand-cta-hover transition disabled:opacity-60 shrink-0"
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            <span className="hidden sm:inline">{isPending ? 'Salvando...' : 'Salvar'}</span>
          </button>
        </div>
      )}

      <MediaUploadModal
        isOpen={mediaModal.open}
        onClose={() => setMediaModal((prev) => ({ ...prev, open: false }))}
        onUrlSubmit={handleMediaUrlSubmit}
        onFileUpload={handleMediaFileUpload}
        mediaType={mediaModal.mediaType}
        isUploading={uploadingPaths.has(mediaModal.path.join('.'))}
      />
    </div>
  )
}
