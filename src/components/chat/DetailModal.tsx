'use client'

import {X} from 'lucide-react'
import {useCallback, useEffect, useState} from 'react'

import {CardDetail} from './CardDetail'
import {getCardSync, type CachedCard} from '@/lib/card-cache'
import {type CardArtResult, type CardMeta} from '@/lib/sanity-image'

interface DeckGroup {
  slug: string
  name: string
  creators: string
  cards: CardArtResult[]
}

interface DetailModalProps {
  /** Card title — always available, used as fallback when cache/API hasn't loaded */
  cardTitle: string
  /** Card art from the current deck (if available) */
  art?: CardArtResult | null
  /** Card metadata (if available) */
  meta?: CardMeta | null
  /** All deck groups for carousel */
  deckGroups?: DeckGroup[]
  /** Current deck index */
  currentDeckIndex?: number
  /** Close handler */
  onClose: () => void
}

export function DetailModal({
  cardTitle,
  art,
  meta,
  deckGroups,
  currentDeckIndex = 0,
  onClose,
}: DetailModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Slide in on mount
  useEffect(() => {
    requestAnimationFrame(() => setIsOpen(true))
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setTimeout(onClose, 300)
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
        .filter((dg) => dg.cards.some((c) => c.cardTitle === cardTitle))
        .map((dg) => ({
          slug: dg.slug,
          name: dg.name,
          creators: dg.creators,
          art: dg.cards.find((c) => c.cardTitle === cardTitle) || dg.cards[0],
        }))
    : null

  // Find the current deck in the filtered list
  const modalDeckIndex = deckVersions
    ? deckVersions.findIndex((dv) => dv.slug === deckGroups?.[currentDeckIndex]?.slug)
    : 0

  const cached: CachedCard | null = getCardSync(cardTitle)

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
            cardTitle={cardTitle}
            cached={cached}
            deckVersions={deckVersions}
            meta={meta ?? cached?.meta ?? null}
            initialDeckIndex={Math.max(0, modalDeckIndex)}
          />
        </div>
      </div>
    </>
  )
}
