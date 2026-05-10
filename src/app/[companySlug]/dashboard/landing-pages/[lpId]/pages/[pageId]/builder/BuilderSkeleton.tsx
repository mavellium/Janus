export function BuilderSkeleton() {
  return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-32 h-8 bg-brand-muted/20 rounded" />
        <div className="w-64 h-4 bg-brand-muted/20 rounded" />
      </div>
    </div>
  )
}
