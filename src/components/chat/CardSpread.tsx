'use client'

import {ChevronLeft, ChevronRight} from 'lucide-react'
import {useCallback, useEffect, useRef, useState} from 'react'

import {CardImage} from './CardImage'
import {CardList} from './CardList'
import {formatCreators, type CardArtResult} from '@/lib/sanity-image'
import {warmCardCache} from '@/lib/card-cache'

interface CardSpreadProps {
  /** Card titles extracted from the markdown */
  cardTitles: string[]
  /** Called when a card is clicked — opens it in the info panel */
  onSelectCard?: (title: string) => void
}

interface DeckGroup {
  slug: string
  name: string
  creators: string
  cards: CardArtResult[]
}

const DEFAULT_DECK = 'smith-waite'

export function CardSpread({cardTitles, onSelectCard}: CardSpreadProps) {
  const [decks, setDecks] = useState<DeckGroup[]>([])
  const [currentDeckIndex, setCurrentDeckIndex] = useState(0)
  const [allImagesLoaded, setAllImagesLoaded] = useState(false)
  const [error, setError] = useState(false)
  const loadedCount = useRef(0)

  // Stable key for the effect — prevents re-fetching on every streaming re-render
  const titlesKey = cardTitles.join(',')

  // Track the last fetched key to avoid redundant fetches
  const lastFetchedKey = useRef('')

  // Warm the card cache on first mount
  useEffect(() => {
    warmCardCache().catch(() => {})
  }, [])

  // Fetch all art for these cards (all decks)
  useEffect(() => {
    if (!titlesKey) return
    if (titlesKey === lastFetchedKey.current) return

    const controller = new AbortController()
    const timer = setTimeout(() => {
      lastFetchedKey.current = titlesKey

      fetch(`/api/card-art?titles=${encodeURIComponent(titlesKey)}`, {signal: controller.signal})
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data?.cards?.length) {
            setError(true)
            return
          }

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

          const completeDeckGroups = Array.from(byDeck.values())
            .filter((g) => g.cards.length >= cardTitles.length)
            .sort((a, b) => a.name.localeCompare(b.name))

          setDecks(completeDeckGroups)

          const defaultIdx = completeDeckGroups.findIndex((g) => g.slug === DEFAULT_DECK)
          if (defaultIdx >= 0) setCurrentDeckIndex(defaultIdx)
        })
        .catch((err) => {
          if (err?.name !== 'AbortError') {
            setError(true)
          }
        })
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [titlesKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentDeck = decks[currentDeckIndex]
  const cardCount = cardTitles.length

  const handleImageLoad = useCallback(() => {
    loadedCount.current += 1
    if (currentDeck && loadedCount.current >= currentDeck.cards.length) {
      setAllImagesLoaded(true)
    }
  }, [currentDeck])

  const switchDeck = useCallback((newIndex: number) => {
    loadedCount.current = 0
    setAllImagesLoaded(false)
    setCurrentDeckIndex(newIndex)
  }, [])

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

  // ─── SINGLE CARD: Clickable thumbnail ─────────────────────────

  if (cardCount === 1) {
    const title = cardTitles[0]
    const art = currentDeck?.cards.find((c) => c.cardTitle === title)

    if (!art) {
      // Loading placeholder
      return (
        <div className="my-2 inline-flex">
          <button
            type="button"
            onClick={() => onSelectCard?.(title)}
            className="card-deal inline-flex flex-col items-center gap-1 transition-transform hover:scale-105"
          >
            <div
              className="relative overflow-hidden rounded-lg shadow-lg shadow-black/40"
              style={{width: '80px', aspectRatio: '0.667'}}
            >
              <div className="shimmer absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-800" />
            </div>
            <span className="font-serif text-[10px] font-medium text-neutral-400">{title}</span>
          </button>
        </div>
      )
    }

    return (
      <div className="my-2 inline-flex">
        <button
          type="button"
          onClick={() => onSelectCard?.(title)}
          className="inline-flex flex-col items-center gap-1 transition-transform hover:scale-105"
        >
          <div style={{width: '80px'}}>
            <CardImage art={art} width={80} />
          </div>
          <span className="font-serif text-[10px] font-medium text-neutral-400">{title}</span>
        </button>
      </div>
    )
  }

  // ─── LOADING: Show placeholders matching expected layout ─────

  if (!currentDeck) {
    const isListLayout = cardCount > 6

    if (isListLayout) {
      return (
        <div className="my-2 flex flex-col gap-1.5">
          {cardTitles.map((title, i) => (
            <div key={i} className="card-deal flex items-center gap-2 rounded-lg bg-neutral-900/50 p-1.5">
              <div
                className="relative flex-shrink-0 overflow-hidden rounded shadow-md shadow-black/30"
                style={{width: '40px', aspectRatio: '0.667'}}
              >
                <div className="shimmer absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-800" />
              </div>
              <span className="font-serif text-xs font-medium tracking-wide text-neutral-300">
                {title}
              </span>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="my-2 flex flex-wrap items-start justify-center gap-3">
        {cardTitles.map((title, i) => (
          <div key={i} className="card-deal inline-flex flex-col items-center gap-1">
            <div
              className="relative overflow-hidden rounded-lg shadow-lg shadow-black/40"
              style={{width: '80px', aspectRatio: '0.667'}}
            >
              <div className="shimmer absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-800" />
            </div>
            <span className="max-w-[5rem] truncate text-center font-serif text-[10px] font-medium text-neutral-300">
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

  // ─── 7+ CARDS: List view ──────────────────────────────────────

  if (cardCount > 6) {
    const listCards = orderedCards.map((art) => ({
      art,
      meta: art.cardMeta ?? null,
    }))

    return (
      <div className="my-2 flex flex-col gap-3">
        <CardList cards={listCards} onSelectCard={onSelectCard} />

        <DeckSelector
          decks={decks}
          currentDeckIndex={currentDeckIndex}
          onNavigate={navigateDeck}
          onSwitch={switchDeck}
        />
      </div>
    )
  }

  // ─── 2–6 CARDS: Spread view — clickable cards ─────────────────

  return (
    <div className="my-2 flex flex-col items-center gap-3">
      <div
        className={`flex flex-wrap items-start justify-center gap-3 transition-opacity duration-500 ${
          allImagesLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{minHeight: allImagesLoaded ? undefined : '8rem'}}
      >
        {orderedCards.map((art, i) => (
          <button
            key={`${art.deckSlug}-${art.cardTitle}-${i}`}
            type="button"
            onClick={() => onSelectCard?.(art.cardTitle)}
            className="cursor-pointer transition-transform hover:scale-105"
          >
            <CardImage art={art} width={80} onLoad={handleImageLoad} />
          </button>
        ))}
      </div>

      <DeckSelector
        decks={decks}
        currentDeckIndex={currentDeckIndex}
        onNavigate={navigateDeck}
        onSwitch={switchDeck}
      />
    </div>
  )
}

// ─── Shared deck selector ────────────────────────────────────────

interface DeckSelectorProps {
  decks: DeckGroup[]
  currentDeckIndex: number
  onNavigate: (dir: 'prev' | 'next') => void
  onSwitch: (index: number) => void
}

function DeckSelector({decks, currentDeckIndex, onNavigate, onSwitch}: DeckSelectorProps) {
  const current = decks[currentDeckIndex]
  if (!current) return null

  if (decks.length <= 1) {
    return current.creators ? (
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[10px] font-medium text-neutral-400">{current.name}</span>
        <span className="text-[9px] text-neutral-500">{current.creators}</span>
      </div>
    ) : null
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onNavigate('prev')}
        className="rounded-full p-0.5 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-300"
        aria-label="Previous deck"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>

      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[10px] font-medium text-neutral-300">{current.name}</span>
        {current.creators && (
          <span className="text-[9px] text-neutral-500">{current.creators}</span>
        )}
        <div className="mt-0.5 flex gap-1">
          {decks.map((deck, i) => (
            <button
              key={deck.slug}
              type="button"
              onClick={() => onSwitch(i)}
              className={`h-1 rounded-full transition-all ${
                i === currentDeckIndex ? 'w-2.5 bg-purple-400' : 'w-1 bg-neutral-600 hover:bg-neutral-500'
              }`}
              aria-label={`View in ${deck.name}`}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onNavigate('next')}
        className="rounded-full p-0.5 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-300"
        aria-label="Next deck"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
