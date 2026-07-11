'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { History, RotateCcw, Loader2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet'
import { restoreBlogPostVersion } from '@/modules/blog/actions/restoreBlogPostVersion'
import { countWords } from '@/lib/reading-time'
import type { BlogPostVersionItem } from '@/modules/blog/queries/getBlogPostVersions'
import { useToast } from '@/hooks/use-toast'
import { ToastContainer } from '@/components/ui/toast-container'

interface RestoredPostData {
  title: string
  subtitle: string | null
  body: string
  coverImageUrl: string | null
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
}

export function BlogVersionsSheet({
  versions,
  onRestored,
}: {
  versions: BlogPostVersionItem[]
  onRestored: (data: RestoredPostData) => void
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const { toasts, toast, removeToast } = useToast()

  function handleRestore(id: string) {
    setRestoringId(id)
    startTransition(async () => {
      const result = await restoreBlogPostVersion(id)
      if (result.ok) {
        toast({ message: 'Versão restaurada com sucesso', type: 'success' })
        setOpen(false)
        onRestored(result.data)
        router.refresh()
      } else {
        toast({ message: result.error || 'Erro ao restaurar', type: 'error' })
      }
      setRestoringId(null)
    })
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm text-brand-text transition hover:bg-brand-btn-light"
          >
            <History size={15} />
            Histórico
            {versions.length > 0 && (
              <span className="ml-0.5 rounded-full bg-brand-primary px-1.5 text-[10px] font-bold text-white">
                {versions.length}
              </span>
            )}
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[95vw] p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border px-5 py-4 text-left">
            <SheetTitle>Histórico de versões</SheetTitle>
            <SheetDescription>
              Cada salvamento manual cria um ponto de restauração.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4">
            {versions.length === 0 ? (
              <p className="py-10 text-center text-sm text-brand-muted">
                Nenhuma versão salva ainda.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="flex flex-col gap-1.5 rounded-lg border border-border p-3"
                  >
                    <p className="truncate text-sm font-medium text-brand-text">
                      {version.title || 'Sem título'}
                    </p>
                    <p className="text-xs text-brand-muted">
                      {new Date(version.createdAt).toLocaleString('pt-BR')} ·{' '}
                      {countWords(
                        (version.body ?? '').replace(/<[^>]+>/g, ' '),
                      )}{' '}
                      palavras
                      {version.createdByName ? ` · ${version.createdByName}` : ''}
                    </p>
                    <button
                      type="button"
                      disabled={restoringId === version.id}
                      onClick={() => handleRestore(version.id)}
                      className="mt-1 inline-flex items-center gap-1.5 self-start rounded-md border border-border bg-background px-2.5 py-1 text-xs text-brand-text transition hover:bg-brand-btn-light disabled:opacity-60"
                    >
                      {restoringId === version.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <RotateCcw size={13} />
                      )}
                      Restaurar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  )
}
