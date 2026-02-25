'use client'

import {useState} from 'react'

import {CardDetail} from './CardDetail'
import {CardImage} from './CardImage'
import {DetailModal} from './DetailModal'
import {type CachedCard} from '@/lib/card-cache'
import {type CardArtResult} from '@/lib/sanity-image'

interface DrawnCardsProps {
  cards: CachedCard[]
}

/**
 * Renders pre-drawn cards instantly from cache data.
 * Appears between the user message and the AI response.
 * No API calls needed — everything comes from the warm cache.
 */
export function DrawnCards({cards}: DrawnCardsProps) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null)

  if (cards.length === 0) return null

  // ─── Single card: inline detail view ──────────────────────
  if (cards.length === 1) {
    const card = cards[0]
    const art = cachedCardToArt(card)

    return (
      <div className="message-enter my-2">
        <CardDetail
          cardTitle={card.name}
          cached={card}
          deckVersions={art ? [{slug: 'smith-waite', name: 'Rider Smith Waite', creators: '', art}] : null}
          meta={card.meta}
        />
      </div>
    )
  }

  // ─── 2-6 cards: horizontal spread ─────────────────────────
  if (cards.length <= 6) {
    return (
      <div className="message-enter my-2 flex flex-col items-center gap-3">
        <div className="flex flex-wrap items-start justify-center gap-5">
          {cards.map((card) => {
            const art = cachedCardToArt(card)
            if (!art) return null
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelectedCard(card.name)}
                className="cursor-pointer transition-transform hover:scale-105"
              >
                <CardImage art={art} />
              </button>
            )
          })}
        </div>

        <span className="text-[11px] font-medium text-neutral-400">Rider Smith Waite</span>

        {selectedCard && (
          <DetailModal
            cardTitle={selectedCard}
            onClose={() => setSelectedCard(null)}
          />
        )}
      </div>
    )
  }

  // ─── 6+ cards: compact list ───────────────────────────────
  return (
    <div className="message-enter my-2 flex flex-col gap-2">
      {cards.map((card) => {
        const art = cachedCardToArt(card)
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => setSelectedCard(card.name)}
            className="flex items-center gap-3 rounded-lg bg-neutral-900/50 p-2 text-left transition-colors hover:bg-neutral-800/60"
          >
            {art && (
              <div className="flex-shrink-0" style={{width: '48px'}}>
                <CardImage art={art} width={48} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="font-serif text-sm font-medium tracking-wide text-neutral-300">
                {card.name}
              </span>
              {card.meta?.tldr && (
                <p className="mt-0.5 truncate text-xs text-neutral-500">{card.meta.tldr}</p>
              )}
            </div>
          </button>
        )
      })}

      {selectedCard && (
        <DetailModal
          cardTitle={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}
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
