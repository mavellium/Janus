'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Endpoint {
  id: string
  tab: string
  path: string
  response: string
}

const ENDPOINTS: Endpoint[] = [
  {
    id: 'page',
    tab: 'Página inteira',
    path: '/api/v1/content/acme/home',
    response: `{
  "slug": "home",
  "name": "Home",
  "mode": "standard",
  "updatedAt": "2026-08-16T13:04:11.320Z",
  "content": {
    "hero": {
      "titulo": "Reforma que começa e termina na data combinada",
      "chamada": "Pedir orçamento"
    },
    "provas": { "entregas": "128" }
  }
}`,
  },
  {
    id: 'sections',
    tab: 'Lista de seções',
    path: '/api/v1/content/acme/home/sections',
    response: `{
  "slug": "home",
  "name": "Home",
  "mode": "standard",
  "updatedAt": "2026-08-16T13:04:11.320Z",
  "sections": [
    { "key": "hero", "label": "Topo" },
    { "key": "provas", "label": "Provas sociais" }
  ]
}`,
  },
  {
    id: 'section',
    tab: 'Uma seção',
    path: '/api/v1/content/acme/home/sections/hero',
    response: `{
  "slug": "home",
  "name": "Home",
  "mode": "standard",
  "section": "hero",
  "updatedAt": "2026-08-16T13:04:11.320Z",
  "data": {
    "titulo": "Reforma que começa e termina na data combinada",
    "chamada": "Pedir orçamento"
  }
}`,
  },
]

export function ApiTabs() {
  const [active, setActive] = useState(ENDPOINTS[0].id)
  const [copied, setCopied] = useState(false)

  const endpoint = ENDPOINTS.find((item) => item.id === active) ?? ENDPOINTS[0]

  async function copyPath() {
    try {
      await navigator.clipboard.writeText(endpoint.path)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="lp-shadow-panel overflow-hidden rounded-2xl border border-brand-btn-light bg-card">
      <div className="flex flex-wrap gap-1 border-b border-brand-btn-light p-2">
        {ENDPOINTS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(item.id)}
            className={cn(
              'inline-flex h-10 items-center rounded-lg px-3 text-xs font-medium transition-colors',
              item.id === active
                ? 'lp-tint-primary text-brand-text'
                : 'text-brand-muted hover:text-brand-text',
            )}
          >
            {item.tab}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-brand-btn-light px-4 py-3">
        <p className="lp-mono truncate text-xs text-brand-muted">
          <span className="text-brand-text">GET</span> {endpoint.path}
        </p>
        <button
          type="button"
          onClick={copyPath}
          aria-label="Copiar endpoint"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-brand-muted transition-colors hover:bg-brand-btn-light hover:text-brand-text"
        >
          {copied ? <Check size={14} className="text-brand-cta" /> : <Copy size={14} />}
        </button>
      </div>

      <pre className="lp-mono overflow-x-auto px-4 py-4 text-[11px] leading-6 text-brand-muted sm:text-xs">
        <code>{endpoint.response}</code>
      </pre>

      <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-brand-btn-light px-4 py-3 text-xs text-brand-muted">
        <span>somente leitura</span>
        <span>só o que está publicado</span>
        <span>resposta em cache</span>
      </div>
    </div>
  )
}
