import {Send, Square} from 'lucide-react'

interface ChatInputProps {
  input: string
  setInput: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  disabled: boolean
}

export function ChatInput({input, setInput, onSubmit, disabled}: ChatInputProps) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask about a card, deck, or spread..."
        className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        disabled={disabled}
      />

      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600 text-white transition-colors hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600"
      >
        {disabled ? <Square className="h-3 w-3" /> : <Send className="h-4 w-4" />}
      </button>
    </form>
  )
}
