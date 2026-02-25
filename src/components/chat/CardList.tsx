'use client'

import {useCallback, useRef, useState} from 'react'

import {CardImage} from './CardImage'
import {type CardArtResult, type CardMeta} from '@/lib/sanity-image'

interface CardListProps {
  /** Ordered cards to display */
  cards: {art: CardArtResult; meta: CardMeta | null}[]
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function CardRow({art, meta, index}: {art: CardArtResult; meta: CardMeta | null; index: number}) {
  const [loaded, setLoaded] = useState(false)
  const loadedRef = useRef(false)

  const handleLoad = useCallback(() => {
    if (!loadedRef.current) {
      loadedRef.current = true
      setLoaded(true)
    }
  }, [])

  // Build a compact info line from metadata
  const infoParts: string[] = []
  if (meta?.arcana) infoParts.push(capitalize(meta.arcana))
  if (meta?.element) infoParts.push(capitalize(meta.element))
  if (meta?.astrology) infoParts.push(capitalize(meta.astrology))

  return (
    <div
      className="card-deal flex items-start gap-4 rounded-lg border border-neutral-800/50 bg-neutral-900/30 p-3"
      style={{animationDelay: `${index * 0.1}s`}}
    >
      {/* Card image — smaller for list view */}
      <div
        className={`shrink-0 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        style={{minHeight: loaded ? undefined : '8rem'}}
      >
        <CardImage art={art} width={90} onLoad={handleLoad} />
      </div>

      {/* Card info */}
      <div className="flex min-w-0 flex-1 flex-col gap-1 pt-1">
        <h4 className="font-serif text-base font-semibold tracking-wide text-neutral-100">
          {art.cardTitle}
        </h4>

        {infoParts.length > 0 && (
          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
            {infoParts.join(' · ')}
          </p>
        )}

        {meta?.tldr && (
          <p className="mt-0.5 text-sm leading-relaxed text-neutral-400">{meta.tldr}</p>
        )}

        {meta?.upright && meta.upright.length > 0 && (
          <p className="mt-1 text-xs text-neutral-500">
            <span className="font-medium text-neutral-400">Upright:</span>{' '}
            {meta.upright.slice(0, 2).join(' · ')}
          </p>
        )}
      </div>
    </div>
  )
}

export function CardList({cards}: CardListProps) {
  return (
    <div className="my-4 flex flex-col gap-2">
      {cards.map((card, i) => (
        <CardRow key={`${card.art.deckSlug}-${card.art.cardTitle}-${i}`} art={card.art} meta={card.meta} index={i} />
      ))}
    </div>
  )
}
