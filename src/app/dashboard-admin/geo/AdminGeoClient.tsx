'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Pencil,
  Plus,
  Radar,
  Sparkles,
  Swords,
  Target,
  TrendingUp,
  Eye,
  Trash2,
  X,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormSelect } from '@/components/ui/form-select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScoreRing } from '@/components/seo/ScoreRing'
import {
  createGeoTargetProfile,
  updateGeoTargetProfile,
  archiveGeoTargetProfile,
} from '@/modules/geo/actions/manageGeoProfiles'
import {
  prepareRaioXRun,
  runSingleGeoProbe,
  finalizeRaioXRun,
  getSnapshotDetailsAction,
  type RaioXTask,
  type SingleProbeResultData,
} from '@/modules/geo/actions/runRaioX'
import {
  prepareGeoQuestionGeneration,
  generateOneGeoQuestion,
  saveGeneratedGeoQuestions,
  type GeneratedQuestion,
} from '@/modules/geo/actions/generateGeoQuestions'
import {
  prepareGeoCompetitorSuggestion,
  suggestOneGeoCompetitor,
  saveSuggestedGeoCompetitors,
  type SuggestedCompetitor,
} from '@/modules/geo/actions/suggestGeoCompetitors'
import { normalizeForMatching } from '@/modules/geo/domain/detectMention'
import { LAYER_LABELS, PROVIDER_LABELS } from '@/modules/geo/domain/geoProbe'
import type { GeoProvider, GeoProbeMode, GeoQuestionLayer } from '@/generated/prisma/client'

const QUESTIONS_TO_GENERATE = 10
const MAX_COMPETITORS_TOTAL = 5
const MAX_QUESTIONS_TOTAL = 15

interface CompanyOption {
  id: string
  name: string
}

interface Profile {
  id: string
  companyId: string | null
  name: string
  description: string | null
  industry: string | null
  location: string | null
  website: string | null
  aliases: string[]
  targetAudience: string | null
  differentiators: string | null
  createdAt: Date
  company: CompanyOption | null
}

interface Question {
  id: string
  text: string
  layer: GeoQuestionLayer
  priority: number
  createdAt: Date
}

interface Competitor {
  id: string
  name: string
  aliases: string[]
  website: string | null
  createdAt: Date
}

interface QuestionBreakdown {
  questionId: string
  layer: GeoQuestionLayer
  weight: number
  probesCounted: number
  probesMentioned: number
  mentionRate: number
}

interface Snapshot {
  id: string
  score: number
  breakdown: unknown
  competitorComparison: unknown
  totalCostUsdCents: number
  createdAt: Date
}

const PROVIDER_ENV: Record<GeoProvider, string> = {
  OPENAI: 'OPENAI_API_KEY',
  GEMINI: 'GEMINI_API_KEY',
  PERPLEXITY: 'PERPLEXITY_API_KEY',
  CLAUDE: 'ANTHROPIC_API_KEY',
  GROQ: 'GROQ_API_KEY',
}

function formatCents(cents: number): string {
  return `US$ ${(cents / 100).toFixed(2)}`
}

function ProfileModal({
  mode,
  profile,
  companies,
  onClose,
  onSaved,
}: {
  mode: 'create' | 'edit'
  profile?: Profile
  companies: CompanyOption[]
  onClose: () => void
  onSaved: (id: string) => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const action = mode === 'create' ? createGeoTargetProfile : updateGeoTargetProfile

  function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    if (mode === 'edit' && profile) formData.set('id', profile.id)
    setError(null)
    startTransition(async () => {
      const result = await action(null, formData)
      if (!result.ok) {
        setError(result.error)
        return
      }
      const id = mode === 'create' ? (result.data as { id: string }).id : profile!.id
      onSaved(id)
      onClose()
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nova empresa analisada' : 'Editar empresa analisada'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 -m-1">
          <p className="text-xs text-brand-text-muted">
            Não precisa ser uma empresa cadastrada no Janus — pode ser qualquer negócio. Esse
            contexto orienta as perguntas simuladas de compra enviadas às IAs.
          </p>
          <div className="space-y-2">
            <Label htmlFor="name">Nome da empresa</Label>
            <Input
              id="name"
              name="name"
              required
              minLength={2}
              maxLength={160}
              defaultValue={profile?.name}
              placeholder="Construtora São João"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyId">Cliente do Janus (consome a cota do plano)</Label>
            <FormSelect
              id="companyId"
              name="companyId"
              defaultValue={profile?.companyId ?? 'none'}
              options={[
                { value: 'none', label: 'Nenhum — análise interna, sem cota' },
                ...companies.map((company) => ({ value: company.id, label: company.name })),
              ]}
            />
            <p className="text-xs text-brand-text-muted">
              Vinculando a um cliente, cada execução desconta do limite mensal do plano dele.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">O que a empresa faz</Label>
            <Textarea
              id="description"
              name="description"
              maxLength={2000}
              rows={3}
              defaultValue={profile?.description ?? ''}
              placeholder="Construtora especializada em galpões industriais e obras comerciais na região de Campinas."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="industry">Setor / indústria</Label>
              <Input
                id="industry"
                name="industry"
                maxLength={160}
                defaultValue={profile?.industry ?? ''}
                placeholder="Construção civil"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                name="location"
                maxLength={160}
                defaultValue={profile?.location ?? ''}
                placeholder="Campinas-SP"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Site oficial</Label>
            <Input
              id="website"
              name="website"
              type="url"
              maxLength={300}
              defaultValue={profile?.website ?? ''}
              placeholder="https://exemplo.com.br"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aliases">Apelidos / nomes alternativos (separados por vírgula)</Label>
            <Input
              id="aliases"
              name="aliases"
              defaultValue={profile?.aliases.join(', ') ?? ''}
              placeholder="Construtora SJ, SJ Engenharia"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetAudience">Público-alvo</Label>
            <Textarea
              id="targetAudience"
              name="targetAudience"
              maxLength={1000}
              rows={2}
              defaultValue={profile?.targetAudience ?? ''}
              placeholder="Incorporadoras e indústrias de médio porte buscando construção de galpões."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="differentiators">Diferenciais</Label>
            <Textarea
              id="differentiators"
              name="differentiators"
              maxLength={1000}
              rows={2}
              defaultValue={profile?.differentiators ?? ''}
              placeholder="Entrega em até 90 dias, certificação ISO, garantia estendida."
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface RunProgressItem extends SingleProbeResultData {
  questionText: string
  layer: GeoQuestionLayer
}

function RunProgressPanel({
  tasks,
  completed,
  currentTask,
}: {
  tasks: RaioXTask[]
  completed: RunProgressItem[]
  currentTask: RaioXTask | null
}) {
  const total = tasks.length
  const done = completed.length
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  const mentioned = completed.filter((item) => item.companyMentioned).length
  const errors = completed.filter((item) => Boolean(item.errorMessage)).length

  return (
    <div className="space-y-4 min-w-0 w-full overflow-hidden">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Radar className="h-5 w-5 text-primary animate-pulse" />
          Executando Raio-X
        </h3>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-bg-subtle text-brand-text-muted border border-brand-border">
          {done}/{total} consultas · <span className="text-emerald-500 font-semibold">{mentioned} menções</span> · <span className={errors > 0 ? "text-red-400 font-semibold" : ""}>{errors} erros</span>
        </span>
      </div>

      <div className="h-2 w-full rounded-full bg-brand-border/60 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {currentTask && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-brand-text-muted min-w-0">
          <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
          <div className="min-w-0 flex-1 truncate">
            <span className="font-medium text-foreground">
              {PROVIDER_LABELS[currentTask.provider]}
            </span>{' '}
            <span className="opacity-75">
              ({currentTask.mode === 'LIVE_SEARCH' ? 'busca ao vivo' : 'memória do modelo'})
            </span>{' '}
            — <span className="italic truncate">{currentTask.questionText}</span>
          </div>
        </div>
      )}

      <div className="max-h-[50vh] overflow-y-auto space-y-2.5 pr-1 min-w-0 w-full">
        {[...completed].reverse().map((item, index) => (
          <div
            key={`${item.probeRunId}-${index}`}
            className="flex items-start gap-3 rounded-xl border border-brand-border bg-brand-card/40 p-3.5 text-sm transition-all min-w-0 w-full overflow-hidden"
          >
            {item.errorMessage ? (
              <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            ) : item.companyMentioned ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-4 w-4 text-brand-text-muted/60 flex-shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1 w-full overflow-hidden">
              <div className="flex items-center justify-between gap-2 text-xs text-brand-text-muted mb-1 flex-wrap">
                <span className="font-medium text-foreground bg-brand-border/40 px-2 py-0.5 rounded">
                  {PROVIDER_LABELS[item.provider]}
                </span>
                <span className="text-[11px] opacity-75">
                  {item.mode === 'LIVE_SEARCH' ? 'Busca ao vivo' : 'Memória do modelo'} • {LAYER_LABELS[item.layer]}
                </span>
              </div>
              <p className="font-medium text-xs sm:text-sm text-foreground break-words leading-snug">{item.questionText}</p>
              {item.errorMessage ? (
                <p className="text-xs text-red-400 mt-1.5 p-2 rounded bg-red-500/10 border border-red-500/20 break-words">{item.errorMessage}</p>
              ) : (
                <p className="text-xs text-brand-text-muted mt-1.5 line-clamp-3 leading-relaxed break-words whitespace-normal bg-brand-bg-subtle/50 p-2 rounded border border-brand-border/30">
                  {item.rawResponse}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

type WizardStep = 'context' | 'competitors' | 'questions' | 'running'

const STEP_ORDER: WizardStep[] = ['context', 'competitors', 'questions', 'running']
const STEP_LABELS: Record<WizardStep, string> = {
  context: 'Contexto',
  competitors: 'Concorrentes',
  questions: 'Perguntas',
  running: 'Executando',
}
const STEP_ICONS: Record<Exclude<WizardStep, 'running'>, React.ComponentType<{ className?: string }>> = {
  context: Building2,
  competitors: Swords,
  questions: Target,
}

function WizardStepper({
  current,
  furthestReached,
  onNavigate,
}: {
  current: WizardStep
  furthestReached: WizardStep
  onNavigate: (step: Exclude<WizardStep, 'running'>) => void
}) {
  const stepIndex = STEP_ORDER.indexOf(current)
  const furthestIndex = STEP_ORDER.indexOf(furthestReached)
  const visibleSteps: Exclude<WizardStep, 'running'>[] = ['context', 'competitors', 'questions']

  return (
    <div className="flex items-center gap-1.5 pt-3">
      {visibleSteps.map((s, i) => {
        const Icon = STEP_ICONS[s]
        const isDone = i < stepIndex
        const isCurrent = i === stepIndex
        const isReachable = i <= furthestIndex && i !== stepIndex

        return (
          <div key={s} className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={!isReachable}
              onClick={() => isReachable && onNavigate(s)}
              className={
                isDone
                  ? 'flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-primary transition-colors hover:bg-primary/20 cursor-pointer'
                  : isCurrent
                    ? 'flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-primary-foreground cursor-default'
                    : isReachable
                      ? 'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-brand-text-muted transition-colors hover:bg-brand-border cursor-pointer'
                      : 'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-brand-text-muted opacity-50 cursor-not-allowed'
              }
            >
              {isDone ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              <span className="text-xs font-medium">{STEP_LABELS[s]}</span>
            </button>
            {i < visibleSteps.length - 1 && (
              <div
                className={
                  isDone
                    ? 'h-px w-4 bg-primary/40'
                    : 'h-px w-4 bg-brand-border'
                }
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function AnalyzeWizard({
  profile,
  questions,
  competitors,
  selectedProviders,
  onClose,
  onCompleted,
}: {
  profile: Profile
  questions: Question[]
  competitors: Competitor[]
  selectedProviders: GeoProvider[]
  onClose: () => void
  onCompleted: () => void
}) {
  const [step, setStepRaw] = useState<WizardStep>('context')
  const [furthestReached, setFurthestReached] = useState<WizardStep>('context')

  function setStep(next: WizardStep) {
    setStepRaw(next)
    if (STEP_ORDER.indexOf(next) > STEP_ORDER.indexOf(furthestReached)) {
      setFurthestReached(next)
    }
  }

  // Passo 1 — contexto
  const [contextError, setContextError] = useState<string | null>(null)
  const [isSavingContext, startSavingContext] = useTransition()

  // Passo 2 — concorrentes
  const [competitorCandidates, setCompetitorCandidates] = useState<
    (SuggestedCompetitor & { alreadySaved: boolean })[]
  >([])
  const [competitorIncluded, setCompetitorIncluded] = useState<boolean[]>([])
  const [competitorsLoading, setCompetitorsLoading] = useState(false)
  const [competitorMaxSlots, setCompetitorMaxSlots] = useState(5)
  const [competitorError, setCompetitorError] = useState<string | null>(null)
  const [isSavingCompetitors, setIsSavingCompetitors] = useState(false)

  // Passo 3 — perguntas
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([])
  const [questionIncluded, setQuestionIncluded] = useState<boolean[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [questionsPlanned, setQuestionsPlanned] = useState(QUESTIONS_TO_GENERATE)
  const [questionError, setQuestionError] = useState<string | null>(null)
  const [isSavingQuestions, setIsSavingQuestions] = useState(false)

  // Passo running
  const [runError, setRunError] = useState<string | null>(null)
  const [runErrorCode, setRunErrorCode] = useState<number | null>(null)
  const [runNotice, setRunNotice] = useState<string | null>(null)
  const [runTasks, setRunTasks] = useState<RaioXTask[]>([])
  const [runCompleted, setRunCompleted] = useState<RunProgressItem[]>([])
  const [currentTask, setCurrentTask] = useState<RaioXTask | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  function initCompetitorCandidates() {
    const existing = competitors.map((c) => ({
      name: c.name,
      aliases: c.aliases,
      website: c.website,
      alreadySaved: true,
    }))
    setCompetitorCandidates(existing)
    setCompetitorIncluded(existing.map(() => true))
    return existing
  }

  async function fetchCompetitorSuggestions(baseCandidates: { name: string }[]) {
    setCompetitorsLoading(true)
    setCompetitorError(null)

    const prepared = await prepareGeoCompetitorSuggestion({ profileId: profile.id })
    if (!prepared.ok) {
      setCompetitorError(prepared.error)
      setCompetitorsLoading(false)
      return
    }
    setCompetitorMaxSlots(prepared.data.slots)

    const knownNames = new Set(baseCandidates.map((c) => normalizeForMatching(c.name)))
    let totalCount = baseCandidates.length
    let addedCount = 0
    let lastError: string | null = null
    for (let i = 0; i < prepared.data.slots && totalCount < MAX_COMPETITORS_TOTAL; i++) {
      const result = await suggestOneGeoCompetitor({
        profileId: profile.id,
        existingNames: [...knownNames],
      })
      if (!result.ok) {
        lastError = result.error
        continue
      }
      if (!result.data.competitor) break
      const normalized = normalizeForMatching(result.data.competitor.name)
      if (knownNames.has(normalized)) continue
      knownNames.add(normalized)
      const candidate = { ...result.data.competitor, alreadySaved: false }
      setCompetitorCandidates((current) => [...current, candidate])
      setCompetitorIncluded((current) => [...current, true])
      addedCount++
      totalCount++
    }

    if (addedCount === 0 && lastError) {
      setCompetitorError(lastError)
    }

    setCompetitorsLoading(false)
  }

  function initCompetitorsStep() {
    const existing = initCompetitorCandidates()
    if (existing.length === 0) {
      void fetchCompetitorSuggestions(existing)
    }
  }

  function handleSuggestMoreCompetitors() {
    void fetchCompetitorSuggestions(competitorCandidates)
  }

  async function fetchQuestionSuggestions() {
    setQuestionsLoading(true)
    setQuestionError(null)

    const remainingSlots = MAX_QUESTIONS_TOTAL - questions.length - generatedQuestions.length
    if (remainingSlots < 3) {
      setQuestionsPlanned(0)
      setQuestionsLoading(false)
      return
    }

    const prepared = await prepareGeoQuestionGeneration({
      profileId: profile.id,
      count: Math.min(QUESTIONS_TO_GENERATE, remainingSlots),
    })
    if (!prepared.ok) {
      setQuestionError(prepared.error)
      setQuestionsLoading(false)
      return
    }
    setQuestionsPlanned(prepared.data.layers.length)

    const alreadyGenerated = generatedQuestions.map((q) => q.text)
    const generated: GeneratedQuestion[] = []
    for (const layer of prepared.data.layers) {
      const result = await generateOneGeoQuestion({
        profileId: profile.id,
        layer,
        existingTexts: [...alreadyGenerated, ...generated.map((q) => q.text)],
      })
      if (result.ok) {
        generated.push(result.data)
        setGeneratedQuestions((current) => [...current, result.data])
        setQuestionIncluded((current) => [...current, true])
      }
    }

    setQuestionsLoading(false)
  }

  function initQuestionsStep() {
    if (questions.length === 0) {
      void fetchQuestionSuggestions()
    }
  }

  function handleSuggestMoreQuestions() {
    void fetchQuestionSuggestions()
  }

  function handleAddManualCompetitor(competitor: {
    name: string
    website: string | null
    aliases: string[]
  }) {
    if (competitorCandidates.length >= MAX_COMPETITORS_TOTAL) return
    const normalized = normalizeForMatching(competitor.name)
    const duplicateIndex = competitorCandidates.findIndex(
      (c) => normalizeForMatching(c.name) === normalized,
    )
    if (duplicateIndex >= 0) {
      setCompetitorIncluded((current) =>
        current.map((value, i) => (i === duplicateIndex ? true : value)),
      )
      return
    }
    setCompetitorCandidates((current) => [...current, { ...competitor, alreadySaved: false }])
    setCompetitorIncluded((current) => [...current, true])
  }

  function handleAddManualQuestion(question: GeneratedQuestion) {
    if (questions.length + generatedQuestions.length >= MAX_QUESTIONS_TOTAL) return
    setGeneratedQuestions((current) => [...current, question])
    setQuestionIncluded((current) => [...current, true])
  }

  function handleRemoveCompetitor(index: number) {
    setCompetitorCandidates((current) => current.filter((_, i) => i !== index))
    setCompetitorIncluded((current) => current.filter((_, i) => i !== index))
  }

  function handleRemoveQuestion(index: number) {
    setGeneratedQuestions((current) => current.filter((_, i) => i !== index))
    setQuestionIncluded((current) => current.filter((_, i) => i !== index))
  }

  function handleSaveContext(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    formData.set('id', profile.id)
    setContextError(null)
    startSavingContext(async () => {
      const result = await updateGeoTargetProfile(null, formData)
      if (!result.ok) {
        setContextError(result.error)
        return
      }
      setStep('competitors')
    })
  }

  async function handleConfirmCompetitors() {
    const toSave = competitorCandidates.filter(
      (candidate, index) => competitorIncluded[index] && !candidate.alreadySaved,
    )
    if (toSave.length > 0) {
      setIsSavingCompetitors(true)
      setCompetitorError(null)
      const result = await saveSuggestedGeoCompetitors({
        profileId: profile.id,
        competitors: toSave.map(({ name, aliases, website }) => ({ name, aliases, website })),
      })
      setIsSavingCompetitors(false)
      if (!result.ok) {
        setCompetitorError(result.error)
        return
      }
    }
    setStep('questions')
  }

  async function handleConfirmQuestions() {
    const toSave = generatedQuestions.filter((_, index) => questionIncluded[index])
    if (toSave.length > 0) {
      setIsSavingQuestions(true)
      setQuestionError(null)
      const result = await saveGeneratedGeoQuestions({ profileId: profile.id, questions: toSave })
      setIsSavingQuestions(false)
      if (!result.ok) {
        setQuestionError(result.error)
        return
      }
    }
    setStep('running')
    void handleRun(false)
  }

  async function handleRun(force: boolean) {
    setRunError(null)
    setRunErrorCode(null)
    setRunNotice(null)
    setRunCompleted([])
    setCurrentTask(null)

    const prepared = await prepareRaioXRun({
      profileId: profile.id,
      providers: selectedProviders,
      force,
    })
    if (!prepared.ok) {
      setRunError(prepared.error)
      setRunErrorCode(prepared.code ?? null)
      return
    }

    const { tasks } = prepared.data
    setRunTasks(tasks)
    setIsRunning(true)

    const results: RunProgressItem[] = []
    for (const task of tasks) {
      setCurrentTask(task)
      const probe = await runSingleGeoProbe({
        profileId: profile.id,
        questionId: task.questionId,
        provider: task.provider,
        mode: task.mode,
      })
      if (probe.ok) {
        const item: RunProgressItem = {
          ...probe.data,
          questionText: task.questionText,
          layer: task.layer,
        }
        results.push(item)
        setRunCompleted((current) => [...current, item])
      }
    }
    setCurrentTask(null)

    const modes = [...new Set(tasks.map((task) => task.mode))]
    const finalized = await finalizeRaioXRun({
      profileId: profile.id,
      probeRunIds: results.map((item) => item.probeRunId),
      providers: selectedProviders,
      modes,
    })

    setIsRunning(false)

    if (!finalized.ok) {
      setRunError(finalized.error)
      return
    }

    setRunNotice(
      `Raio-X concluído: IAG Score ${finalized.data.score}/100 em ${finalized.data.probes} consultas` +
        (finalized.data.errors > 0 ? ` (${finalized.data.errors} com erro).` : '.'),
    )
  }

  const competitorSelectedCount = competitorIncluded.filter(Boolean).length
  const questionSelectedCount = questionIncluded.filter(Boolean).length

  return (
    <Dialog open onOpenChange={step === 'running' && isRunning ? undefined : onClose}>
      <DialogContent className="max-w-2xl w-[92vw] overflow-hidden max-h-[85vh] flex flex-col">
        <DialogHeader className="space-y-0 pb-2 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Radar className="h-5 w-5 text-primary" />
            Analisar {profile.name}
          </DialogTitle>
          {step !== 'running' && (
            <WizardStepper
              current={step}
              furthestReached={furthestReached}
              onNavigate={setStep}
            />
          )}
        </DialogHeader>

        <div key={step} className="animate-in fade-in slide-in-from-right-2 duration-200 flex-1 overflow-y-auto min-h-0 pr-1">
        {step === 'context' && (
          <form onSubmit={handleSaveContext} className="space-y-4 p-1">
            <p className="text-sm text-brand-text-muted">
              Confirme o contexto de negócio antes de analisar — ele orienta as perguntas
              simuladas de compra enviadas às IAs.
            </p>
            <div className="space-y-2">
              <Label htmlFor="w-name">Nome da empresa</Label>
              <Input
                id="w-name"
                name="name"
                required
                minLength={2}
                maxLength={160}
                defaultValue={profile.name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="w-description">O que a empresa faz</Label>
              <Textarea
                id="w-description"
                name="description"
                maxLength={2000}
                rows={3}
                defaultValue={profile.description ?? ''}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="w-industry">Setor / indústria</Label>
                <Input
                  id="w-industry"
                  name="industry"
                  maxLength={160}
                  defaultValue={profile.industry ?? ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="w-location">Localização</Label>
                <Input
                  id="w-location"
                  name="location"
                  maxLength={160}
                  defaultValue={profile.location ?? ''}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="w-website">Site oficial</Label>
              <Input
                id="w-website"
                name="website"
                type="url"
                maxLength={300}
                defaultValue={profile.website ?? ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="w-aliases">Apelidos / nomes alternativos (separados por vírgula)</Label>
              <Input id="w-aliases" name="aliases" defaultValue={profile.aliases.join(', ')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="w-targetAudience">Público-alvo</Label>
              <Textarea
                id="w-targetAudience"
                name="targetAudience"
                maxLength={1000}
                rows={2}
                defaultValue={profile.targetAudience ?? ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="w-differentiators">Diferenciais</Label>
              <Textarea
                id="w-differentiators"
                name="differentiators"
                maxLength={1000}
                rows={2}
                defaultValue={profile.differentiators ?? ''}
              />
            </div>
            {contextError && <p className="text-sm text-red-500">{contextError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSavingContext}>
                {isSavingContext && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continuar
              </Button>
            </div>
          </form>
        )}

        {step === 'competitors' && (
          <CompetitorsStep
            loading={competitorsLoading}
            candidates={competitorCandidates}
            included={competitorIncluded}
            setIncluded={setCompetitorIncluded}
            maxSlots={competitorMaxSlots}
            error={competitorError}
            isSaving={isSavingCompetitors}
            selectedCount={competitorSelectedCount}
            onStart={initCompetitorsStep}
            onSuggestMore={handleSuggestMoreCompetitors}
            onAddManual={handleAddManualCompetitor}
            onRemove={handleRemoveCompetitor}
            onBack={() => setStep('context')}
            onCancel={onClose}
            onConfirm={handleConfirmCompetitors}
          />
        )}

        {step === 'questions' && (
          <QuestionsStep
            existingQuestions={questions}
            loading={questionsLoading}
            candidates={generatedQuestions}
            included={questionIncluded}
            setIncluded={setQuestionIncluded}
            planned={questionsPlanned}
            error={questionError}
            isSaving={isSavingQuestions}
            selectedCount={questionSelectedCount}
            onStart={initQuestionsStep}
            onSuggestMore={handleSuggestMoreQuestions}
            onAddManual={handleAddManualQuestion}
            onRemove={handleRemoveQuestion}
            onBack={() => setStep('competitors')}
            onCancel={onClose}
            onConfirm={handleConfirmQuestions}
          />
        )}

        {step === 'running' && (
          <div className="space-y-4">
            {!isRunning && runNotice && (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-emerald-600 dark:text-emerald-400">
                    Análise concluída
                  </p>
                  <p className="text-brand-text-muted">{runNotice}</p>
                </div>
              </div>
            )}
            {runError && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-500">
                <span>{runError}</span>
                {runErrorCode === 429 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0"
                    disabled={isRunning}
                    onClick={() => handleRun(true)}
                  >
                    Forçar nova execução
                  </Button>
                )}
              </div>
            )}
            {(isRunning || runCompleted.length > 0) && (
              <RunProgressPanel tasks={runTasks} completed={runCompleted} currentTask={currentTask} />
            )}
            <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
              {!isRunning && (
                <Button
                  type="button"
                  onClick={() => {
                    onCompleted()
                    onClose()
                  }}
                >
                  {runNotice ? 'Ver resultado' : 'Fechar'}
                </Button>
              )}
            </div>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AddCompetitorForm({
  onAdd,
  onCancel,
}: {
  onAdd: (competitor: { name: string; website: string | null; aliases: string[] }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [aliases, setAliases] = useState('')

  function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    if (name.trim().length < 2) return
    onAdd({
      name: name.trim(),
      website: website.trim() || null,
      aliases: aliases
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3 animate-in fade-in slide-in-from-top-1"
    >
      <div className="grid grid-cols-2 gap-2">
        <Input
          autoFocus
          placeholder="Nome do concorrente"
          value={name}
          onChange={(e) => setName(e.target.value)}
          minLength={2}
          maxLength={120}
          required
        />
        <Input
          type="url"
          placeholder="Site (opcional)"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          maxLength={300}
        />
      </div>
      <Input
        placeholder="Apelidos, separados por vírgula (opcional)"
        value={aliases}
        onChange={(e) => setAliases(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          <X className="mr-1 h-3.5 w-3.5" />
          Cancelar
        </Button>
        <Button type="submit" size="sm">
          <Plus className="mr-1 h-3.5 w-3.5" />
          Adicionar
        </Button>
      </div>
    </form>
  )
}

function CompetitorsStep({
  loading,
  candidates,
  included,
  setIncluded,
  maxSlots,
  error,
  isSaving,
  selectedCount,
  onStart,
  onSuggestMore,
  onAddManual,
  onRemove,
  onBack,
  onCancel,
  onConfirm,
}: {
  loading: boolean
  candidates: (SuggestedCompetitor & { alreadySaved: boolean })[]
  included: boolean[]
  setIncluded: React.Dispatch<React.SetStateAction<boolean[]>>
  maxSlots: number
  error: string | null
  isSaving: boolean
  selectedCount: number
  onStart: () => void
  onSuggestMore: () => void
  onAddManual: (competitor: { name: string; website: string | null; aliases: string[] }) => void
  onRemove: (index: number) => void
  onBack: () => void
  onCancel: () => void
  onConfirm: () => void
}) {
  const [addingManually, setAddingManually] = useState(false)
  const startedRef = useRef(false)
  const atLimit = candidates.length >= MAX_COMPETITORS_TOTAL

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    onStart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-brand-text-muted">
          {candidates.length === 0
            ? 'A IA busca concorrentes prováveis a partir do contexto da empresa, com o site oficial quando souber.'
            : 'Concorrentes já cadastrados aparecem pré-selecionados. Peça mais sugestões à IA ou adicione manualmente quando quiser.'}
        </p>
        {!addingManually && (
          <div className="flex flex-shrink-0 gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={atLimit || loading}
              onClick={onSuggestMore}
            >
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              Sugerir com IA
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={atLimit}
              onClick={() => setAddingManually(true)}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Adicionar manualmente
            </Button>
          </div>
        )}
      </div>

      {atLimit && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
          Limite de {MAX_COMPETITORS_TOTAL} concorrentes atingido. Remova algum da lista para
          adicionar outro.
        </p>
      )}

      {addingManually && !atLimit && (
        <AddCompetitorForm
          onAdd={(competitor) => {
            onAddManual(competitor)
            setAddingManually(false)
          }}
          onCancel={() => setAddingManually(false)}
        />
      )}

      {loading ? (
        <p className="text-sm text-brand-text-muted flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Buscando concorrente {candidates.length + 1} de até {maxSlots}…
        </p>
      ) : (
        candidates.length > 0 && (
          <p className="text-sm text-brand-text-muted">
            {selectedCount} de {candidates.length} selecionados para esta análise.
          </p>
        )
      )}
      <div className="max-h-[42vh] overflow-y-auto space-y-2 p-1 -m-1">
        {candidates.map((competitor, index) => (
          <div
            key={index}
            className="flex items-start gap-3 rounded-lg border border-brand-border p-3 text-sm transition-colors hover:border-primary/40 animate-in fade-in slide-in-from-top-1"
          >
            <label className="flex items-start gap-3 min-w-0 flex-1 cursor-pointer">
              <Checkbox
                checked={included[index]}
                onCheckedChange={(checked) =>
                  setIncluded((current) =>
                    current.map((value, i) => (i === index ? Boolean(checked) : value)),
                  )
                }
                className="mt-0.5"
              />
              <div className="min-w-0">
                <p className="flex items-center gap-2">
                  {competitor.name}
                  {competitor.alreadySaved && (
                    <span className="rounded bg-brand-border px-1.5 py-0.5 text-[10px] text-brand-text-muted">
                      já cadastrado
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-brand-text-muted mt-1">
                  {competitor.website && (
                    <a
                      href={competitor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {competitor.website}
                    </a>
                  )}
                  {competitor.aliases.length > 0 && (
                    <span>Apelidos: {competitor.aliases.join(', ')}</span>
                  )}
                </div>
              </div>
            </label>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 flex-shrink-0 text-brand-text-muted hover:text-red-500"
              onClick={() => onRemove(index)}
              title="Remover da lista"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-brand-border p-3 text-sm text-brand-text-muted">
            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
            Consultando IA…
          </div>
        )}
        {!loading && candidates.length === 0 && !addingManually && (
          <p className="text-sm text-brand-text-muted">
            A IA não encontrou concorrentes plausíveis com o contexto atual. Você pode adicionar
            manualmente.
          </p>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex justify-between gap-2 pt-2 border-t border-brand-border">
        <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="button" onClick={onConfirm} disabled={loading || isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continuar {selectedCount > 0 ? `(${selectedCount})` : ''}
          </Button>
        </div>
      </div>
    </div>
  )
}

const LAYER_ORDER: GeoQuestionLayer[] = ['DECISAO', 'AVALIACAO', 'PROBLEMA']

function AddQuestionForm({
  onAdd,
  onCancel,
}: {
  onAdd: (question: GeneratedQuestion) => void
  onCancel: () => void
}) {
  const [text, setText] = useState('')
  const [layer, setLayer] = useState<GeoQuestionLayer>('DECISAO')

  function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    if (text.trim().length < 10) return
    onAdd({ text: text.trim(), layer })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3 animate-in fade-in slide-in-from-top-1"
    >
      <Input
        autoFocus
        placeholder="Pergunta que o comprador faria à IA"
        value={text}
        onChange={(e) => setText(e.target.value)}
        minLength={10}
        maxLength={500}
        required
      />
      <div className="flex items-center justify-between gap-2">
        <select
          value={layer}
          onChange={(e) => setLayer(e.target.value as GeoQuestionLayer)}
          className="h-9 rounded-md border border-brand-border bg-transparent px-3 text-sm"
        >
          {LAYER_ORDER.map((l) => (
            <option key={l} value={l}>
              {LAYER_LABELS[l]}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            <X className="mr-1 h-3.5 w-3.5" />
            Cancelar
          </Button>
          <Button type="submit" size="sm">
            <Plus className="mr-1 h-3.5 w-3.5" />
            Adicionar
          </Button>
        </div>
      </div>
    </form>
  )
}

function QuestionsStep({
  existingQuestions,
  loading,
  candidates,
  included,
  setIncluded,
  planned,
  error,
  isSaving,
  selectedCount,
  onStart,
  onSuggestMore,
  onAddManual,
  onRemove,
  onBack,
  onCancel,
  onConfirm,
}: {
  existingQuestions: Question[]
  loading: boolean
  candidates: GeneratedQuestion[]
  included: boolean[]
  setIncluded: React.Dispatch<React.SetStateAction<boolean[]>>
  planned: number
  error: string | null
  isSaving: boolean
  selectedCount: number
  onStart: () => void
  onSuggestMore: () => void
  onAddManual: (question: GeneratedQuestion) => void
  onRemove: (index: number) => void
  onBack: () => void
  onCancel: () => void
  onConfirm: () => void
}) {
  const [addingManually, setAddingManually] = useState(false)
  const startedRef = useRef(false)
  const totalCount = existingQuestions.length + candidates.length
  const atLimit = totalCount >= MAX_QUESTIONS_TOTAL

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    onStart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-4">
      {existingQuestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Já cadastradas ({existingQuestions.length})</p>
          <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
            {existingQuestions.map((question) => (
              <div key={question.id} className="rounded-lg border border-brand-border p-2.5 text-sm">
                <p>{question.text}</p>
                <p className="text-xs text-brand-text-muted mt-0.5">{LAYER_LABELS[question.layer]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-brand-text-muted">
          {existingQuestions.length === 0 && candidates.length === 0
            ? `A IA gera até ${QUESTIONS_TO_GENERATE} perguntas de compra, distribuídas nas 3 camadas.`
            : 'Peça mais sugestões à IA ou adicione manualmente quando quiser.'}
        </p>
        {!addingManually && (
          <div className="flex flex-shrink-0 gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={atLimit || loading}
              onClick={onSuggestMore}
            >
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              Sugerir com IA
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={atLimit}
              onClick={() => setAddingManually(true)}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Adicionar manualmente
            </Button>
          </div>
        )}
      </div>

      {atLimit && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
          Limite de {MAX_QUESTIONS_TOTAL} perguntas atingido (contando as já cadastradas). Remova
          alguma para adicionar outra.
        </p>
      )}

      {addingManually && !atLimit && (
        <AddQuestionForm
          onAdd={(question) => {
            onAddManual(question)
            setAddingManually(false)
          }}
          onCancel={() => setAddingManually(false)}
        />
      )}

      {loading ? (
        <p className="text-sm text-brand-text-muted flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Gerando pergunta {candidates.length + 1} de {planned}…
        </p>
      ) : (
        candidates.length > 0 && (
          <p className="text-sm text-brand-text-muted">
            {selectedCount} de {candidates.length} novas selecionadas.
          </p>
        )
      )}
      <div className="max-h-[32vh] overflow-y-auto space-y-2 p-1 -m-1">
        {candidates.map((question, index) => (
          <div
            key={index}
            className="flex items-start gap-3 rounded-lg border border-brand-border p-3 text-sm transition-colors hover:border-primary/40 animate-in fade-in slide-in-from-top-1"
          >
            <label className="flex items-start gap-3 min-w-0 flex-1 cursor-pointer">
              <Checkbox
                checked={included[index]}
                onCheckedChange={(checked) =>
                  setIncluded((current) =>
                    current.map((value, i) => (i === index ? Boolean(checked) : value)),
                  )
                }
                className="mt-0.5"
              />
              <div className="min-w-0">
                <p>{question.text}</p>
                <p className="text-xs text-brand-text-muted mt-1">{LAYER_LABELS[question.layer]}</p>
              </div>
            </label>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 flex-shrink-0 text-brand-text-muted hover:text-red-500"
              onClick={() => onRemove(index)}
              title="Remover da lista"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-brand-border p-3 text-sm text-brand-text-muted">
            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
            Consultando IA…
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex justify-between gap-2 pt-2 border-t border-brand-border">
        <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="button" onClick={onConfirm} disabled={loading || isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Rodar Raio-X
          </Button>
        </div>
      </div>
    </div>
  )
}

export function AdminGeoClient({
  profiles,
  selectedProfileId,
  questions,
  competitors,
  latestSnapshot,
  history,
  providers,
  companies,
}: {
  profiles: Profile[]
  selectedProfileId: string | null
  questions: Question[]
  competitors: Competitor[]
  latestSnapshot: Snapshot | null
  history: { id: string; score: number; createdAt: Date; totalCostUsdCents: number }[]
  providers: { provider: GeoProvider; configured: boolean }[]
  companies: CompanyOption[]
}) {
  const router = useRouter()
  const configuredProviders = providers.filter((p) => p.configured).map((p) => p.provider)
  const selectedProfile = profiles.find((p) => p.id === selectedProfileId) ?? null

  const [profileModal, setProfileModal] = useState<'create' | 'edit' | null>(null)
  const [selectedProviders, setSelectedProviders] = useState<GeoProvider[]>(configuredProviders)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [isMutating, startMutation] = useTransition()

  const [viewingSnapshotId, setViewingSnapshotId] = useState<string | null>(null)
  const [snapshotDetailsData, setSnapshotDetailsData] = useState<{
    snapshot: Snapshot
    probeRuns: {
      id: string
      provider: GeoProvider
      mode: GeoProbeMode
      rawResponse: string
      companyMentioned: boolean
      errorMessage: string | null
      targetQuestion: { id: string; text: string; layer: GeoQuestionLayer }
    }[]
  } | null>(null)
  const [loadingSnapshotDetails, setLoadingSnapshotDetails] = useState(false)

  async function handleViewSnapshotDetails(snapshotId: string) {
    if (!selectedProfileId) return
    setViewingSnapshotId(snapshotId)
    setLoadingSnapshotDetails(true)
    setSnapshotDetailsData(null)
    const result = await getSnapshotDetailsAction(snapshotId, selectedProfileId)
    setLoadingSnapshotDetails(false)
    if (result.ok) {
      setSnapshotDetailsData(result.data as any)
    }
  }

  const missingProviders = providers.filter((p) => !p.configured)

  function toggleProvider(provider: GeoProvider) {
    setSelectedProviders((current) =>
      current.includes(provider)
        ? current.filter((item) => item !== provider)
        : [...current, provider],
    )
  }

  const breakdown = latestSnapshot?.breakdown as
    | { byQuestion?: QuestionBreakdown[]; erroredProbes?: number; totalProbes?: number }
    | null
    | undefined

  const competitorComparison =
    (latestSnapshot?.competitorComparison as
      | { competitorId: string; mentions: number; shareOfVoice: number }[]
      | null) ?? []

  const competitorNames = new Map(competitors.map((c) => [c.id, c.name]))
  const questionTexts = new Map(questions.map((q) => [q.id, q.text]))

  function handleProfileChange(event: React.ChangeEvent<HTMLSelectElement>) {
    router.push(`/dashboard-admin/geo?profileId=${event.target.value}`)
  }

  function handleProfileSaved(id: string) {
    router.push(`/dashboard-admin/geo?profileId=${id}`)
    router.refresh()
  }

  function handleArchiveProfile() {
    if (!selectedProfileId) return
    startMutation(async () => {
      await archiveGeoTargetProfile(selectedProfileId)
      router.push('/dashboard-admin/geo')
      router.refresh()
    })
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Radar className="h-6 w-6" />
          Raio-X de Visibilidade em IA
        </h1>
        <p className="text-sm text-brand-text-muted">
          Mede com que frequência uma empresa é citada por IAs generativas nas perguntas que
          antecedem uma compra. Não precisa ser um cliente cadastrado — descreva qualquer negócio
          para analisar, como um perfil de conta. A detecção usa correspondência de nome e
          apelidos — é uma heurística, não interpretação semântica.
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor="profile">Empresa analisada</Label>
          {profiles.length > 0 ? (
            <select
              id="profile"
              value={selectedProfileId ?? ''}
              onChange={handleProfileChange}
              className="h-9 min-w-64 rounded-md border border-brand-border bg-transparent px-3 text-sm"
            >
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-brand-text-muted h-9 flex items-center">
              Nenhuma empresa cadastrada ainda.
            </p>
          )}
        </div>
        <Button variant="outline" onClick={() => setProfileModal('create')}>
          <Building2 className="mr-2 h-4 w-4" />
          Nova empresa
        </Button>
        {selectedProfile && (
          <Button variant="outline" onClick={() => setProfileModal('edit')}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar contexto
          </Button>
        )}
        <Button
          onClick={() => setWizardOpen(true)}
          disabled={!selectedProfile || selectedProviders.length === 0}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Analisar
        </Button>
      </div>

      {selectedProfile && (
        <section className="rounded-xl border border-brand-border p-5 space-y-2">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-medium">{selectedProfile.name}</h2>
            <Button size="sm" variant="ghost" disabled={isMutating} onClick={handleArchiveProfile}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          {selectedProfile.description && (
            <p className="text-sm text-brand-text-muted">{selectedProfile.description}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-text-muted">
            {selectedProfile.industry && <span>Setor: {selectedProfile.industry}</span>}
            {selectedProfile.location && <span>Local: {selectedProfile.location}</span>}
            {selectedProfile.website && <span>Site: {selectedProfile.website}</span>}
            {selectedProfile.aliases.length > 0 && (
              <span>Apelidos: {selectedProfile.aliases.join(', ')}</span>
            )}
          </div>
        </section>
      )}

      {!selectedProfile && profiles.length === 0 && (
        <div className="rounded-xl border border-dashed border-brand-border p-8 text-center space-y-3">
          <Building2 className="h-8 w-8 mx-auto text-brand-text-muted" />
          <p className="text-sm text-brand-text-muted">
            Cadastre a primeira empresa a ser analisada — nome, o que ela faz, setor, localização.
            Não precisa existir no Janus.
          </p>
          <Button onClick={() => setProfileModal('create')}>
            <Building2 className="mr-2 h-4 w-4" />
            Cadastrar empresa
          </Button>
        </div>
      )}

      {selectedProfile && (
        <>
          <div className="rounded-xl border border-brand-border p-5 space-y-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-lg font-medium">Provedores de IA</h2>
              <span className="text-xs text-brand-text-muted">
                usados na próxima análise
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {providers.map(({ provider, configured }) => (
                <label
                  key={provider}
                  className={
                    configured
                      ? 'flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2 text-sm cursor-pointer'
                      : 'flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2 text-sm opacity-50 cursor-not-allowed'
                  }
                >
                  <input
                    type="checkbox"
                    disabled={!configured}
                    checked={selectedProviders.includes(provider)}
                    onChange={() => toggleProvider(provider)}
                    className="h-4 w-4"
                  />
                  <span>{PROVIDER_LABELS[provider]}</span>
                  {!configured && <span className="text-xs">(sem chave)</span>}
                </label>
              ))}
            </div>
          </div>

          {missingProviders.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" />
              <p>
                <strong>
                  Sem credencial: {missingProviders.map((p) => PROVIDER_LABELS[p.provider]).join(', ')}.
                </strong>{' '}
                Defina {missingProviders.map((p) => PROVIDER_ENV[p.provider]).join(', ')} para
                habilitar esses provedores. Cada execução consome créditos pagos das APIs
                selecionadas.
              </p>
            </div>
          )}

          <section className="rounded-xl border border-brand-border p-5">
            <h2 className="text-lg font-medium mb-4">IAG Score</h2>
            {latestSnapshot ? (
              <div className="flex flex-col md:flex-row gap-6 md:items-center">
                <ScoreRing score={latestSnapshot.score} label="IAG Score" />
                <div className="space-y-2 text-sm">
                  <p>
                    Última execução em{' '}
                    {new Date(latestSnapshot.createdAt).toLocaleString('pt-BR', {
                      timeZone: 'America/Sao_Paulo',
                    })}
                  </p>
                  <p className="text-brand-text-muted">
                    {breakdown?.totalProbes ?? 0} consultas · {breakdown?.erroredProbes ?? 0} com
                    erro · custo estimado {formatCents(latestSnapshot.totalCostUsdCents)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-brand-text-muted">
                Nenhum Raio-X executado para esta empresa ainda. Clique em &ldquo;Analisar&rdquo;
                para começar.
              </p>
            )}
          </section>

          {breakdown?.byQuestion && breakdown.byQuestion.length > 0 && (
            <section className="rounded-xl border border-brand-border p-5">
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Onde a empresa está ausente
              </h2>
              <div className="space-y-2">
                {breakdown.byQuestion.map((item) => (
                  <div
                    key={item.questionId}
                    className="flex items-center justify-between gap-4 border-b border-brand-border pb-2 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm truncate">
                        {questionTexts.get(item.questionId) ?? 'Pergunta arquivada'}
                      </p>
                      <p className="text-xs text-brand-text-muted">
                        {LAYER_LABELS[item.layer]} · peso {item.weight}
                      </p>
                    </div>
                    <span
                      className={
                        item.mentionRate === 0
                          ? 'text-sm font-medium text-red-500 flex-shrink-0'
                          : 'text-sm font-medium text-emerald-500 flex-shrink-0'
                      }
                    >
                      {item.probesMentioned}/{item.probesCounted} menções
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {competitorComparison.length > 0 && (
            <section className="rounded-xl border border-brand-border p-5">
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Swords className="h-5 w-5" />
                Comparação com concorrentes
              </h2>
              <div className="space-y-2">
                {competitorComparison.map((item) => (
                  <div key={item.competitorId} className="flex items-center justify-between text-sm">
                    <span>{competitorNames.get(item.competitorId) ?? 'Concorrente removido'}</span>
                    <span className="text-brand-text-muted">
                      {item.mentions} menções · {item.shareOfVoice}% share of voice
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {history.length > 1 && (
            <section className="rounded-xl border border-brand-border p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Evolução do IAG Score
                </h2>
                <span className="text-xs text-brand-text-muted">
                  Últimas {history.length} análises
                </span>
              </div>

              {/* Gráfico de Evolução com SVG e Tooltips */}
              <div className="pt-2 pb-1 px-2 bg-brand-card/30 rounded-xl border border-brand-border/40">
                <div className="h-40 w-full flex items-end justify-between gap-2 sm:gap-4 relative pt-6">
                  {/* Linhas de grade de fundo */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                    <div className="border-b border-dashed border-brand-border w-full text-[10px] text-brand-text-muted">100</div>
                    <div className="border-b border-dashed border-brand-border w-full text-[10px] text-brand-text-muted">50</div>
                    <div className="border-b border-dashed border-brand-border w-full text-[10px] text-brand-text-muted">0</div>
                  </div>

                  {/* Barras e Pontos */}
                  {[...history].reverse().map((item, idx) => {
                    const isLatest = idx === history.length - 1
                    return (
                      <div
                        key={item.id}
                        className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative z-10 cursor-pointer"
                        onClick={() => handleViewSnapshotDetails(item.id)}
                      >
                        {/* Tooltip Hover */}
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-brand-border text-[11px] px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none z-20">
                          <span className="font-semibold text-primary">Score: {item.score}/100</span>
                          <br />
                          <span className="text-brand-text-muted">{new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>

                        {/* Rótulo de Score acima da barra */}
                        <span className={`text-xs font-bold ${isLatest ? 'text-primary' : 'text-brand-text-muted'}`}>
                          {item.score}
                        </span>

                        {/* Barra */}
                        <div
                          className={`w-full max-w-[28px] rounded-t-md transition-all duration-300 ${
                            isLatest
                              ? 'bg-gradient-to-t from-primary/60 to-primary shadow-md shadow-primary/20 group-hover:brightness-110'
                              : 'bg-brand-border/60 hover:bg-primary/50'
                          }`}
                          style={{ height: `${Math.max(item.score, 6)}%` }}
                        />

                        {/* Rótulo de Data */}
                        <span className="text-[10px] text-brand-text-muted truncate max-w-[50px]">
                          {new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Lista Detalhada do Histórico */}
              <div className="pt-2">
                <h3 className="text-sm font-medium mb-3 text-brand-text-muted">Histórico de Execuções</h3>
                <div className="space-y-2">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-brand-border bg-brand-card/20 text-sm hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-xs">
                          {item.score}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-xs sm:text-sm">
                            {new Date(item.createdAt).toLocaleString('pt-BR', {
                              timeZone: 'America/Sao_Paulo',
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </p>
                          <p className="text-[11px] text-brand-text-muted">
                            Custo: {formatCents(item.totalCostUsdCents)}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewSnapshotDetails(item.id)}
                        className="gap-1.5 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver Análise
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* Modal de Detalhes do Snapshot Histórico */}
      {viewingSnapshotId && (
        <Dialog open onOpenChange={() => setViewingSnapshotId(null)}>
          <DialogContent className="max-w-3xl w-[92vw] max-h-[85vh] flex flex-col overflow-hidden">
            <DialogHeader className="pb-2 flex-shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <Radar className="h-5 w-5 text-primary" />
                Detalhes da Análise Histórica
              </DialogTitle>
            </DialogHeader>

            {loadingSnapshotDetails ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-brand-text-muted">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm">Carregando dados da execução...</span>
              </div>
            ) : snapshotDetailsData ? (
              <div className="space-y-4 flex-1 overflow-y-auto min-h-0 pr-1">
                {/* Resumo do Score */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-brand-border bg-brand-card/40">
                  <div>
                    <span className="text-xs text-brand-text-muted">Data da execução</span>
                    <p className="font-medium text-sm">
                      {new Date(snapshotDetailsData.snapshot.createdAt).toLocaleString('pt-BR', {
                        timeZone: 'America/Sao_Paulo',
                        dateStyle: 'full',
                        timeStyle: 'short',
                      })}
                    </p>
                    <span className="text-xs text-brand-text-muted mt-1 block">
                      Custo total: {formatCents(snapshotDetailsData.snapshot.totalCostUsdCents)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-brand-text-muted block mb-1">Score IAG</span>
                    <span className="text-3xl font-black text-primary">
                      {snapshotDetailsData.snapshot.score}/100
                    </span>
                  </div>
                </div>

                {/* Consultas Executadas */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Consultas Realizadas ({snapshotDetailsData.probeRuns.length})
                  </h4>

                  <div className="space-y-2.5">
                    {snapshotDetailsData.probeRuns.map((run) => (
                      <div
                        key={run.id}
                        className="p-3.5 rounded-xl border border-brand-border bg-brand-bg-subtle/40 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
                          <span className="font-medium px-2 py-0.5 rounded bg-brand-border/40 text-foreground">
                            {PROVIDER_LABELS[run.provider]}
                          </span>
                          <span className="text-brand-text-muted text-[11px]">
                            {run.mode === 'LIVE_SEARCH' ? 'Busca ao vivo' : 'Memória do modelo'} •{' '}
                            {LAYER_LABELS[run.targetQuestion.layer]}
                          </span>
                          {run.companyMentioned ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              Mencionou Empresa
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[11px] text-brand-text-muted bg-brand-border/20">
                              Não Mencionou
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm font-medium text-foreground">
                          {run.targetQuestion.text}
                        </p>

                        {run.errorMessage ? (
                          <p className="text-xs text-red-400 p-2 rounded bg-red-500/10 border border-red-500/20">
                            {run.errorMessage}
                          </p>
                        ) : (
                          <p className="text-xs text-brand-text-muted bg-brand-card p-2.5 rounded border border-brand-border/40 leading-relaxed whitespace-pre-wrap">
                            {run.rawResponse}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      )}

      {wizardOpen && selectedProfile && (
        <AnalyzeWizard
          profile={selectedProfile}
          questions={questions}
          competitors={competitors}
          selectedProviders={selectedProviders}
          onClose={() => setWizardOpen(false)}
          onCompleted={() => router.refresh()}
        />
      )}
      {profileModal === 'create' && (
        <ProfileModal
          mode="create"
          companies={companies}
          onClose={() => setProfileModal(null)}
          onSaved={handleProfileSaved}
        />
      )}
      {profileModal === 'edit' && selectedProfile && (
        <ProfileModal
          mode="edit"
          profile={selectedProfile}
          companies={companies}
          onClose={() => setProfileModal(null)}
          onSaved={handleProfileSaved}
        />
      )}
    </div>
  )
}
