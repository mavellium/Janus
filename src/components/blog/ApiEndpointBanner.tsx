'use client'

import { useState } from 'react'
import { Copy, Check, Code2 } from 'lucide-react'

interface ApiEndpointBannerProps {
  url: string
}

export function ApiEndpointBanner({ url }: ApiEndpointBannerProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mb-6 flex items-center gap-3 rounded-lg border border-border bg-muted px-4 py-3">
      <Code2 className="size-4 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-xs font-medium text-muted-foreground">Endpoint Público da API</span>
        <span className="truncate font-mono text-sm text-foreground">GET {url}</span>
      </div>
      <button
        onClick={handleCopy}
        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        title="Copiar URL"
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </button>
    </div>
  )
}
