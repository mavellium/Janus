'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Check, RotateCcw, Trash2, Loader2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { createBlogComment } from '@/modules/blog/actions/createBlogComment'
import { toggleResolveBlogComment } from '@/modules/blog/actions/toggleResolveBlogComment'
import { deleteBlogComment } from '@/modules/blog/actions/deleteBlogComment'
import type { BlogCommentItem } from '@/modules/blog/queries/getBlogComments'
import { cn } from '@/lib/utils'

export function BlogCommentsSheet({
  postId,
  comments,
}: {
  postId: string
  comments: BlogCommentItem[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const openCount = comments.filter((c) => !c.resolved).length

  function add() {
    if (!text.trim()) return
    startTransition(async () => {
      const result = await createBlogComment({ postId, body: text })
      if (result.ok) {
        setText('')
        router.refresh()
      }
    })
  }

  function toggle(id: string) {
    setBusyId(id)
    startTransition(async () => {
      await toggleResolveBlogComment(id)
      router.refresh()
      setBusyId(null)
    })
  }

  function remove(id: string) {
    setBusyId(id)
    startTransition(async () => {
      await deleteBlogComment(id)
      router.refresh()
      setBusyId(null)
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm text-brand-text transition hover:bg-brand-btn-light"
        >
          <MessageSquare size={15} />
          Comentários
          {openCount > 0 && (
            <span className="ml-0.5 rounded-full bg-brand-cta px-1.5 text-[10px] font-bold text-white">
              {openCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[95vw] p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4 text-left">
          <SheetTitle>Comentários</SheetTitle>
          <SheetDescription>Notas e sugestões editoriais do artigo.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {comments.length === 0 ? (
            <p className="py-10 text-center text-sm text-brand-muted">
              Nenhum comentário ainda.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className={cn(
                    'rounded-lg border border-border p-3',
                    comment.resolved && 'bg-brand-btn-light/40 opacity-70',
                  )}
                >
                  <p
                    className={cn(
                      'whitespace-pre-wrap text-sm text-brand-text',
                      comment.resolved && 'line-through',
                    )}
                  >
                    {comment.body}
                  </p>
                  <p className="mt-1 text-xs text-brand-muted">
                    {comment.authorName} ·{' '}
                    {new Date(comment.createdAt).toLocaleString('pt-BR')}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={busyId === comment.id}
                      onClick={() => toggle(comment.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-brand-text transition hover:bg-brand-btn-light disabled:opacity-60"
                    >
                      {busyId === comment.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : comment.resolved ? (
                        <RotateCcw size={12} />
                      ) : (
                        <Check size={12} />
                      )}
                      {comment.resolved ? 'Reabrir' : 'Resolver'}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === comment.id}
                      onClick={() => remove(comment.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs text-destructive transition hover:bg-destructive/20 disabled:opacity-60"
                    >
                      <Trash2 size={12} />
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border p-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escreva um comentário..."
            rows={2}
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-brand-text placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button
            type="button"
            onClick={add}
            disabled={!text.trim() || isPending}
            className="mt-2 w-full gap-1.5"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Adicionar comentário
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
