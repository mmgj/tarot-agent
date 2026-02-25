'use client'

import {type CachedCard} from '@/lib/card-cache'

interface CardInfoPanelProps {
  /** Currently selected card title, or null for empty state */
  selectedCard: string | null
  /** Cards in the current spread (for multi-card navigation) */
  spreadCards: CachedCard[]
  /** Called when a card is selected from the spread strip */
  onSelectCard: (title: string) => void
}

/**
 * The 2/3 info panel showing card details, deck carousel, and metadata.
 * Placeholder — Fenrir is building the full implementation.
 */
export function CardInfoPanel({selectedCard, spreadCards, onSelectCard}: CardInfoPanelProps) {
  if (!selectedCard) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-6 text-center p-8">
        {/* Decorative card spread */}
        <div className="flex items-end gap-2 opacity-30">
          <div className="-rotate-12 rounded-lg border border-neutral-700 bg-neutral-800/50 px-4 py-8 text-2xl shadow-lg">
            &#x2660;
          </div>
          <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 px-4 py-10 text-3xl shadow-lg">
            &#x2728;
          </div>
          <div className="rotate-12 rounded-lg border border-neutral-700 bg-neutral-800/50 px-4 py-8 text-2xl shadow-lg">
            &#x2665;
          </div>
        </div>

        <div>
          <h2 className="font-serif text-2xl font-semibold tracking-wide text-neutral-200">
            Select a card
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-500">
            Draw a spread or ask about a card to see its artwork, meanings, and correspondences here.
          </p>
        </div>
      </div>
    )
  }

  // Multi-card strip
  const hasSpread = spreadCards.length > 1

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Multi-card strip */}
      {hasSpread && (
        <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-[var(--border)] p-3 scrollbar-none">
          {spreadCards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelectCard(card.name)}
              className={`shrink-0 rounded-md px-2.5 py-1 text-xs transition-all ${
                card.name === selectedCard
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                  : 'text-neutral-500 hover:text-neutral-300 border border-transparent'
              }`}
            >
              {card.name}
            </button>
          ))}
        </div>
      )}

      {/* Card detail — placeholder */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <h2 className="font-serif text-xl font-semibold tracking-wide text-neutral-200">
            {selectedCard}
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            Full detail view loading…
          </p>
        </div>
      </div>
    </div>
  )
}
