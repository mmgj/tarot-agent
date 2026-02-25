'use client'

import {ChevronLeft, ChevronRight} from 'lucide-react'
import {useCallback, useEffect, useRef, useState} from 'react'

import {CardImage} from './chat/CardImage'
import {
  buildImageUrl,
  formatCreators,
  getScaledBorderRadius,
  type CardArtResult,
  type ImageCrop,
} from '@/lib/sanity-image'
import {getCardSync, type CachedCard} from '@/lib/card-cache'

// ─── Types ──────────────────────────────────────────────────────

interface DeckVersion {
  slug: string
  name: string
  creators: string
  art: CardArtResult
}

interface CardInfoPanelProps {
  /** Currently selected card title, or null for empty state */
  selectedCard: string | null
  /** Cards in the current spread (for multi-card strip) */
  spreadCards: CachedCard[]
  /** Callback when user clicks a different card */
  onSelectCard: (title: string) => void
}

// ─── Constants ──────────────────────────────────────────────────

const CAROUSEL_WIDTH = 280
const CAROUSEL_HEIGHT = 420
const SWIPE_THRESHOLD = 50

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ─── Component ──────────────────────────────────────────────────

export function CardInfoPanel({selectedCard, spreadCards, onSelectCard}: CardInfoPanelProps) {
  // Deck versions for the carousel
  const [deckVersions, setDeckVersions] = useState<DeckVersion[] | null>(null)
  const [deckIndex, setDeckIndex] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const loadedRef = useRef(false)
  const touchStartX = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Get cached card data for instant render
  const cached = selectedCard ? getCardSync(selectedCard) : null

  // Fetch all deck versions when card changes
  useEffect(() => {
    if (!selectedCard) {
      setDeckVersions(null)
      return
    }

    // Reset state for new card
    setDeckVersions(null)
    setDeckIndex(0)
    loadedRef.current = false
    setImageLoaded(false)

    const fetchVersions = async () => {
      try {
        const res = await fetch(`/api/card-art?title=${encodeURIComponent(selectedCard)}`)
        if (!res.ok) return

        const data = await res.json()
        const cards: CardArtResult[] = data.cards || []

        // Group by deck and build versions
        const versions: DeckVersion[] = cards.map((art) => ({
          slug: art.deckSlug,
          name: art.deckName,
          creators: formatCreators(art.creators),
          art,
        }))

        setDeckVersions(versions)
      } catch {
        // Keep cached data, no deck carousel
      }
    }

    fetchVersions()
  }, [selectedCard])

  // ─── Carousel navigation ──────────────────────────────────────

  const effectiveVersions = deckVersions && deckVersions.length > 0 ? deckVersions : null
  const hasCarousel = effectiveVersions && effectiveVersions.length > 1
  const current = effectiveVersions?.[deckIndex]

  const handleLoad = useCallback(() => {
    if (!loadedRef.current) {
      loadedRef.current = true
      setImageLoaded(true)
    }
  }, [])

  const switchDeck = useCallback((newIndex: number) => {
    loadedRef.current = false
    setImageLoaded(false)
    setDeckIndex(newIndex)
  }, [])

  // Adjacent indices for 3-panel carousel
  const prevIndex = effectiveVersions
    ? deckIndex > 0
      ? deckIndex - 1
      : effectiveVersions.length - 1
    : 0
  const nextIndex = effectiveVersions
    ? deckIndex < effectiveVersions.length - 1
      ? deckIndex + 1
      : 0
    : 0

  // ─── Swipe handlers ───────────────────────────────────────────

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isAnimating || !hasCarousel) return
      touchStartX.current = e.touches[0].clientX
    },
    [isAnimating, hasCarousel],
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || isAnimating) return
      const diff = e.touches[0].clientX - touchStartX.current
      setSwipeOffset(diff * 0.8)
    },
    [isAnimating],
  )

  const handleTouchEnd = useCallback(() => {
    if (touchStartX.current === null || !hasCarousel || !effectiveVersions) return

    if (Math.abs(swipeOffset) > SWIPE_THRESHOLD) {
      setIsAnimating(true)
      const goNext = swipeOffset < 0
      setSwipeOffset(goNext ? -CAROUSEL_WIDTH : CAROUSEL_WIDTH)
      setTimeout(() => {
        setDeckIndex((prev) =>
          goNext
            ? prev < effectiveVersions.length - 1
              ? prev + 1
              : 0
            : prev > 0
              ? prev - 1
              : effectiveVersions.length - 1,
        )
        setSwipeOffset(0)
        setIsAnimating(false)
      }, 250)
    } else {
      setSwipeOffset(0)
    }

    touchStartX.current = null
  }, [swipeOffset, hasCarousel, effectiveVersions])

  const navigate = useCallback(
    (dir: 'prev' | 'next') => {
      if (isAnimating || !hasCarousel || !effectiveVersions) return
      setIsAnimating(true)
      setSwipeOffset(dir === 'next' ? -CAROUSEL_WIDTH : CAROUSEL_WIDTH)
      setTimeout(() => {
        setDeckIndex((prev) =>
          dir === 'next'
            ? prev < effectiveVersions.length - 1
              ? prev + 1
              : 0
            : prev > 0
              ? prev - 1
              : effectiveVersions.length - 1,
        )
        setSwipeOffset(0)
        setIsAnimating(false)
      }, 250)
    },
    [isAnimating, hasCarousel, effectiveVersions],
  )

  // ─── Build display data ───────────────────────────────────────

  const displayMeta = current?.art.cardMeta || cached?.meta || null
  const displayTitle = displayMeta?.names?.[0] || cached?.name || selectedCard || ''
  const cachedArt = cached?.smithWaite

  // Build correspondences list
  const corr: string[] = []
  if (displayMeta?.arcana) corr.push(capitalize(displayMeta.arcana))
  if (displayMeta?.element) corr.push(capitalize(displayMeta.element))
  if (displayMeta?.astrology) corr.push(capitalize(displayMeta.astrology))
  if (displayMeta?.hebrewLetter) corr.push(capitalize(displayMeta.hebrewLetter))

  // ─── Empty state ──────────────────────────────────────────────

  if (!selectedCard) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
        {/* Decorative card spread */}
        <div className="flex items-end gap-3 opacity-30">
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

        <div className="max-w-md">
          <h2 className="font-serif text-2xl font-semibold tracking-wide text-neutral-200">
            Select a card to explore
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-500">
            Click any card in the chat &mdash; drawn spreads, AI-suggested cards, or search results
            &mdash; to see its artwork across decks, meanings, and correspondences.
          </p>
        </div>
      </div>
    )
  }

  // ─── Card detail view ─────────────────────────────────────────

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Multi-card strip (when spread has multiple cards) */}
      {spreadCards.length > 1 && (
        <div className="shrink-0 border-b border-neutral-800 bg-neutral-900/50 px-4 py-3">
          <div className="flex items-center justify-center gap-2 overflow-x-auto scrollbar-none">
            {spreadCards.map((card) => {
              const isActive = card.name.toLowerCase() === selectedCard.toLowerCase()
              const thumbUrl = card.smithWaite?.imageUrl
                ? buildImageUrl(card.smithWaite.imageUrl, {
                    width: 80,
                    crop: card.smithWaite.crop as ImageCrop | null,
                    dimensions: card.smithWaite.dimensions,
                  })
                : null

              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => onSelectCard(card.name)}
                  className={`shrink-0 transition-all duration-200 ${
                    isActive ? 'scale-110 opacity-100' : 'opacity-50 hover:opacity-80'
                  }`}
                >
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={card.name}
                      className="h-16 w-auto rounded object-contain"
                      style={{
                        borderRadius: `${getScaledBorderRadius(card.smithWaite?.cornerRounding || 0, 40)}px`,
                      }}
                    />
                  ) : (
                    <div className="flex h-16 w-10 items-center justify-center rounded bg-neutral-800 text-neutral-600">
                      ✦
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Image carousel */}
        <div className="flex flex-col items-center gap-3">
          {/* Fixed-size carousel container */}
          <div
            ref={containerRef}
            className="relative overflow-hidden rounded-lg bg-neutral-900/50"
            style={{width: `${CAROUSEL_WIDTH}px`, height: `${CAROUSEL_HEIGHT}px`}}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {hasCarousel ? (
              /* ─── Swipeable carousel (3-panel) ─── */
              <div
                className="absolute inset-0"
                style={{
                  transform: `translateX(${swipeOffset}px)`,
                  transition: isAnimating ? 'transform 250ms ease-out' : 'none',
                }}
              >
                {/* Previous image (off-screen left) */}
                {effectiveVersions[prevIndex] && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{transform: 'translateX(-100%)'}}
                  >
                    <CardImage art={effectiveVersions[prevIndex].art} width={CAROUSEL_WIDTH} contain />
                  </div>
                )}

                {/* Current image */}
                {current && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CardImage
                      key={`${current.slug}-${current.art.cardTitle}`}
                      art={current.art}
                      width={CAROUSEL_WIDTH}
                      contain
                      onLoad={handleLoad}
                    />
                  </div>
                )}

                {/* Next image (off-screen right) */}
                {effectiveVersions[nextIndex] && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{transform: 'translateX(100%)'}}
                  >
                    <CardImage art={effectiveVersions[nextIndex].art} width={CAROUSEL_WIDTH} contain />
                  </div>
                )}
              </div>
            ) : current ? (
              /* ─── Single deck image ─── */
              <div
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <CardImage
                  key={`${current.slug}-${current.art.cardTitle}`}
                  art={current.art}
                  width={CAROUSEL_WIDTH}
                  contain
                  onLoad={handleLoad}
                />
              </div>
            ) : cachedArt?.imageUrl ? (
              /* ─── Cached Smith-Waite image (instant) ─── */
              <div className="absolute inset-0 flex items-center justify-center">
                <CachedImage
                  art={cachedArt}
                  containerWidth={CAROUSEL_WIDTH}
                  containerHeight={CAROUSEL_HEIGHT}
                  onLoad={handleLoad}
                  loaded={imageLoaded}
                />
              </div>
            ) : (
              /* ─── Shimmer placeholder ─── */
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="shimmer absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-800" />
                <div className="absolute inset-0 flex items-center justify-center text-3xl text-neutral-600 opacity-40">
                  ✦
                </div>
              </div>
            )}
          </div>

          {/* Deck navigation */}
          {hasCarousel && effectiveVersions ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('prev')}
                className="rounded-full p-1 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-300"
                aria-label="Previous deck"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-medium text-neutral-300">{current?.name || 'Rider Smith Waite'}</span>
                {current?.creators && <span className="text-xs text-neutral-500">{current.creators}</span>}
                <div className="mt-1 flex gap-1.5">
                  {effectiveVersions.map((dv, i) => (
                    <button
                      key={dv.slug}
                      type="button"
                      onClick={() => switchDeck(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === deckIndex ? 'w-4 bg-purple-400' : 'w-1.5 bg-neutral-600 hover:bg-neutral-500'
                      }`}
                      aria-label={`View in ${dv.name}`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('next')}
                className="rounded-full p-1 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-300"
                aria-label="Next deck"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-sm font-medium text-neutral-400">{current?.name || 'Rider Smith Waite'}</span>
              {!effectiveVersions && selectedCard && (
                <span className="text-xs text-neutral-600">Loading decks...</span>
              )}
            </div>
          )}
        </div>

        {/* Card info section */}
        <div className="mt-8 space-y-6">
          {/* Title */}
          <div className="text-center">
            <h2 className="font-serif text-2xl font-semibold tracking-wide text-neutral-100">{displayTitle}</h2>
            {displayMeta?.names && displayMeta.names.length > 1 && (
              <p className="mt-1 text-sm italic text-neutral-500">{displayMeta.names.slice(1).join(' · ')}</p>
            )}
          </div>

          {/* Correspondences */}
          {corr.length > 0 && (
            <p className="text-center text-xs font-medium uppercase tracking-wider text-neutral-500">
              {corr.join(' · ')}
            </p>
          )}

          {/* TLDR */}
          {displayMeta?.tldr && (
            <div className="border-l-2 border-purple-500/50 pl-4">
              <p className="text-sm italic leading-relaxed text-neutral-400">{displayMeta.tldr}</p>
            </div>
          )}

          {/* Vitals table */}
          {displayMeta && (
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-4">
              <table className="w-full text-sm">
                <tbody>
                  {displayMeta.suit && (
                    <tr>
                      <td className="py-1 pr-4 font-medium text-neutral-500">Suit</td>
                      <td className="py-1 text-neutral-300">{capitalize(displayMeta.suit)}</td>
                    </tr>
                  )}
                  {displayMeta.number !== undefined && displayMeta.number !== null && (
                    <tr>
                      <td className="py-1 pr-4 font-medium text-neutral-500">Number</td>
                      <td className="py-1 text-neutral-300">{displayMeta.number}</td>
                    </tr>
                  )}
                  {displayMeta.arcana && (
                    <tr>
                      <td className="py-1 pr-4 font-medium text-neutral-500">Arcana</td>
                      <td className="py-1 text-neutral-300">{capitalize(displayMeta.arcana)}</td>
                    </tr>
                  )}
                  {displayMeta.element && (
                    <tr>
                      <td className="py-1 pr-4 font-medium text-neutral-500">Element</td>
                      <td className="py-1 text-neutral-300">{capitalize(displayMeta.element)}</td>
                    </tr>
                  )}
                  {displayMeta.astrology && (
                    <tr>
                      <td className="py-1 pr-4 font-medium text-neutral-500">Astrology</td>
                      <td className="py-1 text-neutral-300">{capitalize(displayMeta.astrology)}</td>
                    </tr>
                  )}
                  {displayMeta.hebrewLetter && (
                    <tr>
                      <td className="py-1 pr-4 font-medium text-neutral-500">Hebrew Letter</td>
                      <td className="py-1 text-neutral-300">{capitalize(displayMeta.hebrewLetter)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Meanings */}
          {displayMeta && (displayMeta.upright?.length > 0 || displayMeta.reversed?.length > 0) && (
            <div className="space-y-4">
              {displayMeta.upright?.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">Upright</h3>
                  <p className="text-sm leading-relaxed text-neutral-300">{displayMeta.upright.join(' · ')}</p>
                </div>
              )}
              {displayMeta.reversed?.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">Reversed</h3>
                  <p className="text-sm leading-relaxed text-neutral-400">{displayMeta.reversed.join(' · ')}</p>
                </div>
              )}
            </div>
          )}

          {/* Loading state for metadata */}
          {!displayMeta && selectedCard && (
            <div className="space-y-3">
              <div className="shimmer mx-auto h-4 w-32 rounded bg-neutral-800" />
              <div className="shimmer mx-auto h-4 w-48 rounded bg-neutral-800" style={{animationDelay: '0.2s'}} />
              <div className="shimmer mx-auto h-4 w-40 rounded bg-neutral-800" style={{animationDelay: '0.4s'}} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Cached image renderer ──────────────────────────────────────
// Uses object-contain within the fixed carousel container.

interface CachedImageProps {
  art: NonNullable<CachedCard['smithWaite']>
  containerWidth: number
  containerHeight: number
  onLoad: () => void
  loaded: boolean
}

function CachedImage({art, containerWidth, containerHeight, onLoad, loaded}: CachedImageProps) {
  const borderRadius = getScaledBorderRadius(art.cornerRounding || 0, containerWidth)
  const imageUrl = buildImageUrl(art.imageUrl, {
    width: containerWidth * 2,
    crop: art.crop as ImageCrop | null,
    dimensions: art.dimensions,
  })

  return (
    <img
      src={imageUrl}
      alt=""
      className={`max-h-full max-w-full object-contain transition-opacity duration-500 ${
        loaded ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        borderRadius: `${borderRadius}px`,
        maxWidth: `${containerWidth}px`,
        maxHeight: `${containerHeight}px`,
      }}
      onLoad={onLoad}
    />
  )
}
