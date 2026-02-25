import {isTextUIPart, type UIMessage} from 'ai'

import {cn} from '@/lib/utils'

import {TextPart} from './TextPart'

/** Strip the injected draw context from user messages for display */
const DRAW_CONTEXT_RE = /\n\n\[The following cards were drawn[\s\S]*?\]$/

interface MessageProps {
  message: UIMessage
  /** Called when a card image is clicked in the AI response */
  onSelectCard?: (title: string) => void
}

export function Message({message, onSelectCard}: MessageProps) {
  const isUser = message.role === 'user'
  const parts = message.parts ?? []

  const content = parts
    .filter(isTextUIPart)
    .map((part) => ({...part, text: isUser ? part.text.replace(DRAW_CONTEXT_RE, '') : part.text}))
    .filter((part) => part.text.trim())

  if (content.length === 0) return null

  return (
    <div className={cn('message-enter flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'space-y-3 rounded-2xl px-3 py-2.5 text-sm',
          isUser
            ? 'max-w-[85%] bg-purple-600/90 text-white'
            : 'w-full border border-[var(--border)] bg-[var(--surface)] text-neutral-200',
        )}
      >
        {content.map((part, i) => (
          <TextPart key={i} text={part.text} isUser={isUser} onSelectCard={onSelectCard} />
        ))}
      </div>
    </div>
  )
}
