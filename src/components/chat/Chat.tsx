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
import {processDrawIntent} from '@/lib/card-draw'
import {generateSuggestions} from '@/lib/suggestions'

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
}

/**
 * Drawn cards keyed by the user message ID they're associated with.
 * Rendered between the user message and the AI response.
 */
type DrawnCardsMap = Map<string, CachedCard[]>

export function Chat({debug = false}: ChatProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [drawnCardsMap, setDrawnCardsMap] = useState<DrawnCardsMap>(new Map())
  const [cacheReady, setCacheReady] = useState(false)

  // Generate suggestions client-side only to avoid hydration mismatch
  // (generateSuggestions uses Math.random which differs server vs client)
  const [suggestions, setSuggestions] = useState<string[]>([])
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

  const handleSend = (text: string) => {
    if (!text.trim()) return

    // Detect draw intent and pick cards client-side
    const drawResult = cacheReady ? processDrawIntent(text) : null

    if (drawResult) {
      // Send augmented text (with card names injected) to the AI
      sendMessage({text: drawResult.augmentedText})

      // Store drawn cards — we'll associate them with the user message
      // once it appears in the messages array
      // Use a pending key that we'll resolve on next render
      setDrawnCardsMap((prev) => {
        const next = new Map(prev)
        next.set('__pending__', drawResult.cards)
        return next
      })
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

  const handleSuggestion = (text: string) => {
    handleSend(text)
  }

  const isLoading = status === 'submitted' || status === 'streaming'
  const showLoader = isLoading && isWaitingForText(messages)
  const toolCallsActive = hasActiveToolCalls(messages)
  const hasMessages = messages.length > 0

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {!hasMessages ? (
          /* ─── Empty state: hero layout ─── */
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
            {/* Decorative card spread */}
            <div className="flex items-end gap-2 opacity-30">
              <div className="-rotate-12 rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-6 text-lg shadow-lg">
                &#x2660;
              </div>
              <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-8 text-xl shadow-lg">
                &#x2728;
              </div>
              <div className="rotate-12 rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-6 text-lg shadow-lg">
                &#x2665;
              </div>
            </div>

            <div>
              <h2 className="font-serif text-xl font-semibold tracking-wide text-neutral-200">
                What would you like to know?
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-500">
                Ask about card meanings, draw a spread, explore symbolism, or compare artwork across
                decks.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestion(suggestion)}
                  className="rounded-full border border-neutral-700/60 bg-neutral-800/30 px-3.5 py-1.5 text-xs text-neutral-400 transition-all hover:border-purple-500/50 hover:bg-purple-950/20 hover:text-purple-300"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ─── Message list ─── */
          <div className="space-y-4">
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

                <Message message={message} />

                {/* Drawn cards — rendered between user message and AI response */}
                {message.role === 'user' && drawnCardsMap.has(message.id) && (
                  <DrawnCards cards={drawnCardsMap.get(message.id)!} />
                )}
              </div>
            ))}

            {showLoader && (
              <div className="message-enter flex justify-start">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm">
                  <Loader hasToolCalls={toolCallsActive} />
                </div>
              </div>
            )}

            {error && (
              <div className="message-enter flex justify-start">
                <div className="flex flex-col gap-2 rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                  <span>The cards are unclear. Something went wrong.</span>
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
          <div className="flex gap-1.5 overflow-x-auto px-4 pt-2 pb-0 scrollbar-none">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestion(suggestion)}
                className="shrink-0 rounded-full border border-neutral-800/60 bg-neutral-900/40 px-2.5 py-1 text-[11px] text-neutral-500 transition-all hover:border-purple-500/40 hover:text-purple-400"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <div className="p-4">
          <ChatInput input={input} setInput={setInput} onSubmit={handleSubmit} disabled={isLoading} />
        </div>
      </div>
    </div>
  )
}
