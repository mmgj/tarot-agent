import {isTextUIPart, type UIMessage} from 'ai'

import {cn} from '@/lib/utils'

import {TextPart} from './TextPart'

interface MessageProps {
  message: UIMessage
}

export function Message({message}: MessageProps) {
  const isUser = message.role === 'user'
  const parts = message.parts ?? []

  const content = parts.filter(isTextUIPart).filter((part) => part.text.trim())

  if (content.length === 0) return null

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'space-y-2 rounded-2xl px-4 py-3 text-sm',
          isUser
            ? 'max-w-[85%] bg-purple-600 text-white'
            : 'max-w-[95%] bg-neutral-800 text-neutral-100',
        )}
      >
        {content.map((part, i) => (
          <TextPart key={i} text={part.text} isUser={isUser} />
        ))}
      </div>
    </div>
  )
}
