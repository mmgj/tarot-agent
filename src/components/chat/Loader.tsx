import {Loader2} from 'lucide-react'

export function Loader() {
  return (
    <div className="flex items-center gap-2 text-xs text-neutral-400">
      <Loader2 className="h-3 w-3 animate-spin" />
      <span>Consulting the cards...</span>
    </div>
  )
}
