# Landing — Padrões de Código

## ⚠️ As 3 armadilhas deste stack

### 1. `bg-x/10` não funciona nas cores brand

As cores do tema são `var(--brand-*)` cruas. O `withAlphaValue` do Tailwind 3 não consegue parsear `var()` e **devolve a cor sólida**. Um `bg-brand-cta/10` vira laranja chapado.

```css
/* globals.css — o jeito certo, igual ao bloco onb* já existente */
.lp-tint-cta { background-color: color-mix(in srgb, var(--brand-cta) 12%, transparent); }
```

### 2. `overflow-x-hidden` quebra header fixo

Pela spec do CSS Overflow, valor ≠ `visible` num eixo força o outro a `auto`. O wrapper vira contêiner de rolagem, o documento para de rolar, `window.scrollY` trava em 0 e todo listener de scroll morre.

```tsx
<div className="lp-landing w-full overflow-x-clip bg-brand-bg">  {/* clip, nunca hidden */}
```

### 3. `setState` síncrono em effect é erro de lint

A regra `react-hooks/set-state-in-effect` está ativa. Toda transição de estado da animação acontece **dentro do `setTimeout`**, nunca no corpo do effect.

## Entrada por scroll

```tsx
<Reveal delay={90}>{/* conteúdo */}</Reveal>
```

```css
[data-lp-reveal] { opacity: 0; }
[data-lp-reveal='true'] { animation: lpFadeUp 760ms cubic-bezier(0.16, 1, 0.3, 1) both; }
```

## Passo de animação (máquina do HeroPipeline)

```tsx
useEffect(() => {
  if (!running || phase !== 'running') return
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
}, [running, phase, step, chars, ticks])
```

## Cursor sobre um alvo medido

```tsx
useIsomorphicLayoutEffect(() => {
  const cursor = cursorRef.current
  const pane = paneRef.current
  const target = targetKey ? targets.current[targetKey] : null
  if (!cursor || !pane || !target) return

  const paneBox = pane.getBoundingClientRect()
  const targetBox = target.getBoundingClientRect()
  cursor.style.transform = `translate3d(${targetBox.left - paneBox.left + Math.min(targetBox.width * 0.3, 52)}px, ${targetBox.top - paneBox.top + Math.min(targetBox.height * 0.6, 22)}px, 0)`
  cursor.style.opacity = '1'
})
```

Escrita imperativa de propaganda: React não gerencia `style` aqui, então a posição sobrevive aos re-renders e a transição CSS faz o deslize.

## Logo light/dark sem JS

```tsx
<Image src="/janus-logo.svg" ... className="h-8 w-auto dark:hidden" />
<Image src="/janus-logo-white.svg" alt="" aria-hidden ... className="hidden h-8 w-auto dark:block" />
```

## Responsividade adotada

Paddings `py-16 sm:py-20 lg:py-28` · containers `mx-auto max-w-6xl px-4 sm:px-6 lg:px-8` · H1 `text-[2rem] sm:text-5xl lg:text-[3.5rem]` · títulos de seção `text-[1.75rem] sm:text-3xl lg:text-4xl` · alvos de toque ≥ 44 px no mobile (`h-12 sm:h-11`, `h-9 sm:h-7`) · âncoras com `scroll-mt-16`.
