'use client'

import { Eye } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export function BlogPreviewSheet({
  title,
  subtitle,
  coverImageUrl,
  body,
}: {
  title: string
  subtitle: string
  coverImageUrl: string | null
  body: string
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm text-brand-text transition hover:bg-brand-btn-light"
        >
          <Eye size={15} />
          Visualizar
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[95vw] p-0 sm:max-w-2xl">
        <SheetHeader className="border-b border-border px-6 py-4 text-left">
          <SheetTitle>Pré-visualização do artigo</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto bg-brand-bg">
          <article className="mx-auto max-w-2xl px-6 py-8">
            {coverImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImageUrl}
                alt=""
                className="mb-6 w-full rounded-xl object-cover"
              />
            )}
            <h1 className="text-2xl font-bold text-brand-text sm:text-3xl">
              {title || 'Sem título'}
            </h1>
            {subtitle && (
              <p className="mt-2 text-base text-brand-muted sm:text-lg">
                {subtitle}
              </p>
            )}
            <div className="janus-rich-editor mt-6">
              <div
                className="ProseMirror"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            </div>
          </article>
        </div>
      </SheetContent>
    </Sheet>
  )
}
