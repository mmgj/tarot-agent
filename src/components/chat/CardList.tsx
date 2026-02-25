'use client'

import {X} from 'lucide-react'
import {useCallback, useEffect, useRef, useState} from 'react'

import {CardDetail} from './CardDetail'
import {CardImage} from './CardImage'
import {formatCreators, type CardArtResult, type CardMeta} from '@/lib/sanity-image'
import {getCardSync, type CachedCard} from '@/lib/card-cache'

interface CardListProps {
  /** Ordered cards to display */
  cards: {art: CardArtResult; meta: CardMeta | null}[]
  /** All deck groups for carousel in detail modal */
  deckGroups?: {slug: string; name: string; creators: string; cards: CardArtResult[]}[]
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

// ─── Detail Modal ───────────────────────────────────────────────

function DetailModal({
  card,
  deckGroups,
  currentDeckIndex,
  onClose,
}: {
  card: {art: CardArtResult; meta: CardMeta | null}
  deckGroups?: CardListProps['deckGroups']
  currentDeckIndex: number
  onClose: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  // Slide in on mount
  useEffect(() => {
    requestAnimationFrame(() => setIsOpen(true))
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setTimeout(onClose, 300) // Wait for slide-out animation
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleClose])

  // Build deck versions for the carousel
  const deckVersions = deckGroups
    ? deckGroups
        .filter((dg) => dg.cards.some((c) => c.cardTitle === card.art.cardTitle))
        .map((dg) => ({
          slug: dg.slug,
          name: dg.name,
          creators: dg.creators,
          art: dg.cards.find((c) => c.cardTitle === card.art.cardTitle) || dg.cards[0],
        }))
    : null

  // Find the current deck in the filtered list
  const modalDeckIndex = deckVersions
    ? deckVersions.findIndex((dv) => dv.slug === deckGroups?.[currentDeckIndex]?.slug)
    : 0

  const cached: CachedCard | null = getCardSync(card.art.cardTitle)

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Slide-in panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-neutral-950 shadow-2xl shadow-black/50 transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 rounded-full p-1.5 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-300"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Detail content */}
        <div className="p-5 pt-12">
          <CardDetail
            cached={cached}
            deckVersions={deckVersions}
            meta={card.meta}
            initialDeckIndex={Math.max(0, modalDeckIndex)}
          />
        </div>
      </div>
    </>
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
          card={cards[selectedIndex]}
          deckGroups={deckGroups}
          currentDeckIndex={currentDeckIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </>
  )
}
