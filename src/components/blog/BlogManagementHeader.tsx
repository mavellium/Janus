import { BookOpen } from 'lucide-react'
import { BlogTabNav } from './BlogTabNav'

interface BlogManagementHeaderProps {
  basePath: string
}

export function BlogManagementHeader({ basePath }: BlogManagementHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-lg bg-brand-cta flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Gerenciar Blog</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus posts, categorias e tags do blog.</p>
        </div>
      </div>
      <div className="mt-4">
        <BlogTabNav basePath={basePath} />
      </div>
    </div>
  )
}
