import {Send, Square} from 'lucide-react'
import {useCallback, useEffect, useRef} from 'react'

interface ChatInputProps {
  input: string
  setInput: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  disabled: boolean
}

export function ChatInput({input, setInput, onSubmit, disabled}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [input, adjustHeight])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !disabled) {
        onSubmit(e as unknown as React.FormEvent)
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex items-end gap-2">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about a card, draw a spread…"
        rows={1}
        className="flex-1 resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 transition-colors focus:border-purple-500/50 focus:outline-none"
        disabled={disabled}
      />

      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600/80 text-white transition-all hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600/80"
      >
        {disabled ? <Square className="h-3 w-3" /> : <Send className="h-4 w-4" />}
      </button>
    </form>
  )
}
