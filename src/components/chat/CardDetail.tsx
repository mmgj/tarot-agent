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
  /** Cached card data for instant render (Smith-Waite + metadata) */
  cached: CachedCard | null
  /** All deck versions — null while loading, empty array if failed */
  deckVersions: DeckVersion[] | null
  /** Card metadata (from cache or API) */
  meta: CardMeta | null
  /** Initial deck index when deckVersions arrive */
  initialDeckIndex?: number
}

// ─── Helpers ────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const SWIPE_THRESHOLD = 50

// ─── Component ──────────────────────────────────────────────────

export function CardDetail({cached, deckVersions, meta, initialDeckIndex = 0}: CardDetailProps) {
  const [deckIndex, setDeckIndex] = useState(initialDeckIndex)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const loadedRef = useRef(false)
  const touchStartX = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const hasCarousel = deckVersions && deckVersions.length > 1
  const current = deckVersions?.[deckIndex]

  // Use cached Smith-Waite data for instant render, upgrade when API data arrives
  const displayMeta = meta || cached?.meta || null
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

  // ─── Swipe handlers (adapted from tarotify) ─────────────────

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
    if (touchStartX.current === null || !hasCarousel || !deckVersions) return

    const containerWidth = containerRef.current?.offsetWidth || 300

    if (Math.abs(swipeOffset) > SWIPE_THRESHOLD) {
      setIsAnimating(true)
      const goNext = swipeOffset < 0
      setSwipeOffset(goNext ? -containerWidth : containerWidth)
      setTimeout(() => {
        setDeckIndex((prev) =>
          goNext
            ? prev < deckVersions.length - 1 ? prev + 1 : 0
            : prev > 0 ? prev - 1 : deckVersions.length - 1,
        )
        setSwipeOffset(0)
        setIsAnimating(false)
      }, 250)
    } else {
      setSwipeOffset(0)
    }

    touchStartX.current = null
  }, [swipeOffset, hasCarousel, deckVersions])

  const navigate = useCallback(
    (dir: 'prev' | 'next') => {
      if (isAnimating || !hasCarousel || !deckVersions) return
      const containerWidth = containerRef.current?.offsetWidth || 300
      setIsAnimating(true)
      setSwipeOffset(dir === 'next' ? -containerWidth : containerWidth)
      setTimeout(() => {
        setDeckIndex((prev) =>
          dir === 'next'
            ? prev < deckVersions.length - 1 ? prev + 1 : 0
            : prev > 0 ? prev - 1 : deckVersions.length - 1,
        )
        setSwipeOffset(0)
        setIsAnimating(false)
      }, 250)
    },
    [isAnimating, hasCarousel, deckVersions],
  )

  // ─── Build correspondences ──────────────────────────────────

  const corr: string[] = []
  if (displayMeta?.arcana) corr.push(capitalize(displayMeta.arcana))
  if (displayMeta?.element) corr.push(capitalize(displayMeta.element))
  if (displayMeta?.astrology) corr.push(capitalize(displayMeta.astrology))
  if (displayMeta?.hebrewLetter) corr.push(capitalize(displayMeta.hebrewLetter))

  // ─── Adjacent indices for carousel ──────────────────────────

  const prevIndex = deckVersions
    ? deckIndex > 0 ? deckIndex - 1 : deckVersions.length - 1
    : 0
  const nextIndex = deckVersions
    ? deckIndex < deckVersions.length - 1 ? deckIndex + 1 : 0
    : 0

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="my-4">
      {/* Floated image + deck nav */}
      <div className="float-left mr-4 mb-3 flex flex-col items-center gap-2">
        {/* Image area — fixed size to prevent layout shift when switching decks */}
        <div
          ref={containerRef}
          className="relative overflow-hidden"
          style={{width: '200px', height: '300px'}}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {hasCarousel ? (
            /* ─── Swipeable carousel (Phase 2) ─── */
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `translateX(${swipeOffset}px)`,
                transition: isAnimating ? 'transform 250ms ease-out' : 'none',
              }}
            >
              {/* Previous image (off-screen left) */}
              {deckVersions[prevIndex] && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{transform: 'translateX(-100%)'}}
                >
                  <CardImage art={deckVersions[prevIndex].art} width={200} contain />
                </div>
              )}

              {/* Current image */}
              {current && (
                <div className="flex items-center justify-center">
                  <CardImage
                    key={`${current.slug}-${current.art.cardTitle}`}
                    art={current.art}
                    width={200}
                    contain
                    onLoad={handleLoad}
                  />
                </div>
              )}

              {/* Next image (off-screen right) */}
              {deckVersions[nextIndex] && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{transform: 'translateX(100%)'}}
                >
                  <CardImage art={deckVersions[nextIndex].art} width={200} contain />
                </div>
              )}
            </div>
          ) : current ? (
            /* ─── Single deck image (API loaded, no carousel) ─── */
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
              <CardImage
                key={`${current.slug}-${current.art.cardTitle}`}
                art={current.art}
                width={200}
                contain
                onLoad={handleLoad}
              />
            </div>
          ) : cachedArt?.imageUrl ? (
            /* ─── Cached Smith-Waite image (Phase 1 — instant) ─── */
            <div className="absolute inset-0 flex items-center justify-center">
              <CachedImage art={cachedArt} onLoad={handleLoad} loaded={imageLoaded} />
            </div>
          ) : (
            /* ─── Shimmer placeholder ─── */
            <div
              className="absolute inset-0 flex items-center justify-center"
            >
              <div
                className="relative overflow-hidden rounded-lg shadow-lg shadow-black/40"
                style={{width: '200px', height: '300px'}}
              >
                <div className="shimmer absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-800" />
                <div className="absolute inset-0 flex items-center justify-center text-2xl text-neutral-600 opacity-40">
                  ✦
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Deck navigation */}
        {hasCarousel ? (
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
                {deckVersions.map((dv, i) => (
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
            {!deckVersions && (
              <span className="text-[10px] text-neutral-600">Loading decks…</span>
            )}
          </div>
        )}
      </div>

      {/* Flowing text content */}
      {displayMeta && (
        <>
          <h3 className="font-serif text-lg font-semibold tracking-wide text-neutral-100">
            {displayMeta.names[0]}
          </h3>
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
      )}

      {/* Clear float */}
      <div className="clear-both" />
    </div>
  )
}

// ─── Cached image renderer ──────────────────────────────────────

interface CachedImageProps {
  art: NonNullable<CachedCard['smithWaite']>
  onLoad: () => void
  loaded: boolean
}

function CachedImage({art, onLoad, loaded}: CachedImageProps) {
  const width = 200
  const aspectRatio = art.dimensions
    ? getCroppedAspectRatio(
        art.dimensions.width,
        art.dimensions.height,
        art.crop as ImageCrop | null,
      )
    : 0.667
  const borderRadius = getScaledBorderRadius(art.cornerRounding || 0, width)
  const imageUrl = buildImageUrl(art.imageUrl, {
    width: width * 2,
    crop: art.crop as ImageCrop | null,
    dimensions: art.dimensions,
  })

  return (
    <div
      className={`relative overflow-hidden shadow-lg shadow-black/40 transition-opacity duration-500 ${
        loaded ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        width: `${width}px`,
        aspectRatio: String(aspectRatio),
        borderRadius: `${borderRadius}px`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        className="h-full w-full object-cover"
        onLoad={onLoad}
      />
    </div>
  )
}
