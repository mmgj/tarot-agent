'use client'

interface LoaderProps {
  /** Whether tool calls are in progress */
  hasToolCalls?: boolean
}

export function Loader({hasToolCalls = false}: LoaderProps) {
  const text = hasToolCalls ? 'Consulting the cards…' : 'Reading…'

  return (
    <div className="flex items-center gap-3 text-xs text-neutral-500">
      <span className="loader-pulse inline-block text-purple-400">✦</span>
      <span>{text}</span>
    </div>
  )
}
