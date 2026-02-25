import React from 'react'
import ReactMarkdown from 'react-markdown'
import type {Element, Text} from 'hast'

import {cn} from '@/lib/utils'

interface TextPartProps {
  text: string
  isUser: boolean
}

function isImageOnlyParagraph(node: Element | undefined): boolean {
  if (!node?.children) return false
  const meaningful = node.children.filter(
    (child) => !(child.type === 'text' && !(child as Text).value?.trim()),
  )
  return meaningful.length > 0 && meaningful.every((child) => (child as Element).tagName === 'img')
}

export function TextPart({text, isUser}: TextPartProps) {
  if (!text.trim()) return null

  return (
    <ReactMarkdown
      components={{
        a({href = '', children}) {
          const className = cn(
            'underline',
            isUser ? 'text-white/90 hover:text-white' : 'text-purple-400 hover:text-purple-300',
          )
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
              {children}
            </a>
          )
        },
        p: ({children, node}) => {
          if (isImageOnlyParagraph(node as Element | undefined)) {
            return (
              <div className="my-3 flex items-end justify-center gap-3">{children}</div>
            )
          }
          return <p className="whitespace-pre-wrap">{children}</p>
        },
        ul: ({children}) => <ul className="list-disc pl-4">{children}</ul>,
        ol: ({children}) => <ol className="list-decimal pl-4">{children}</ol>,
        strong: ({children}) => <strong className="font-semibold">{children}</strong>,
        h2: ({children}) => <h2 className="mt-3 mb-1 text-base font-semibold">{children}</h2>,
        h3: ({children}) => <h3 className="mt-2 mb-1 text-sm font-semibold">{children}</h3>,
        img: ({src, alt}) => (
          <figure className="inline-flex flex-col items-center gap-1">
            <img
              src={src}
              alt={alt || 'Card image'}
              className="max-h-72 rounded-lg object-contain shadow-md shadow-black/30"
            />
            {alt && alt !== 'Card image' && (
              <figcaption className="text-xs text-neutral-400">{alt}</figcaption>
            )}
          </figure>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  )
}
