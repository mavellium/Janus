export default function Loading() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-8 h-8 bg-brand-btn-light/20 rounded animate-pulse flex-shrink-0" />
        <div>
          <div className="h-8 w-48 bg-brand-btn-light/20 rounded animate-pulse" />
          <div className="h-4 w-64 bg-brand-btn-light/10 rounded animate-pulse mt-2" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="aspect-square bg-brand-btn-light/10 animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-4 w-24 bg-brand-btn-light/10 rounded animate-pulse" />
              <div className="h-3 w-full bg-brand-btn-light/10 rounded animate-pulse" />
              <div className="h-3 w-20 bg-brand-btn-light/10 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
