import React from 'react'
import ReactMarkdown from 'react-markdown'

import {CardImage} from '@/components/chat/CardImage'
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

function CardSpread({images}: {images: ImageRef[]}) {
  return (
    <div className="my-4 flex flex-wrap items-start justify-center gap-5">
      {images.map((img, i) => (
        <CardImage key={i} src={img.src} alt={img.alt} />
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
        // Fallback for inline images that weren't extracted
        img: ({src = '', alt = ''}) => <CardImage src={String(src)} alt={String(alt)} />,
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
          <CardSpread key={i} images={block.images} />
        ) : (
          <MarkdownBlock key={i} text={block.content} isUser={isUser} />
        ),
      )}
    </div>
  )
}
