'use client'

import { useState, useTransition } from 'react'
import { Globe, GlobeOff, Loader2 } from 'lucide-react'
import { togglePagePublish } from '@/modules/projects/actions/togglePagePublish'

interface PublishPageButtonProps {
  pageId: string
  initialPublished: boolean
}

export function PublishPageButton({ pageId, initialPublished }: PublishPageButtonProps) {
  const [isPublished, setIsPublished] = useState(initialPublished)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    const next = !isPublished
    startTransition(async () => {
      const result = await togglePagePublish({ pageId, isPublished: next })
      if (result.ok) {
        setIsPublished(next)
      }
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 disabled:opacity-50 ${
        isPublished
          ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30 hover:bg-brand-primary/20'
          : 'bg-brand-btn-light text-brand-muted border border-brand-btn-light hover:bg-brand-btn-light/60'
      }`}
    >
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : isPublished ? <Globe className="w-4 h-4" /> : <GlobeOff className="w-4 h-4" />}
      {isPending ? 'Atualizando...' : isPublished ? 'Publicado' : 'Publicar'}
    </button>
  )
}
