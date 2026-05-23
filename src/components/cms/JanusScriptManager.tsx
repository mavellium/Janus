import Script from 'next/script'

interface JanusScript {
  id: string
  name: string
  code: string
  position: 'HEAD' | 'BODY_END'
}

interface JanusScriptManagerProps {
  siteId: string
  apiBase?: string
}

async function fetchScripts(siteId: string, apiBase: string): Promise<JanusScript[]> {
  try {
    const res = await fetch(`${apiBase}/api/sites/${siteId}/scripts`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return []
    const json = await res.json() as { ok: boolean; data?: JanusScript[] }
    return json.data ?? []
  } catch {
    return []
  }
}

function extractInlineCode(code: string): string {
  const match = code.match(/<script[^>]*>([\s\S]*?)<\/script>/i)
  return match ? match[1].trim() : ''
}

function extractScriptSrc(code: string): string | null {
  const match = code.match(/<script[^>]+src=["']([^"']+)["']/i)
  return match ? match[1] : null
}

function ScriptInjector({ script }: { script: JanusScript }) {
  const src = extractScriptSrc(script.code)
  const strategy = script.position === 'HEAD' ? 'afterInteractive' : 'lazyOnload'

  if (src) {
    return <Script src={src} strategy={strategy} id={`janus-script-${script.id}`} />
  }

  const inline = extractInlineCode(script.code)
  if (inline) {
    return (
      <Script
        id={`janus-script-${script.id}`}
        strategy={strategy}
        dangerouslySetInnerHTML={{ __html: inline }}
      />
    )
  }

  return null
}

export async function JanusScriptManager({ siteId, apiBase = '' }: JanusScriptManagerProps) {
  const scripts = await fetchScripts(siteId, apiBase)
  if (scripts.length === 0) return null

  return (
    <>
      {scripts.map((script) => (
        <ScriptInjector key={script.id} script={script} />
      ))}
    </>
  )
}
