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
            'underline transition-colors',
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
              <div className="my-4 flex flex-wrap items-end justify-center gap-4">{children}</div>
            )
          }
          return <p className="whitespace-pre-wrap leading-relaxed">{children}</p>
        },
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
        img: ({src, alt}) => (
          <figure className="card-deal inline-flex flex-col items-center gap-2">
            <div className="card-image overflow-hidden rounded-lg shadow-lg shadow-black/40">
              <img
                src={src}
                alt={alt || 'Card image'}
                className="h-auto w-36 object-contain sm:w-44"
              />
            </div>
            {alt && alt !== 'Card image' && (
              <figcaption className="font-serif text-xs font-medium tracking-wide text-neutral-400">
                {alt}
              </figcaption>
            )}
          </figure>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  )
}
