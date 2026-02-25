'use client'

import {ChevronLeft, ChevronRight} from 'lucide-react'
import {useCallback, useRef, useState} from 'react'

import {CardImage} from './CardImage'
import {
  buildImageUrl,
  getCroppedAspectRatio,
  getScaledBorderRadius,
  type CardArtResult,
  type CardMeta,
  type ImageCrop,
} from '@/lib/sanity-image'
import {type CachedCard} from '@/lib/card-cache'

// ─── Types ──────────────────────────────────────────────────────

interface DeckVersion {
  slug: string
  name: string
  creators: string
  art: CardArtResult
}

interface CardDetailProps {
  /** Card title — always available, shown even before cache/API loads */
  cardTitle: string
  /** Cached card data for instant render (Smith-Waite + metadata) */
  cached?: CachedCard | null
  /** All deck versions — null while loading, empty array if failed */
  deckVersions: DeckVersion[] | null
  /** Card metadata (from cache or API) */
  meta: CardMeta | null
  /** Initial deck index when deckVersions arrive */
  initialDeckIndex?: number
}

// ─── Constants ──────────────────────────────────────────────────

/** Fixed carousel container — all card art scales to fit within this */
const CAROUSEL_WIDTH = 200
const CAROUSEL_HEIGHT = 300
const SWIPE_THRESHOLD = 50

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ─── Component ──────────────────────────────────────────────────

export function CardDetail({cardTitle, cached, deckVersions, meta, initialDeckIndex = 0}: CardDetailProps) {
  const [deckIndex, setDeckIndex] = useState(initialDeckIndex)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const loadedRef = useRef(false)
  const touchStartX = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Treat empty array same as null — no deck data available yet
  const effectiveVersions = deckVersions && deckVersions.length > 0 ? deckVersions : null
  const hasCarousel = effectiveVersions && effectiveVersions.length > 1
  const current = effectiveVersions?.[deckIndex]

  const displayMeta = meta || cached?.meta || null
  const displayTitle = displayMeta?.names?.[0] || cached?.name || cardTitle
  const cachedArt = cached?.smithWaite

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

  // ─── Swipe handlers ─────────────────────────────────────────

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
            ? prev < effectiveVersions.length - 1 ? prev + 1 : 0
            : prev > 0 ? prev - 1 : effectiveVersions.length - 1,
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
            ? prev < effectiveVersions.length - 1 ? prev + 1 : 0
            : prev > 0 ? prev - 1 : effectiveVersions.length - 1,
        )
        setSwipeOffset(0)
        setIsAnimating(false)
      }, 250)
    },
    [isAnimating, hasCarousel, effectiveVersions],
  )

  // ─── Build correspondences ──────────────────────────────────

  const corr: string[] = []
  if (displayMeta?.arcana) corr.push(capitalize(displayMeta.arcana))
  if (displayMeta?.element) corr.push(capitalize(displayMeta.element))
  if (displayMeta?.astrology) corr.push(capitalize(displayMeta.astrology))
  if (displayMeta?.hebrewLetter) corr.push(capitalize(displayMeta.hebrewLetter))

  // ─── Adjacent indices for carousel ──────────────────────────

  const prevIndex = effectiveVersions
    ? deckIndex > 0 ? deckIndex - 1 : effectiveVersions.length - 1
    : 0
  const nextIndex = effectiveVersions
    ? deckIndex < effectiveVersions.length - 1 ? deckIndex + 1 : 0
    : 0

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="my-4">
      {/* Floated image + deck nav */}
      <div className="float-left mr-4 mb-3 flex flex-col items-center gap-2">
        {/* Fixed-size carousel container — card art scales to fit via object-contain */}
        <div
          ref={containerRef}
          className="relative overflow-hidden bg-neutral-900/50"
          style={{width: `${CAROUSEL_WIDTH}px`, height: `${CAROUSEL_HEIGHT}px`}}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {hasCarousel ? (
            /* ─── Swipeable carousel ─── */
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
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
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
              <CachedImage art={cachedArt} containerWidth={CAROUSEL_WIDTH} containerHeight={CAROUSEL_HEIGHT} onLoad={handleLoad} loaded={imageLoaded} />
            </div>
          ) : (
            /* ─── Shimmer placeholder ─── */
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="shimmer absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-800" />
              <div className="absolute inset-0 flex items-center justify-center text-2xl text-neutral-600 opacity-40">
                ✦
              </div>
            </div>
          )}
        </div>

        {/* Deck navigation */}
        {hasCarousel && effectiveVersions ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('prev')}
              className="rounded-full p-0.5 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-300"
              aria-label="Previous deck"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[11px] font-medium text-neutral-300">
                {current?.name || 'Rider Smith Waite'}
              </span>
              {current?.creators && (
                <span className="text-[10px] text-neutral-500">{current.creators}</span>
              )}
              <div className="mt-0.5 flex gap-1">
                {effectiveVersions.map((dv, i) => (
                  <button
                    key={dv.slug}
                    type="button"
                    onClick={() => switchDeck(i)}
                    className={`h-1 rounded-full transition-all ${
                      i === deckIndex ? 'w-3 bg-purple-400' : 'w-1 bg-neutral-600 hover:bg-neutral-500'
                    }`}
                    aria-label={`View in ${dv.name}`}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('next')}
              className="rounded-full p-0.5 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-300"
              aria-label="Next deck"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[11px] font-medium text-neutral-400">
              {current?.name || 'Rider Smith Waite'}
            </span>
            {!effectiveVersions && (
              <span className="text-[10px] text-neutral-600">Loading decks…</span>
            )}
          </div>
        )}
      </div>

      {/* Flowing text content — always show title, metadata loads progressively */}
      <h3 className="font-serif text-lg font-semibold tracking-wide text-neutral-100">
        {displayTitle}
      </h3>

      {displayMeta ? (
        <>
          {displayMeta.names.length > 1 && (
            <p className="mt-0.5 text-xs italic text-neutral-500">
              {displayMeta.names.slice(1).join(' · ')}
            </p>
          )}

          {corr.length > 0 && (
            <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
              {corr.join(' · ')}
            </p>
          )}

          {displayMeta.tldr && (
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">{displayMeta.tldr}</p>
          )}

          {displayMeta.upright?.length > 0 && (
            <p className="mt-2 text-sm leading-relaxed text-neutral-300">
              <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                Upright{' '}
              </span>
              {displayMeta.upright.join(' · ')}
            </p>
          )}
          {displayMeta.reversed?.length > 0 && (
            <p className="mt-1 text-sm leading-relaxed text-neutral-400">
              <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                Reversed{' '}
              </span>
              {displayMeta.reversed.join(' · ')}
            </p>
          )}
        </>
      ) : (
        /* Loading state for metadata */
        <div className="mt-2 space-y-2">
          <div className="shimmer h-3 w-32 rounded bg-neutral-800" />
          <div className="shimmer h-3 w-48 rounded bg-neutral-800" style={{animationDelay: '0.2s'}} />
          <div className="shimmer h-3 w-40 rounded bg-neutral-800" style={{animationDelay: '0.4s'}} />
        </div>
      )}

      {/* Clear float */}
      <div className="clear-both" />
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
