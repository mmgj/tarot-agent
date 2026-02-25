'use client'

import {CardImage} from './CardImage'
import {type CachedCard} from '@/lib/card-cache'
import {type CardArtResult} from '@/lib/sanity-image'

interface DrawnCardsProps {
  cards: CachedCard[]
  /** Called when a card thumbnail is clicked — opens it in the info panel */
  onSelectCard?: (title: string) => void
}

/**
 * Compact card thumbnails rendered inline in the chat flow.
 * Clicking a card opens it in the CardInfoPanel (2/3 panel).
 * No detail rendering here — just visual record of the draw.
 */
export function DrawnCards({cards, onSelectCard}: DrawnCardsProps) {
  if (cards.length === 0) return null

  return (
    <div className="message-enter my-1.5 flex flex-wrap items-start gap-2">
      {cards.map((card) => {
        const art = cachedCardToArt(card)
        if (!art) return null
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectCard?.(card.name)}
            className="group flex flex-col items-center gap-1 transition-transform hover:scale-105"
            title={card.name}
          >
            <div style={{width: '60px'}}>
              <CardImage art={art} width={60} />
            </div>
            <span className="max-w-[68px] truncate text-[10px] text-neutral-500 group-hover:text-neutral-300">
              {card.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/**
 * Convert a CachedCard's Smith-Waite data into a CardArtResult
 * so it can be rendered by CardImage.
 */
function cachedCardToArt(card: CachedCard): CardArtResult | null {
  if (!card.smithWaite) return null
  return {
    cardTitle: card.name,
    deckName: 'Rider Smith Waite',
    deckId: 'deck-smith-waite',
    deckSlug: 'smith-waite',
    cornerRounding: card.smithWaite.cornerRounding,
    imageUrl: card.smithWaite.imageUrl,
    dimensions: card.smithWaite.dimensions,
    crop: card.smithWaite.crop,
    hotspot: card.smithWaite.hotspot,
    creators: [],
    cardMeta: card.meta,
  }
}
