'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { NewPostModal } from './NewPostModal'
import { EditPostModal } from './EditPostModal'
import { DeletePostButton } from './DeletePostButton'

interface Post {
  id: string
  title: string | null
  message: string
  imageUrl: string
  mediaType: string
  createdAt: Date
}

interface Guest {
  id: string
  name: string
  email: string
}

interface Props {
  guest: Guest
  posts: Post[]
  companySlug: string
}

export function GuestGalleryClient({ guest, posts, companySlug }: Props) {
  const [showNewPost, setShowNewPost] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  function handlePostCreated() {
    setShowNewPost(false)
    setRefreshKey((k) => k + 1)
  }

  function handlePostUpdated() {
    setEditingPost(null)
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-brand-text">Minhas Postagens</h1>
            <p className="text-sm text-brand-muted mt-1">{posts.length} mídia{posts.length !== 1 ? '(s)' : ''}</p>
          </div>
          <Button onClick={() => setShowNewPost(true)} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Nova Mídia
          </Button>
        </div>

        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 rounded-full bg-brand-btn-light flex items-center justify-center">
              <Plus className="w-8 h-8 text-brand-muted" />
            </div>
            <p className="text-brand-text font-medium">Nenhuma mídia ainda</p>
            <p className="text-sm text-brand-muted">Clique em "Nova Mídia" para começar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition">
                <div className="relative aspect-video overflow-hidden bg-brand-btn-light">
                  {post.mediaType === 'VIDEO' ? (
                    <video
                      src={post.imageUrl}
                      className="w-full h-full object-cover"
                      controls
                    />
                  ) : (
                    <Image
                      src={post.imageUrl}
                      alt={post.title || 'Mídia'}
                      fill
                      className="object-cover hover:scale-105 transition duration-300"
                    />
                  )}
                </div>
                <div className="p-4 flex flex-col gap-3">
                  {post.title && (
                    <h3 className="font-semibold text-brand-text truncate">{post.title}</h3>
                  )}
                  <p className="text-sm text-brand-muted line-clamp-2">{post.message}</p>
                  <p className="text-xs text-brand-muted">
                    {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setEditingPost(post)}
                    >
                      Editar
                    </Button>
                    <DeletePostButton postId={post.id} companySlug={companySlug} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showNewPost && (
        <NewPostModal
          guestName={guest.name}
          companySlug={companySlug}
          onClose={() => setShowNewPost(false)}
          onSuccess={handlePostCreated}
        />
      )}

      {editingPost && (
        <EditPostModal
          post={editingPost}
          companySlug={companySlug}
          onClose={() => setEditingPost(null)}
          onSuccess={handlePostUpdated}
        />
      )}
    </div>
  )
}
