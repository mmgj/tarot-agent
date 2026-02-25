'use client'

import {useCallback, useRef, useState} from 'react'

import {DetailModal} from './DetailModal'
import {CardImage} from './CardImage'
import {type CardArtResult, type CardMeta} from '@/lib/sanity-image'

interface DeckGroup {
  slug: string
  name: string
  creators: string
  cards: CardArtResult[]
}

interface CardListProps {
  /** Ordered cards to display */
  cards: {art: CardArtResult; meta: CardMeta | null}[]
  /** All deck groups for carousel in detail modal */
  deckGroups?: DeckGroup[]
  /** Current deck index */
  currentDeckIndex?: number
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
      className="card-deal flex w-full items-start gap-4 rounded-lg border border-neutral-800/50 bg-neutral-900/30 p-3 text-left transition-colors hover:border-purple-500/30 hover:bg-neutral-900/60"
      style={{animationDelay: `${index * 0.1}s`}}
    >
      {/* Card image */}
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
    </button>
  )
}

// ─── Main Component ─────────────────────────────────────────────

export function CardList({cards, deckGroups, currentDeckIndex = 0}: CardListProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  return (
    <>
      <div className="my-4 flex flex-col gap-2">
        {cards.map((card, i) => (
          <CardRow
            key={`${card.art.deckSlug}-${card.art.cardTitle}-${i}`}
            art={card.art}
            meta={card.meta}
            index={i}
            onClick={() => setSelectedIndex(i)}
          />
        ))}
      </div>

      {/* Detail modal */}
      {selectedIndex !== null && cards[selectedIndex] && (
        <DetailModal
          cardTitle={cards[selectedIndex].art.cardTitle}
          art={cards[selectedIndex].art}
          meta={cards[selectedIndex].meta}
          deckGroups={deckGroups}
          currentDeckIndex={currentDeckIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </>
  )
}
