export default function Loading() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-brand-btn-light/20 rounded animate-pulse flex-shrink-0" />
          <div>
            <div className="h-8 w-56 bg-brand-btn-light/20 rounded animate-pulse" />
            <div className="h-4 w-64 bg-brand-btn-light/10 rounded animate-pulse mt-2" />
          </div>
        </div>
        <div className="w-8 h-8 bg-brand-btn-light/20 rounded animate-pulse" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="space-y-px">
          <div className="h-12 bg-brand-btn-light/10" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 bg-brand-btn-light/5 border-t border-border/30" />
          ))}
        </div>
      </div>
    </div>
  )
}
