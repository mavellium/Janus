'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from 'react'
import { CheckCircle2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updatePreferences } from '@/modules/users/actions/updatePreferences'
import type { OnboardingPreference } from '@/types/next-auth'
import { TOUR_STEPS } from './onboardingSteps'
import { SeoGeoPreview } from './SeoGeoPreview'
import { Confetti } from './Confetti'

interface TargetRect {
  top: number
  left: number
  width: number
  height: number
}

const SPOTLIGHT_PADDING = 6
const CARD_GAP = 20

function findVisibleTarget(target: string): TargetRect | null {
  const elements = document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`)
  for (const element of elements) {
    const rect = element.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      return { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
    }
  }
  return null
}

export function OnboardingTour({
  companySlug,
  initialStep = 0,
}: {
  companySlug: string
  initialStep?: number
}) {
  const [stepIndex, setStepIndex] = useState(() =>
    Math.min(Math.max(initialStep, 0), TOUR_STEPS.length - 1)
  )
  const [dismissed, setDismissed] = useState(false)
  const [farewell, setFarewell] = useState(false)
  const [rect, setRect] = useState<TargetRect | null>(null)
  const [previewDone, setPreviewDone] = useState(false)
  const [, startTransition] = useTransition()
  const cardRef = useRef<HTMLDivElement>(null)

  const step = TOUR_STEPS[stepIndex]
  const totalSteps = TOUR_STEPS.length
  const isSpotlight = step.kind === 'spotlight' && rect !== null
  const StepIcon = step.icon

  const persist = useCallback(
    (patch: OnboardingPreference) => {
      startTransition(async () => {
        await updatePreferences({ onboarding: patch })
      })
    },
    [startTransition]
  )

  useLayoutEffect(() => {
    function measure() {
      if (step.kind === 'spotlight' && step.target) {
        setRect(findVisibleTarget(step.target))
      } else {
        setRect(null)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [step])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    cardRef.current?.focus({ preventScroll: true })
  }, [stepIndex])

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.min(Math.max(index, 0), totalSteps - 1)
      setStepIndex(clamped)
      persist({ status: 'pending', step: clamped })
    },
    [persist, totalSteps]
  )

  const complete = useCallback(() => {
    persist({ status: 'completed' })
    setDismissed(true)
  }, [persist])

  const skip = useCallback(() => {
    setFarewell(true)
  }, [])

  const next = useCallback(() => {
    if (stepIndex === totalSteps - 1) {
      complete()
      return
    }
    goTo(stepIndex + 1)
  }, [stepIndex, totalSteps, complete, goTo])

  const back = useCallback(() => {
    if (stepIndex > 0) goTo(stepIndex - 1)
  }, [stepIndex, goTo])

  useEffect(() => {
    if (farewell) {
      const timer = setTimeout(() => {
        setDismissed(true)
        persist({ status: 'skipped', step: stepIndex })
      }, 4500)
      return () => clearTimeout(timer)
    }
  }, [farewell, persist, stepIndex])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (farewell) return
      const target = event.target as HTMLElement | null
      const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA'
      if (event.key === 'Escape') {
        event.preventDefault()
        skip()
        return
      }
      if (isTyping) return
      if (event.key === 'ArrowRight' || event.key === 'Enter') {
        event.preventDefault()
        next()
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        back()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [next, back, skip, farewell])

  if (dismissed) return null

  if (farewell) {
    return (
      <div className="fixed inset-x-0 bottom-6 z-[100] flex justify-center px-4">
        <div className="onb-card-in flex items-center gap-2.5 rounded-xl border border-brand-btn-light bg-card px-4 py-3 shadow-lg">
          <Sparkles size={15} className="flex-shrink-0 text-brand-primary" />
          <p className="text-sm text-brand-text">
            Tudo bem! Você pode refazer o tour quando quiser em Configurações → Preferências.
          </p>
        </div>
      </div>
    )
  }

  const progressPercent = ((stepIndex + 1) / totalSteps) * 100
  const isCentered = !isSpotlight

  const cardStyle: React.CSSProperties = isSpotlight
    ? {
        position: 'absolute',
        left: rect.left + rect.width + CARD_GAP,
        top: Math.max(16, Math.min(rect.top - 8, window.innerHeight - 320)),
        transition: 'top 400ms cubic-bezier(0.4, 0, 0.2, 1), left 400ms cubic-bezier(0.4, 0, 0.2, 1)',
      }
    : {}

  return (
    <div
      className="onb-overlay-in fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-label={step.title}
    >
      {isSpotlight ? (
        <>
          <div className="absolute inset-0" aria-hidden />
          <div
            aria-hidden
            className="pointer-events-none absolute rounded-xl border-2 border-brand-primary/70"
            style={{
              top: rect.top - SPOTLIGHT_PADDING,
              left: rect.left - SPOTLIGHT_PADDING,
              width: rect.width + SPOTLIGHT_PADDING * 2,
              height: rect.height + SPOTLIGHT_PADDING * 2,
              boxShadow: '0 0 0 200vmax var(--onb-scrim)',
              transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
              animation: 'onbPulse 2200ms ease-in-out infinite',
            }}
          />
        </>
      ) : (
        <div className="onb-scrim absolute inset-0" aria-hidden />
      )}

      <div
        className={cn(isCentered && 'absolute inset-0 flex items-center justify-center p-4 overflow-y-auto')}
        style={isSpotlight ? cardStyle : undefined}
      >
        <div
          ref={cardRef}
          tabIndex={-1}
          key={stepIndex}
          className={cn(
            'onb-card-in relative overflow-hidden rounded-2xl border border-brand-btn-light bg-card shadow-2xl outline-none',
            step.kind === 'seo-preview' ? 'w-full max-w-lg p-6 sm:p-8' : 'w-[320px] max-w-[calc(100vw-2rem)] p-6',
            step.kind === 'welcome' && 'w-full max-w-md p-6 sm:p-8 text-center',
            step.kind === 'done' && 'w-full max-w-md p-6 sm:p-8 text-center'
          )}
        >
          {step.kind === 'done' && <Confetti />}

          {step.kind === 'done' ? (
            <div className="onb-check-pop mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-9 w-9 text-emerald-500" />
            </div>
          ) : (
            <div
              className={cn(
                'mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/10',
                (step.kind === 'welcome' || step.kind === 'seo-preview') && 'mx-auto'
              )}
            >
              <StepIcon className="h-5 w-5 text-brand-primary" />
            </div>
          )}

          <h2
            className={cn(
              'font-bold text-brand-text',
              step.kind === 'welcome' || step.kind === 'done' ? 'text-xl sm:text-2xl' : 'text-base',
              step.kind === 'seo-preview' && 'text-center text-xl'
            )}
          >
            {step.title}
          </h2>
          <p
            className={cn(
              'mt-2 text-sm leading-relaxed text-brand-muted',
              step.kind === 'seo-preview' && 'text-center'
            )}
          >
            {step.description}
          </p>

          {step.kind === 'seo-preview' && (
            <SeoGeoPreview companySlug={companySlug} onResult={() => setPreviewDone(true)} />
          )}

          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
                Passo {stepIndex + 1} de {totalSteps}
              </span>
              {step.kind !== 'done' && (
                <button
                  type="button"
                  onClick={skip}
                  className="text-[11px] font-medium text-brand-muted underline-offset-2 transition-colors hover:text-brand-text hover:underline"
                >
                  Pular tour
                </button>
              )}
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-brand-btn-light">
              <div
                className="h-full rounded-full bg-brand-primary transition-[width] duration-500 ease-in-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div
            className={cn(
              'mt-4 flex items-center gap-2',
              step.kind === 'welcome' || step.kind === 'done' ? 'justify-center' : 'justify-end'
            )}
          >
            {step.kind === 'welcome' && (
              <button
                type="button"
                onClick={next}
                className="min-h-10 rounded-lg bg-brand-cta px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-hover"
              >
                Vamos começar
              </button>
            )}

            {step.kind === 'done' && (
              <button
                type="button"
                onClick={complete}
                className="min-h-10 rounded-lg bg-brand-cta px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-hover"
              >
                Ir para o dashboard
              </button>
            )}

            {(step.kind === 'spotlight' || step.kind === 'seo-preview') && (
              <>
                <button
                  type="button"
                  onClick={back}
                  className="min-h-10 rounded-lg border border-brand-btn-light px-4 py-2 text-sm font-medium text-brand-text transition hover:bg-brand-btn-light/40"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="min-h-10 rounded-lg bg-brand-cta px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-hover"
                >
                  {step.kind === 'seo-preview' && !previewDone ? 'Pular esta etapa' : 'Próximo'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
