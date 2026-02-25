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
import {Loader} from './Loader'
import {Message} from './message/Message'
import {ToolCall} from './ToolCall'

function isWaitingForText(messages: UIMessage[]): boolean {
  const last = messages[messages.length - 1]
  if (!last || last.role !== 'assistant') return true

  const parts = last.parts ?? []
  if (parts.length === 0) return true

  const lastPart = parts[parts.length - 1]
  return !(lastPart.type === 'text' && lastPart.text.trim().length > 0)
}

interface ChatProps {
  debug?: boolean
}

export function Chat({debug = false}: ChatProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {messages, sendMessage, status, error, regenerate} = useChat({
    sendAutomaticallyWhen: ({messages}) => {
      return lastAssistantMessageIsCompleteWithToolCalls({messages})
    },
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'})
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage({text: input})
    setInput('')
  }

  const isLoading = status === 'submitted' || status === 'streaming'
  const showLoader = isLoading && isWaitingForText(messages)

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="text-4xl">&#x2728;</div>
            <div>
              <h2 className="text-lg font-medium text-neutral-200">Ask the cards</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Ask about card meanings, symbolism, decks, or esoteric correspondences.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              {[
                'What does The Tower mean?',
                'Tell me about the suit of Cups',
                'Which cards are associated with water?',
                'Compare the Major Arcana across decks',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    sendMessage({text: suggestion})
                  }}
                  className="rounded-full border border-neutral-700 px-3 py-1.5 text-neutral-400 transition-colors hover:border-purple-500 hover:text-purple-400"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
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

                <Message message={message} />
              </div>
            ))}

            {showLoader && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl bg-neutral-800 px-4 py-3 text-sm">
                  <Loader />
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-start">
                <div className="flex flex-col gap-2 rounded-2xl bg-red-950/50 px-4 py-3 text-sm text-red-300">
                  <span>Something went wrong.</span>
                  <button
                    type="button"
                    onClick={() => regenerate()}
                    className="w-fit rounded-lg bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-500"
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

      {/* Input */}
      <div className="border-t border-neutral-800 p-4">
        <ChatInput input={input} setInput={setInput} onSubmit={handleSubmit} disabled={isLoading} />
      </div>
    </div>
  )
}
