export const metadata = { title: 'Blog — Janus' }

export default async function LandingPageBlogPage() {
  return (
    <div className="p-8 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: '#161718' }}>
          Blog
        </h1>
      </div>

      <div className="bg-white rounded-xl border border-brand-muted/40 p-8">
        <div className="flex items-center justify-center min-h-96">
          <p className="text-brand-muted">Gerenciador de artigos do blog</p>
        </div>
      </div>
    </div>
  )
}
