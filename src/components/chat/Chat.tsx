'use client'

import {useChat} from '@ai-sdk/react'
import {
  getToolName,
  isToolUIPart,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from 'ai'
import {useEffect, useRef, useState} from 'react'

import {ChatInput} from './ChatInput'
import {DrawnCards} from './DrawnCards'
import {Loader} from './Loader'
import {Message} from './message/Message'
import {ToolCall} from './ToolCall'
import {warmCardCache, type CachedCard} from '@/lib/card-cache'
import {drawRandomCards, processDrawIntent} from '@/lib/card-draw'
import {generateSuggestions, type Suggestion} from '@/lib/suggestions'

function isWaitingForText(messages: UIMessage[]): boolean {
  const last = messages[messages.length - 1]
  if (!last || last.role !== 'assistant') return true

  const parts = last.parts ?? []
  if (parts.length === 0) return true

  const lastPart = parts[parts.length - 1]
  return !(lastPart.type === 'text' && lastPart.text.trim().length > 0)
}

/** Check if the last assistant message has any tool call parts */
function hasActiveToolCalls(messages: UIMessage[]): boolean {
  const last = messages[messages.length - 1]
  if (!last || last.role !== 'assistant') return false
  return (last.parts ?? []).some(isToolUIPart)
}

interface ChatProps {
  debug?: boolean
  /** Called when a card is selected (from drawn cards or AI-streamed images) */
  onSelectCard?: (title: string) => void
  /** Called when a spread is dealt (client-side draw) */
  onSpreadDealt?: (cards: CachedCard[]) => void
}

/**
 * Drawn cards keyed by the user message ID they're associated with.
 * Rendered between the user message and the AI response.
 */
type DrawnCardsMap = Map<string, CachedCard[]>

export function Chat({debug = false, onSelectCard, onSpreadDealt}: ChatProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [drawnCardsMap, setDrawnCardsMap] = useState<DrawnCardsMap>(new Map())
  const [cacheReady, setCacheReady] = useState(false)

  // Generate suggestions client-side only to avoid hydration mismatch
  // (generateSuggestions uses Math.random which differs server vs client)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  useEffect(() => {
    setSuggestions(generateSuggestions())
  }, [])

  // Warm card cache early so draws and detail views work instantly
  useEffect(() => {
    warmCardCache()
      .then(() => setCacheReady(true))
      .catch(() => {})
  }, [])

  const {messages, sendMessage, status, error, regenerate} = useChat({
    sendAutomaticallyWhen: ({messages}) => {
      return lastAssistantMessageIsCompleteWithToolCalls({messages})
    },
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'})
  }, [messages])

  /**
   * Send a message, optionally with a forced client-side draw.
   * @param text - The user's message text
   * @param forceDrawCount - If set, skip detection and draw this many cards
   */
  const handleSend = (text: string, forceDrawCount?: number) => {
    if (!text.trim()) return

    // Forced draw (from suggestion chips) or detected draw (from typed text)
    let cards: CachedCard[] | null = null
    let augmentedText: string | null = null

    if (forceDrawCount && cacheReady) {
      cards = drawRandomCards(forceDrawCount)
      if (cards.length > 0) {
        const cardNames = cards.map((c) => c.name).join(', ')
        augmentedText = `${text}\n\n[The following cards were drawn for this reading: ${cardNames}. These cards were randomly selected — provide your reading for exactly these cards. Do NOT draw different cards or use tools to select cards. Do NOT include image markdown (![...](url)) for these cards — they are already displayed to the user. Focus entirely on your interpretation.]`
      }
    } else if (cacheReady) {
      const drawResult = processDrawIntent(text)
      if (drawResult) {
        cards = drawResult.cards
        augmentedText = drawResult.augmentedText
      }
    }

    if (cards && augmentedText) {
      sendMessage({text: augmentedText})
      setDrawnCardsMap((prev) => {
        const next = new Map(prev)
        next.set('__pending__', cards!)
        return next
      })
      // Notify parent about the spread
      onSpreadDealt?.(cards)
    } else {
      sendMessage({text})
    }
  }

  // Resolve pending drawn cards to the actual user message ID
  useEffect(() => {
    if (!drawnCardsMap.has('__pending__')) return

    // Find the latest user message
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
    if (!lastUserMsg) return

    setDrawnCardsMap((prev) => {
      const pending = prev.get('__pending__')
      if (!pending) return prev
      const next = new Map(prev)
      next.delete('__pending__')
      next.set(lastUserMsg.id, pending)
      return next
    })
  }, [messages, drawnCardsMap])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSend(input)
    setInput('')
  }

  const handleSuggestion = (suggestion: Suggestion) => {
    handleSend(suggestion.label, suggestion.drawCount)
  }

  const isLoading = status === 'submitted' || status === 'streaming'
  const showLoader = isLoading && isWaitingForText(messages)
  const toolCallsActive = hasActiveToolCalls(messages)
  const hasMessages = messages.length > 0

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3">
        {!hasMessages ? (
          /* ─── Empty state: suggestion chips ─── */
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div>
              <h2 className="font-serif text-lg font-semibold tracking-wide text-neutral-200">
                What would you like to know?
              </h2>
              <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-neutral-500">
                Draw a spread, explore card meanings, or compare artwork across decks.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.label}
                  type="button"
                  onClick={() => handleSuggestion(suggestion)}
                  className="rounded-full border border-neutral-700/60 bg-neutral-800/30 px-3 py-1.5 text-xs text-neutral-400 transition-all hover:border-purple-500/50 hover:bg-purple-950/20 hover:text-purple-300"
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ─── Message list ─── */
          <div className="space-y-3">
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                {/* Tool calls (debug only) */}
                {debug &&
                  (message.parts ?? []).filter(isToolUIPart).map((part, i) => (
                    <div key={`${message.id}-tool-${i}`} className="flex justify-start">
                      <div className="max-w-[85%]">
                        <ToolCall
                          toolName={getToolName(part)}
                          state={part.state}
                          input={part.input}
                          output={'output' in part ? part.output : undefined}
                        />
                      </div>
                    </div>
                  ))}

                <Message message={message} onSelectCard={onSelectCard} />

                {/* Drawn cards — compact thumbnails between user message and AI response */}
                {message.role === 'user' && drawnCardsMap.has(message.id) && (
                  <DrawnCards cards={drawnCardsMap.get(message.id)!} onSelectCard={onSelectCard} />
                )}
              </div>
            ))}

            {showLoader && (
              <div className="message-enter flex justify-start">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
                  <Loader hasToolCalls={toolCallsActive} />
                </div>
              </div>
            )}

            {error && (
              <div className="message-enter flex justify-start">
                <div className="flex flex-col gap-2 rounded-2xl border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
                  <span>Something went wrong.</span>
                  <button
                    type="button"
                    onClick={() => regenerate()}
                    className="w-fit rounded-lg bg-red-600/80 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-500"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-[var(--border)]">
        {/* Collapsed suggestion chips — shown after first message */}
        {hasMessages && !isLoading && suggestions.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto px-3 pt-2 pb-0 scrollbar-none">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.label}
                type="button"
                onClick={() => handleSuggestion(suggestion)}
                className="shrink-0 rounded-full border border-neutral-800/60 bg-neutral-900/40 px-2.5 py-1 text-[11px] text-neutral-500 transition-all hover:border-purple-500/40 hover:text-purple-400"
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        )}

        <div className="p-3">
          <ChatInput input={input} setInput={setInput} onSubmit={handleSubmit} disabled={isLoading} />
        </div>
      </div>
    </div>
  )
}
