'use client'

import { useSearchParams } from 'next/navigation'
import { ArrowLeft, ImageOff, Pencil, Trash2 } from 'lucide-react'
import { updateGuestPostAsAdmin } from '@/modules/admin/actions/updateGuestPostAsAdmin'
import { deleteGuestPostAsAdmin } from '@/modules/admin/actions/deleteGuestPostAsAdmin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DeleteAlertModal } from '@/components/ui/delete-alert-modal'

interface Post {
  id: string
  title: string | null
  message: string
  imageUrl: string
  mediaType: string
  guestId: string
  createdAt: Date
}

interface Guest {
  id: string
  name: string
  email: string
  company: { name: string; slug: string }
  posts: Post[]
}

function EditPostModal({ post, guestId }: { post: Post; guestId: string }) {
  const searchParams = useSearchParams()
  const isOpen = searchParams.get('editing') === post.id
  const params = new URLSearchParams(searchParams)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const result = await updateGuestPostAsAdmin(formData)
    if (result.ok) {
      params.delete('editing')
      window.history.replaceState(null, '', `?${params.toString()}`)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      params.delete('editing')
      window.history.replaceState(null, '', `?${params.toString()}`)
    }}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-brand-text">Editar Publicação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={post.id} />

          <div className="flex flex-col gap-1.5">
            <Label>Título (opcional)</Label>
            <Input name="title" defaultValue={post.title ?? ''} placeholder="Título da publicação" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Mensagem</Label>
            <textarea
              name="message"
              required
              defaultValue={post.message}
              placeholder="Mensagem..."
              rows={4}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-50 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => {
              params.delete('editing')
              window.history.replaceState(null, '', `?${params.toString()}`)
            }}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeletePostModal({ post, guestId }: { post: Post; guestId: string }) {
  const searchParams = useSearchParams()
  const params = new URLSearchParams(searchParams)
  const isOpen = searchParams.get('deleting') === post.id

  async function handleDelete() {
    await deleteGuestPostAsAdmin(post.id, guestId)
    params.delete('deleting')
    window.history.replaceState(null, '', `?${params.toString()}`)
  }

  return (
    <DeleteAlertModal
      isOpen={isOpen}
      onClose={() => {
        params.delete('deleting')
        window.history.replaceState(null, '', `?${params.toString()}`)
      }}
      onConfirm={handleDelete}
      isDeleting={false}
      description="Esta ação excluirá permanentemente esta publicação."
    />
  )
}

function PostCard({ post, guestId }: { post: Post; guestId: string }) {
  const searchParams = useSearchParams()

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden group">
      <div className="relative aspect-square bg-brand-btn-light">
        {post.mediaType === 'VIDEO' ? (
          <video
            src={post.imageUrl}
            className="w-full h-full object-cover"
            controls
          />
        ) : (
          <img
            src={post.imageUrl}
            alt={post.title ?? 'Publicação'}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="p-3 flex flex-col gap-2">
        {post.title && (
          <p className="text-sm font-medium text-brand-text line-clamp-1">{post.title}</p>
        )}
        <p className="text-xs text-brand-muted line-clamp-2">{post.message}</p>
        <p className="text-[11px] text-brand-muted">
          {new Date(post.createdAt).toLocaleDateString('pt-BR')}
        </p>

        <div className="flex items-center justify-end gap-1 pt-1 border-t border-border">
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams)
              params.set('editing', post.id)
              window.history.replaceState(null, '', `?${params.toString()}`)
            }}
            className="p-1.5 rounded text-brand-muted hover:text-brand-primary hover:bg-brand-btn-light transition"
            title="Editar"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams)
              params.set('deleting', post.id)
              window.history.replaceState(null, '', `?${params.toString()}`)
            }}
            className="p-1.5 rounded text-brand-muted hover:text-destructive hover:bg-destructive/10 transition"
            title="Excluir"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminGuestPostsClient({ guest }: { guest: Guest }) {
  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => window.history.back()}
          className="p-1.5 rounded text-brand-muted hover:text-brand-text hover:bg-brand-btn-light transition"
          title="Voltar"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-brand-text">
            Publicações de {guest.name}
          </h1>
          <p className="text-sm text-brand-muted mt-0.5">
            {guest.email} · <code className="text-xs text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded">{guest.company.slug}</code>
          </p>
        </div>
      </div>

      {guest.posts.length === 0 ? (
        <div className="bg-card border border-border rounded-xl flex flex-col items-center justify-center py-16 gap-3">
          <ImageOff className="w-10 h-10 text-brand-muted opacity-40" />
          <p className="text-sm text-brand-muted">Nenhuma publicação encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {guest.posts.map((post) => (
            <PostCard key={post.id} post={post} guestId={guest.id} />
          ))}
        </div>
      )}

      {guest.posts.map((post) => (
        <div key={post.id}>
          <EditPostModal post={post} guestId={guest.id} />
          <DeletePostModal post={post} guestId={guest.id} />
        </div>
      ))}
    </div>
  )
}
