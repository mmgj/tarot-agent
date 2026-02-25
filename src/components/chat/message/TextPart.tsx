import React from 'react'
import ReactMarkdown from 'react-markdown'

import {cn} from '@/lib/utils'

interface TextPartProps {
  text: string
  isUser: boolean
}

// Match a line that is ONLY markdown images: ![alt](url) ![alt](url) ...
const IMAGE_LINE_RE = /^(?:\s*!\[([^\]]*)\]\(([^)]+)\)\s*)+$/

interface ImageRef {
  alt: string
  src: string
}

// Match individual images within a line
const SINGLE_IMAGE_RE = /!\[([^\]]*)\]\(([^)]+)\)/g

function parseImageLine(line: string): ImageRef[] {
  const images: ImageRef[] = []
  let match
  while ((match = SINGLE_IMAGE_RE.exec(line)) !== null) {
    images.push({alt: match[1], src: match[2]})
  }
  SINGLE_IMAGE_RE.lastIndex = 0
  return images
}

interface Block {
  type: 'text' | 'images'
  content: string
  images?: ImageRef[]
}

/**
 * Split markdown text into blocks of text and image-only lines.
 * Image lines are extracted so they can be rendered as plain HTML
 * instead of going through ReactMarkdown (which causes nesting issues).
 */
function splitBlocks(text: string): Block[] {
  const lines = text.split('\n')
  const blocks: Block[] = []
  let textBuffer: string[] = []

  const flushText = () => {
    if (textBuffer.length > 0) {
      const content = textBuffer.join('\n').trim()
      if (content) {
        blocks.push({type: 'text', content})
      }
      textBuffer = []
    }
  }

  for (const line of lines) {
    if (IMAGE_LINE_RE.test(line.trim())) {
      flushText()
      blocks.push({
        type: 'images',
        content: line,
        images: parseImageLine(line),
      })
    } else {
      textBuffer.push(line)
    }
  }
  flushText()

  return blocks
}

function CardImages({images}: {images: ImageRef[]}) {
  return (
    <div className="my-4 flex flex-wrap items-end justify-center gap-4">
      {images.map((img, i) => (
        <div key={i} className="card-deal inline-flex flex-col items-center gap-2">
          <div className="card-image overflow-hidden rounded-lg shadow-lg shadow-black/40">
            <img
              src={img.src}
              alt={img.alt || 'Card image'}
              className="h-auto w-36 object-contain sm:w-44"
              loading="lazy"
            />
          </div>
          {img.alt && (
            <span className="font-serif text-xs font-medium tracking-wide text-neutral-400">
              {img.alt}
            </span>
          )}
        </div>
      ))}
    </div>
  )
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
        // Fallback for any inline images that slip through
        img: ({src, alt}) => (
          <img
            src={src}
            alt={alt || 'Card image'}
            className="my-2 inline-block h-auto w-36 rounded-lg object-contain shadow-lg shadow-black/40 sm:w-44"
            loading="lazy"
          />
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  )
}

export function TextPart({text, isUser}: TextPartProps) {
  if (!text.trim()) return null

  const blocks = splitBlocks(text)

  return (
    <div className="space-y-1">
      {blocks.map((block, i) =>
        block.type === 'images' && block.images ? (
          <CardImages key={i} images={block.images} />
        ) : (
          <MarkdownBlock key={i} text={block.content} isUser={isUser} />
        ),
      )}
    </div>
  )
}
