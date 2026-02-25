'use client'

import {useCallback, useRef, useState} from 'react'

import {CardImage} from './CardImage'
import {type CardArtResult, type CardMeta} from '@/lib/sanity-image'

interface CardListProps {
  /** Ordered cards to display */
  cards: {art: CardArtResult; meta: CardMeta | null}[]
  /** Called when a card is clicked — opens it in the info panel */
  onSelectCard?: (title: string) => void
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ─── Card Row ───────────────────────────────────────────────────

function CardRow({
  art,
  meta,
  index,
  onClick,
}: {
  art: CardArtResult
  meta: CardMeta | null
  index: number
  onClick: () => void
}) {
  const [loaded, setLoaded] = useState(false)
  const loadedRef = useRef(false)

  const handleLoad = useCallback(() => {
    if (!loadedRef.current) {
      loadedRef.current = true
      setLoaded(true)
    }
  }, [])

  const infoParts: string[] = []
  if (meta?.arcana) infoParts.push(capitalize(meta.arcana))
  if (meta?.element) infoParts.push(capitalize(meta.element))
  if (meta?.astrology) infoParts.push(capitalize(meta.astrology))

  return (
    <button
      type="button"
      onClick={onClick}
      className="card-deal flex w-full items-start gap-3 rounded-lg border border-neutral-800/50 bg-neutral-900/30 p-2 text-left transition-colors hover:border-purple-500/30 hover:bg-neutral-900/60"
      style={{animationDelay: `${index * 0.1}s`}}
    >
      {/* Card image */}
      <div
        className={`shrink-0 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      >
        <CardImage art={art} width={48} onLoad={handleLoad} />
      </div>

      {/* Card info */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
        <h4 className="font-serif text-sm font-semibold tracking-wide text-neutral-100">
          {art.cardTitle}
        </h4>

        {infoParts.length > 0 && (
          <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
            {infoParts.join(' · ')}
          </p>
        )}

        {meta?.tldr && (
          <p className="mt-0.5 truncate text-xs text-neutral-400">{meta.tldr}</p>
        )}
      </div>
    </button>
  )
}

// ─── Main Component ─────────────────────────────────────────────

export function CardList({cards, onSelectCard}: CardListProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {cards.map((card, i) => (
        <CardRow
          key={`${card.art.deckSlug}-${card.art.cardTitle}-${i}`}
          art={card.art}
          meta={card.meta}
          index={i}
          onClick={() => onSelectCard?.(card.art.cardTitle)}
        />
      ))}
    </div>
  )
}
