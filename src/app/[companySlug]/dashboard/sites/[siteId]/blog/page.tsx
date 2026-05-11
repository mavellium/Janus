export const metadata = { title: 'Blog — Janus' }

export default async function SiteBlogPage() {
  return (
    <div className="p-8 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-text">
          Blog
        </h1>
      </div>

      <div className="bg-card rounded-xl border border-brand-btn-light p-8">
        <div className="flex items-center justify-center min-h-96">
          <p className="text-brand-muted">Gerenciador de artigos do blog</p>
        </div>
      </div>
    </div>
  )
}
