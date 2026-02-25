export function Loader() {
  return (
    <div className="flex items-center gap-3 text-xs text-neutral-400">
      <div className="flex gap-1">
        <span className="shimmer inline-block" style={{animationDelay: '0s'}}>
          ✦
        </span>
        <span className="shimmer inline-block" style={{animationDelay: '0.3s'}}>
          ✦
        </span>
        <span className="shimmer inline-block" style={{animationDelay: '0.6s'}}>
          ✦
        </span>
      </div>
      <span className="text-neutral-500">Reading the cards…</span>
    </div>
  )
}
