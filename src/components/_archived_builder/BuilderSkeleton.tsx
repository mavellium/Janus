export function BuilderSkeleton() {
  return (
    <div className="h-screen flex items-center justify-center bg-brand-bg">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-32 h-8 bg-brand-btn-light rounded" />
        <div className="w-64 h-4 bg-brand-btn-light rounded" />
      </div>
    </div>
  )
}
