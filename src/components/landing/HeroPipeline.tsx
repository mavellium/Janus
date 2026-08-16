'use client'

import { useEffect, useRef, useState } from 'react'
import { Braces, Check, ImageUp, Monitor, MousePointer2, Palette, Type } from 'lucide-react'
import {
  useInView,
  useIsomorphicLayoutEffect,
  usePrefersReducedMotion,
} from './useInView'
import { cn } from '@/lib/utils'

type StepId = 'titulo' | 'cor' | 'foto' | 'botao'
type Phase = 'running' | 'settled'
type View = 'site' | 'api'

interface Step {
  id: StepId
  kind: 'text' | 'color' | 'image'
  label: string
  icon: typeof Type
  value: string
  ms: number
}

const STEPS: Step[] = [
  {
    id: 'titulo',
    kind: 'text',
    label: 'Título da página',
    icon: Type,
    value: 'Obra entregue no prazo',
    ms: 12,
  },
  { id: 'cor', kind: 'color', label: 'Cor dos botões', icon: Palette, value: '', ms: 9 },
  { id: 'foto', kind: 'image', label: 'Foto de destaque', icon: ImageUp, value: '', ms: 14 },
  {
    id: 'botao',
    kind: 'text',
    label: 'Texto do botão',
    icon: Type,
    value: 'Pedir orçamento',
    ms: 11,
  },
]

const SWATCHES = ['bg-brand-cta', 'bg-brand-primary', 'bg-brand-hover', 'bg-brand-btn-dark']
const SELECTED_HEX = '#E35336'
const PHOTO_NAME = 'sala-reformada.jpg'

const TYPE_MS = 95
const SWATCH_MS = 420
const UPLOAD_MS = 130
const HOLD_MS = 550
const SETTLED_MS = 700
const LOOP_MS = 2200
const UPLOAD_TICKS = 12

function typeDelay(value: string, position: number) {
  const typed = value[position - 1] ?? ''
  const jitter = ((position * 37) % 5) * 18
  return TYPE_MS + jitter + (typed === ' ' ? 90 : 0)
}

interface Committed {
  titulo: string
  cor: number | null
  foto: boolean
  botao: string
}

const EMPTY: Committed = { titulo: '', cor: null, foto: false, botao: '' }
const FILLED: Committed = {
  titulo: STEPS[0].value,
  cor: 0,
  foto: true,
  botao: STEPS[3].value,
}

function SiteArtwork() {
  return (
    <svg
      viewBox="0 0 320 120"
      preserveAspectRatio="xMidYMid slice"
      className="lp-pop h-full w-full"
      role="presentation"
    >
      <defs>
        <linearGradient id="lp-hero-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand-btn-light)" />
          <stop offset="100%" stopColor="var(--brand-bg)" />
        </linearGradient>
        <linearGradient id="lp-hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand-cta)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--brand-cta)" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="lp-hero-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      <rect width="320" height="120" fill="url(#lp-hero-wall)" />
      <rect y="86" width="320" height="34" fill="url(#lp-hero-floor)" />

      <rect x="186" y="10" width="118" height="76" rx="3" fill="url(#lp-hero-sky)" />
      <g
        stroke="var(--brand-primary)"
        strokeOpacity="0.45"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      >
        <rect x="186" y="10" width="118" height="76" rx="3" />
        <path d="M245 10 V86" />
        <path d="M186 48 H304" />
      </g>

      <path
        d="M186 86 L304 86 L320 120 L150 120 Z"
        fill="var(--brand-cta)"
        fillOpacity="0.07"
      />

      <ellipse cx="94" cy="99" rx="80" ry="11" fill="var(--brand-hover)" fillOpacity="0.28" />

      <rect
        x="52"
        y="18"
        width="36"
        height="26"
        rx="2"
        stroke="var(--brand-primary)"
        strokeOpacity="0.4"
        strokeWidth="2"
        fill="none"
      />

      <rect x="34" y="52" width="104" height="21" rx="7" fill="var(--brand-primary)" />
      <rect
        x="50"
        y="57"
        width="32"
        height="15"
        rx="4"
        fill="var(--brand-hover)"
        fillOpacity="0.6"
      />
      <rect
        x="27"
        y="68"
        width="118"
        height="21"
        rx="8"
        fill="var(--brand-primary)"
        fillOpacity="0.82"
      />
      <g fill="var(--brand-primary)" fillOpacity="0.7">
        <rect x="34" y="88" width="5" height="6" rx="1.5" />
        <rect x="133" y="88" width="5" height="6" rx="1.5" />
      </g>

      <g stroke="var(--brand-primary)" strokeOpacity="0.75" strokeWidth="2">
        <path d="M168 76 V89" />
      </g>
      <rect x="156" y="72" width="25" height="4" rx="2" fill="var(--brand-primary)" />
      <path d="M162 66 L174 66 L171 55 L165 55 Z" fill="var(--brand-cta)" fillOpacity="0.75" />
    </svg>
  )
}

function JsonLine({ field, value, last }: { field: string; value: string; last?: boolean }) {
  return (
    <div className="break-all pl-3">
      <span className="text-brand-primary">&quot;{field}&quot;</span>
      <span>: </span>
      <span className="text-brand-text">&quot;{value}&quot;</span>
      {!last && <span>,</span>}
    </div>
  )
}

export function HeroPipeline() {
  const { ref, inView } = useInView<HTMLDivElement>(0.15)
  const reduced = usePrefersReducedMotion()

  const [index, setIndex] = useState(0)
  const [chars, setChars] = useState(0)
  const [ticks, setTicks] = useState(0)
  const [phase, setPhase] = useState<Phase>('running')
  const [committed, setCommitted] = useState<Committed>(EMPTY)
  const [view, setView] = useState<View>('site')

  const paneRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLSpanElement>(null)
  const targets = useRef<Record<string, HTMLElement | null>>({})

  const step = STEPS[index]
  const running = inView && !reduced

  useEffect(() => {
    if (!running || phase !== 'running') return

    if (step.kind === 'text') {
      const finished = chars >= step.value.length
      const timer = window.setTimeout(
        () => {
          if (finished) {
            setCommitted((state) => ({ ...state, [step.id]: step.value }))
            setPhase('settled')
          } else {
            setChars((value) => value + 1)
          }
        },
        finished ? HOLD_MS : typeDelay(step.value, chars),
      )
      return () => window.clearTimeout(timer)
    }

    if (step.kind === 'color') {
      const finished = ticks >= SWATCHES.length
      const timer = window.setTimeout(
        () => {
          if (finished) {
            setCommitted((state) => ({ ...state, cor: 0 }))
            setPhase('settled')
          } else {
            setTicks((value) => value + 1)
          }
        },
        finished ? HOLD_MS : SWATCH_MS,
      )
      return () => window.clearTimeout(timer)
    }

    const finished = ticks >= UPLOAD_TICKS
    const timer = window.setTimeout(
      () => {
        if (finished) {
          setCommitted((state) => ({ ...state, foto: true }))
          setPhase('settled')
        } else {
          setTicks((value) => value + 1)
        }
      },
      finished ? HOLD_MS : UPLOAD_MS,
    )
    return () => window.clearTimeout(timer)
  }, [running, phase, step, chars, ticks])

  useEffect(() => {
    if (!running || phase !== 'settled') return
    const last = index === STEPS.length - 1
    const timer = window.setTimeout(
      () => {
        if (last) setCommitted(EMPTY)
        setIndex(last ? 0 : index + 1)
        setChars(0)
        setTicks(0)
        setPhase('running')
      },
      last ? LOOP_MS : SETTLED_MS,
    )
    return () => window.clearTimeout(timer)
  }, [running, phase, index])

  const state = reduced ? FILLED : committed
  const activeId = reduced ? null : step.id

  const titulo = activeId === 'titulo' ? step.value.slice(0, chars) : state.titulo
  const botao = activeId === 'botao' ? step.value.slice(0, chars) : state.botao
  const swatch = activeId === 'cor' ? ticks % SWATCHES.length : (state.cor ?? -1)
  const accent = SWATCHES[state.cor ?? 0]
  const uploading = activeId === 'foto'
  const uploadPct = Math.min(100, Math.round((ticks / UPLOAD_TICKS) * 100))
  const published =
    Boolean(state.titulo) && Boolean(state.botao) && state.foto && state.cor !== null
  const onLastStep = index === STEPS.length - 1
  const delivered = phase === 'settled'

  const targetKey = reduced
    ? null
    : phase === 'settled' && onLastStep
      ? 'publicar'
      : step.kind === 'color'
        ? `cor-${swatch}`
        : step.id

  useIsomorphicLayoutEffect(() => {
    const cursor = cursorRef.current
    const pane = paneRef.current
    const target = targetKey ? targets.current[targetKey] : null
    if (!cursor || !pane || !target) return

    const paneBox = pane.getBoundingClientRect()
    const targetBox = target.getBoundingClientRect()
    const x = targetBox.left - paneBox.left + Math.min(targetBox.width * 0.3, 52)
    const y = targetBox.top - paneBox.top + Math.min(targetBox.height * 0.6, 22)

    cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`
    cursor.style.opacity = '1'
  })

  return (
    <div
      ref={ref}
      className="lp-shadow-panel overflow-hidden rounded-2xl border border-brand-btn-light bg-card"
    >
      <div className="grid divide-y divide-brand-btn-light sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div ref={paneRef} className="relative p-4 sm:p-5">
          <p className="lp-mono mb-4 text-[10px] uppercase tracking-[0.18em] text-brand-muted">
            1 · Você monta no Janus
          </p>

          <div className="space-y-3.5">
            {STEPS.map((item) => {
              const isActive = item.id === activeId
              const Icon = item.icon
              const filled =
                item.id === 'cor'
                  ? state.cor !== null
                  : item.id === 'foto'
                    ? state.foto
                    : Boolean(state[item.id])

              return (
                <div key={item.id}>
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <Icon size={11} className="shrink-0 text-brand-muted" />
                    <span className="text-xs text-brand-muted">{item.label}</span>
                    {filled && <Check size={11} className="shrink-0 text-brand-cta" />}
                  </div>

                  {item.kind === 'text' && (
                    <div
                      ref={(node) => {
                        targets.current[item.id] = node
                      }}
                      className={cn(
                        'min-h-9 break-words rounded-lg border px-3 py-2 text-sm transition-colors duration-200',
                        isActive
                          ? 'lp-border-cta text-brand-text'
                          : 'border-brand-btn-light text-brand-muted',
                      )}
                    >
                      {item.id === 'titulo' ? titulo : botao}
                      {isActive && phase === 'running' && (
                        <span className="lp-caret text-brand-cta">▍</span>
                      )}
                    </div>
                  )}

                  {item.kind === 'color' && (
                    <div className="flex gap-2 pb-1">
                      {SWATCHES.map((tone, position) => (
                        <span
                          key={tone}
                          ref={(node) => {
                            targets.current[`cor-${position}`] = node
                          }}
                          className={cn(
                            'h-8 w-8 rounded-lg transition-transform duration-200',
                            tone,
                            swatch === position
                              ? 'scale-110 ring-2 ring-brand-text ring-offset-2 ring-offset-card'
                              : 'scale-100',
                          )}
                        />
                      ))}
                    </div>
                  )}

                  {item.kind === 'image' && (
                    <div
                      ref={(node) => {
                        targets.current[item.id] = node
                      }}
                      className={cn(
                        'relative min-h-9 overflow-hidden rounded-lg border px-3 py-2 text-sm transition-colors duration-200',
                        isActive
                          ? 'lp-border-cta text-brand-text'
                          : 'border-brand-btn-light text-brand-muted',
                      )}
                    >
                      <span className="lp-mono text-xs">
                        {state.foto ? PHOTO_NAME : uploading ? 'enviando…' : 'nenhuma foto'}
                      </span>
                      {uploading && (
                        <span
                          className="absolute bottom-0 left-0 h-0.5 bg-brand-cta transition-[width] duration-150 ease-linear"
                          style={{ width: `${uploadPct}%` }}
                        />
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div
            ref={(node) => {
              targets.current.publicar = node
            }}
            className={cn(
              'mt-4 flex h-9 items-center justify-center rounded-lg text-xs font-medium transition-all duration-300',
              published ? 'bg-brand-cta text-white' : 'lp-tint-track text-brand-muted',
            )}
          >
            {published ? 'Publicado' : 'Publicar'}
          </div>

          {running && (
            <span
              ref={cursorRef}
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 z-10 opacity-0 transition-transform duration-500 ease-out"
            >
              {phase === 'settled' && (
                <span className="lp-ping absolute -left-2.5 -top-2.5 h-7 w-7 rounded-full bg-brand-text" />
              )}
              <MousePointer2 size={15} className="relative fill-brand-text text-brand-text" />
            </span>
          )}
        </div>

        <div className="flex flex-col p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <p className="lp-mono text-[10px] uppercase tracking-[0.18em] text-brand-muted">
              2 · {view === 'site' ? 'O site, ao vivo' : 'O que a API devolve'}
            </p>
            <button
              type="button"
              onClick={() => setView(view === 'site' ? 'api' : 'site')}
              className="lp-mono inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-brand-btn-light px-2.5 text-[10px] text-brand-muted transition-colors hover:border-brand-primary hover:text-brand-text sm:h-7"
            >
              {view === 'site' ? (
                <>
                  <Braces size={11} />
                  Ver na API
                </>
              ) : (
                <>
                  <Monitor size={11} />
                  Ver no site
                </>
              )}
            </button>
          </div>

          {view === 'site' ? (
            <div className="overflow-hidden rounded-xl border border-brand-btn-light">
              <div className="flex items-center gap-2 border-b border-brand-btn-light px-3 py-2">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-btn-light" />
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-btn-light" />
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-btn-light" />
                </span>
                <span className="lp-mono lp-tint-track truncate rounded px-2 py-0.5 text-[9px] text-brand-muted">
                  construtora-acme.com.br
                </span>
              </div>

              <div className="lp-tint-track relative h-28 sm:h-32">
                {state.foto ? (
                  <SiteArtwork />
                ) : (
                  <div className={cn('h-full w-full', uploading && 'lp-sweep')} />
                )}
              </div>

              <div className="p-3.5">
                {titulo ? (
                  <p className="lp-display break-words text-sm font-semibold leading-snug text-brand-text">
                    {titulo}
                  </p>
                ) : (
                  <div className="lp-tint-track h-3.5 w-4/5 rounded" />
                )}

                <div className="mt-3">
                  {botao ? (
                    <span
                      className={cn(
                        'inline-block break-words rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors duration-300',
                        accent,
                      )}
                    >
                      {botao}
                    </span>
                  ) : (
                    <div className="lp-tint-track h-7 w-24 rounded-lg" />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-brand-btn-light">
              <p className="lp-mono truncate border-b border-brand-btn-light px-3 py-2 text-[10px] text-brand-muted">
                GET /api/v1/content/acme/home
              </p>

              <div className="lp-mono flex-1 px-3 py-3 text-[10px] leading-6 text-brand-muted sm:text-[11px]">
                <div>{'{'}</div>
                <JsonLine field="titulo" value={titulo} />
                <JsonLine field="cor" value={state.cor !== null ? SELECTED_HEX : ''} />
                <JsonLine field="foto" value={state.foto ? PHOTO_NAME : ''} />
                <JsonLine field="botao" value={botao} last />
                <div>{'}'}</div>
              </div>

              <div className="flex items-center gap-2 border-t border-brand-btn-light px-3 py-2">
                <span className="relative flex h-2 w-2 shrink-0">
                  {delivered && !reduced && (
                    <span className="lp-ping absolute inline-flex h-full w-full rounded-full bg-brand-cta" />
                  )}
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-cta" />
                </span>
                <span className="lp-mono text-[10px] tabular-nums text-brand-muted sm:text-xs">
                  200 · {step.ms} ms
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-brand-btn-light px-4 py-3 sm:px-5">
        <span className="lp-mono truncate text-[10px] text-brand-muted sm:text-xs">
          {published ? 'no ar' : 'editando'}
        </span>
        <span className="lp-mono shrink-0 text-[10px] text-brand-muted sm:text-xs">
          {published ? 'publicado agora' : 'salvo automaticamente'}
        </span>
      </div>
    </div>
  )
}
