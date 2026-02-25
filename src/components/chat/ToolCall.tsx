'use client'

import {ChevronDown, ChevronRight} from 'lucide-react'
import {useState} from 'react'

interface ToolCallProps {
  toolName: string
  state: string
  input?: unknown
  output?: unknown
}

export function ToolCall({toolName, state, input, output}: ToolCallProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const isRunning = state !== 'output-available' && state !== 'output-error'
  const statusColor = isRunning
    ? 'text-yellow-500'
    : state === 'output-error'
      ? 'text-red-500'
      : 'text-green-500'
  const statusText = isRunning ? 'Running…' : state === 'output-error' ? 'Error' : 'Done'

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-[var(--surface-raised)]"
        type="button"
      >
        {isExpanded ? (
          <ChevronDown className="h-3 w-3 text-neutral-400" />
        ) : (
          <ChevronRight className="h-3 w-3 text-neutral-400" />
        )}

        <span className="font-mono text-neutral-300">{toolName}</span>

        <span className={`${statusColor} ${isRunning ? 'shimmer' : ''}`}>{statusText}</span>
      </button>

      {isExpanded && (
        <div className="space-y-2 border-t border-[var(--border)] px-3 py-2 text-xs">
          {input !== undefined && input !== null && (
            <div>
              <div className="mb-1 font-medium text-neutral-400">Input</div>
              <pre className="overflow-x-auto rounded bg-black/30 p-2 text-neutral-300">
                {typeof input === 'string' ? input : JSON.stringify(input, null, 2)}
              </pre>
            </div>
          )}

          {output !== undefined && output !== null && (
            <div>
              <div className="mb-1 font-medium text-neutral-400">Output</div>
              <pre className="max-h-48 overflow-auto rounded bg-black/30 p-2 text-neutral-300">
                {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
