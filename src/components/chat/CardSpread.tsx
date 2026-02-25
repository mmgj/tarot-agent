'use client'

import {ChevronLeft, ChevronRight} from 'lucide-react'
import {useCallback, useEffect, useRef, useState} from 'react'

import {CardImage} from './CardImage'
import {formatCreators, type CardArtResult, type DeckInfo} from '@/lib/sanity-image'

interface CardSpreadProps {
  /** Card titles extracted from the markdown */
  cardTitles: string[]
}

interface DeckGroup {
  slug: string
  name: string
  creators: string
  cards: CardArtResult[]
}

const DEFAULT_DECK = 'smith-waite'

export function CardSpread({cardTitles}: CardSpreadProps) {
  const [allArt, setAllArt] = useState<CardArtResult[] | null>(null)
  const [decks, setDecks] = useState<DeckGroup[]>([])
  const [currentDeckIndex, setCurrentDeckIndex] = useState(0)
  const [allImagesLoaded, setAllImagesLoaded] = useState(false)
  const [error, setError] = useState(false)
  const loadedCount = useRef(0)

  // Fetch all art for these cards (all decks)
  useEffect(() => {
    if (cardTitles.length === 0) return

    const controller = new AbortController()
    const titlesParam = cardTitles.join(',')

    fetch(`/api/card-art?titles=${encodeURIComponent(titlesParam)}`, {signal: controller.signal})
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.cards?.length) {
          setError(true)
          return
        }

        setAllArt(data.cards)

        // Group by deck
        const byDeck = new Map<string, DeckGroup>()
        for (const card of data.cards as CardArtResult[]) {
          if (!byDeck.has(card.deckSlug)) {
            byDeck.set(card.deckSlug, {
              slug: card.deckSlug,
              name: card.deckName,
              creators: formatCreators(card.creators),
              cards: [],
            })
          }
          byDeck.get(card.deckSlug)!.cards.push(card)
        }

        // Only include decks that have ALL the requested cards
        const completeDeckGroups = Array.from(byDeck.values())
          .filter((g) => g.cards.length >= cardTitles.length)
          .sort((a, b) => a.name.localeCompare(b.name))

        setDecks(completeDeckGroups)

        // Default to Smith-Waite
        const defaultIdx = completeDeckGroups.findIndex((g) => g.slug === DEFAULT_DECK)
        if (defaultIdx >= 0) setCurrentDeckIndex(defaultIdx)
      })
      .catch(() => setError(true))

    return () => controller.abort()
  }, [cardTitles])

  const currentDeck = decks[currentDeckIndex]
  const hasMultipleDecks = decks.length > 1

  const handleImageLoad = useCallback(() => {
    loadedCount.current += 1
    if (currentDeck && loadedCount.current >= currentDeck.cards.length) {
      setAllImagesLoaded(true)
    }
  }, [currentDeck])

  // Reset load state when switching decks
  const switchDeck = useCallback(
    (newIndex: number) => {
      loadedCount.current = 0
      setAllImagesLoaded(false)
      setCurrentDeckIndex(newIndex)
    },
    [],
  )

  const navigateDeck = useCallback(
    (direction: 'prev' | 'next') => {
      const newIndex =
        direction === 'prev'
          ? currentDeckIndex > 0
            ? currentDeckIndex - 1
            : decks.length - 1
          : currentDeckIndex < decks.length - 1
            ? currentDeckIndex + 1
            : 0
      switchDeck(newIndex)
    },
    [currentDeckIndex, decks.length, switchDeck],
  )

  if (error) return null

  // Show card name placeholders immediately while loading
  if (!currentDeck) {
    return (
      <div className="my-4 flex flex-wrap items-start justify-center gap-5">
        {cardTitles.map((title, i) => (
          <div key={i} className="card-deal inline-flex flex-col items-center gap-1.5">
            <div
              className="relative overflow-hidden rounded-lg shadow-lg shadow-black/40"
              style={{width: '160px', aspectRatio: '0.667'}}
            >
              <div className="shimmer absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-800" />
              <div className="absolute inset-0 flex items-center justify-center text-2xl text-neutral-600 opacity-40">
                ✦
              </div>
            </div>
            <span className="max-w-[10rem] text-center font-serif text-xs font-medium tracking-wide text-neutral-300">
              {title}
            </span>
          </div>
        ))}
      </div>
    )
  }

  // Sort cards to match the order they were drawn
  const orderedCards = cardTitles
    .map((title) => currentDeck.cards.find((c) => c.cardTitle === title))
    .filter((c): c is CardArtResult => c != null)

  return (
    <div className="my-4 flex flex-col items-center gap-4">
      {/* Cards */}
      <div
        className={`flex flex-wrap items-start justify-center gap-5 transition-opacity duration-500 ${
          allImagesLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{minHeight: allImagesLoaded ? undefined : '16rem'}}
      >
        {orderedCards.map((art, i) => (
          <CardImage key={`${art.deckSlug}-${art.cardTitle}-${i}`} art={art} onLoad={handleImageLoad} />
        ))}
      </div>

      {/* Deck selector */}
      {hasMultipleDecks && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigateDeck('prev')}
            className="rounded-full p-1 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-300"
            aria-label="Previous deck"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs font-medium text-neutral-300">{currentDeck.name}</span>
            {currentDeck.creators && (
              <span className="text-[10px] text-neutral-500">{currentDeck.creators}</span>
            )}
            {/* Deck dots */}
            <div className="mt-1 flex gap-1">
              {decks.map((deck, i) => (
                <button
                  key={deck.slug}
                  type="button"
                  onClick={() => switchDeck(i)}
                  className={`h-1 rounded-full transition-all ${
                    i === currentDeckIndex ? 'w-3 bg-purple-400' : 'w-1 bg-neutral-600 hover:bg-neutral-500'
                  }`}
                  aria-label={`View in ${deck.name}`}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigateDeck('next')}
            className="rounded-full p-1 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-300"
            aria-label="Next deck"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Single deck info (when only one deck has all cards) */}
      {!hasMultipleDecks && currentDeck.creators && (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs font-medium text-neutral-400">{currentDeck.name}</span>
          <span className="text-[10px] text-neutral-500">{currentDeck.creators}</span>
        </div>
      )}
    </div>
  )
}
