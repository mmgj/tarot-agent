import React from 'react'
import ReactMarkdown from 'react-markdown'

import {CardSpread} from '@/components/chat/CardSpread'
import {cn} from '@/lib/utils'

interface TextPartProps {
  text: string
  isUser: boolean
}

// Matches a COMPLETE markdown image: ![alt](url)
const COMPLETE_IMAGE_RE = /!\[([^\]]*)\]\(([^)]+)\)/g

// Matches the START of an incomplete image that's still streaming:
// ![...  or  ![alt](... — anything that looks like it's building toward an image
const INCOMPLETE_IMAGE_RE = /!\[[^\]]*\]?\(?[^)]*$/

// Match a line that is ONLY complete markdown images
const IMAGE_ONLY_LINE_RE = /^(?:\s*!\[[^\]]*\]\([^)]+\)\s*)+$/

interface Block {
  type: 'text' | 'images'
  content: string
  cardTitles?: string[]
}

/**
 * Split text into blocks, separating image-only lines from text.
 * Incomplete image markdown at the end of the text is HELD BACK
 * (not rendered) to prevent flicker during streaming.
 *
 * IMPORTANT: Consecutive image-only lines are merged into a single
 * images block. This prevents the AI streaming 22 cards across
 * multiple lines from creating 22 separate CardSpread instances
 * that shift between detail/spread/list views as they accumulate.
 */
function splitBlocks(text: string): {blocks: Block[]; hasIncomplete: boolean} {
  // Check if the text ends with an incomplete image markdown
  const incompleteMatch = text.match(INCOMPLETE_IMAGE_RE)
  let cleanText = text
  let hasIncomplete = false

  if (incompleteMatch) {
    // Check it's not actually a complete image
    const tail = incompleteMatch[0]
    const completeInTail = tail.match(/!\[[^\]]*\]\([^)]+\)/)
    if (!completeInTail || completeInTail[0] !== tail) {
      // Truly incomplete — strip it from rendering
      cleanText = text.slice(0, incompleteMatch.index)
      hasIncomplete = true
    }
  }

  const lines = cleanText.split('\n')
  const rawBlocks: Block[] = []
  let textBuffer: string[] = []

  const flushText = () => {
    if (textBuffer.length > 0) {
      const content = textBuffer.join('\n').trim()
      if (content) {
        rawBlocks.push({type: 'text', content})
      }
      textBuffer = []
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && IMAGE_ONLY_LINE_RE.test(trimmed)) {
      flushText()
      // Extract card titles from alt text
      const titles: string[] = []
      let match
      const re = new RegExp(COMPLETE_IMAGE_RE.source, 'g')
      while ((match = re.exec(trimmed)) !== null) {
        if (match[1]) titles.push(match[1])
      }
      rawBlocks.push({type: 'images', content: trimmed, cardTitles: titles})
    } else {
      textBuffer.push(line)
    }
  }
  flushText()

  // Merge consecutive image blocks into one
  const blocks: Block[] = []
  for (const block of rawBlocks) {
    const prev = blocks[blocks.length - 1]
    if (block.type === 'images' && prev?.type === 'images') {
      prev.content += '\n' + block.content
      prev.cardTitles = [...(prev.cardTitles || []), ...(block.cardTitles || [])]
    } else {
      blocks.push({...block, cardTitles: block.cardTitles ? [...block.cardTitles] : undefined})
    }
  }

  return {blocks, hasIncomplete}
}

function MarkdownBlock({text, isUser}: {text: string; isUser: boolean}) {
  return (
    <ReactMarkdown
      components={{
        a({href = '', children}) {
          const className = cn(
            'underline transition-colors',
            isUser ? 'text-white/90 hover:text-white' : 'text-purple-400 hover:text-purple-300',
          )
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
              {children}
            </a>
          )
        },
        p: ({children}) => <p className="whitespace-pre-wrap leading-relaxed">{children}</p>,
        ul: ({children}) => (
          <ul className="list-disc space-y-1 pl-5 marker:text-purple-500/50">{children}</ul>
        ),
        ol: ({children}) => (
          <ol className="list-decimal space-y-1 pl-5 marker:text-purple-500/50">{children}</ol>
        ),
        li: ({children}) => <li className="leading-relaxed">{children}</li>,
        strong: ({children}) => (
          <strong className="font-serif font-semibold text-purple-300">{children}</strong>
        ),
        em: ({children}) => <em className="text-neutral-300 italic">{children}</em>,
        h2: ({children}) => (
          <h2 className="mt-4 mb-2 font-serif text-lg font-semibold tracking-wide text-neutral-100">
            {children}
          </h2>
        ),
        h3: ({children}) => (
          <h3 className="mt-3 mb-1 font-serif text-base font-medium text-neutral-200">
            {children}
          </h3>
        ),
        hr: () => (
          <hr className="my-4 border-none text-center before:text-neutral-600 before:tracking-[0.5em] before:content-['✦_✦_✦']" />
        ),
        blockquote: ({children}) => (
          <blockquote className="my-3 border-l-2 border-purple-500/40 pl-4 text-neutral-400 italic">
            {children}
          </blockquote>
        ),
        // Strip any inline images that weren't extracted — they'll be handled by CardSpread
        img: () => null,
      }}
    >
      {text}
    </ReactMarkdown>
  )
}

export function TextPart({text, isUser}: TextPartProps) {
  if (!text.trim()) return null

  const {blocks} = splitBlocks(text)

  return (
    <div className="space-y-1">
      {blocks.map((block, i) =>
        block.type === 'images' && block.cardTitles?.length ? (
          <CardSpread key={`spread-${i}`} cardTitles={block.cardTitles} />
        ) : block.type === 'text' ? (
          <MarkdownBlock key={`text-${i}`} text={block.content} isUser={isUser} />
        ) : null,
      )}
    </div>
  )
}
