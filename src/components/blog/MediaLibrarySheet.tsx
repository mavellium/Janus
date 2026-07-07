'use client'

import { useState } from 'react'
import { Images, Loader2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet'
import { listProjectMedia } from '@/modules/blog/actions/listProjectMedia'
import type { MediaAssetItem } from '@/modules/blog/queries/getProjectMedia'

export function MediaLibrarySheet({
  projectId,
  onSelect,
}: {
  projectId: string
  onSelect: (url: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<MediaAssetItem[]>([])

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setLoading(true)
      listProjectMedia(projectId).then((result) => {
        setItems(result.ok ? result.data : [])
        setLoading(false)
      })
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <button
          type="button"
          title="Biblioteca de mídia"
          aria-label="Biblioteca de mídia"
          onMouseDown={(e) => e.preventDefault()}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-brand-muted transition hover:bg-brand-btn-light hover:text-brand-text"
        >
          <Images size={15} />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[95vw] p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border px-5 py-4 text-left">
          <SheetTitle>Biblioteca de mídia</SheetTitle>
          <SheetDescription>
            Reutilize imagens já enviadas neste projeto.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-brand-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-brand-muted">
              Nenhuma imagem enviada ainda.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  title={item.fileName ?? 'Inserir imagem'}
                  onClick={() => {
                    onSelect(item.url)
                    setOpen(false)
                  }}
                  className="relative aspect-square overflow-hidden rounded-lg border border-border transition hover:border-brand-primary"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.fileName ?? ''}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
