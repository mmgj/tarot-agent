'use client'

import {ChevronLeft, ChevronRight} from 'lucide-react'
import {useCallback, useEffect, useRef, useState} from 'react'

import {
  buildImageUrl,
  getCroppedAspectRatio,
  getHotspotPosition,
  getScaledBorderRadius,
  type DeckVersion,
} from '@/lib/sanity-image'

interface CardImageProps {
  /** Card title — used to fetch deck versions from /api/card-art */
  alt: string
  /** Callback when image is fully loaded and ready to display */
  onReady?: () => void
}

const CARD_WIDTH = 160 // px — rendered width of card images

export function CardImage({alt, onReady}: CardImageProps) {
  const [versions, setVersions] = useState<DeckVersion[] | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [error, setError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const readyFired = useRef(false)

  // Fetch all deck versions for this card
  useEffect(() => {
    if (!alt || alt === 'Card image') {
      onReady?.()
      return
    }

    const controller = new AbortController()
    fetch(`/api/card-art?title=${encodeURIComponent(alt)}`, {signal: controller.signal})
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.versions?.length > 0) {
          setVersions(data.versions)
          // Preload the first image
          const img = new Image()
          const firstVersion = data.versions[0]
          img.src = buildImageUrl(firstVersion, CARD_WIDTH * 2) // 2x for retina
          img.onload = () => {
            setImageLoaded(true)
            if (!readyFired.current) {
              readyFired.current = true
              onReady?.()
            }
          }
          img.onerror = () => {
            setError(true)
            if (!readyFired.current) {
              readyFired.current = true
              onReady?.()
            }
          }
        } else {
          setError(true)
          onReady?.()
        }
      })
      .catch(() => {
        setError(true)
        onReady?.()
      })

    return () => controller.abort()
  }, [alt]) // eslint-disable-line react-hooks/exhaustive-deps

  const current = versions?.[currentIndex]
  const hasMultiple = versions && versions.length > 1

  // Calculate aspect ratio from actual image metadata
  const aspectRatio = current ? getCroppedAspectRatio(current) : 2 / 3
  const borderRadius = current ? getScaledBorderRadius(current.cornerRounding, CARD_WIDTH) : 8
  const hotspotPos = current ? getHotspotPosition(current.hotspot) : 'center center'
  const imgSrc = current ? buildImageUrl(current, CARD_WIDTH * 2) : ''

  const navigate = useCallback(
    (direction: 'prev' | 'next') => {
      if (!versions) return
      setImageLoaded(false)
      if (direction === 'prev') {
        setCurrentIndex((i) => (i > 0 ? i - 1 : versions.length - 1))
      } else {
        setCurrentIndex((i) => (i < versions.length - 1 ? i + 1 : 0))
      }
    },
    [versions],
  )

  // When switching decks, preload the new image
  useEffect(() => {
    if (!current || currentIndex === 0) return
    const img = new Image()
    img.src = buildImageUrl(current, CARD_WIDTH * 2)
    img.onload = () => setImageLoaded(true)
    img.onerror = () => setImageLoaded(true) // Show broken state rather than infinite shimmer
  }, [current, currentIndex])

  if (error && !versions) {
    return null // Silently skip cards we can't load
  }

  return (
    <div className="card-deal inline-flex flex-col items-center gap-1.5">
      {/* Card container — aspect ratio from real metadata */}
      <div
        className="group relative overflow-hidden shadow-lg shadow-black/40"
        style={{
          width: `${CARD_WIDTH}px`,
          aspectRatio: String(aspectRatio),
          borderRadius: `${borderRadius}px`,
        }}
      >
        {/* Placeholder shimmer — always present until image loads */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}
        >
          <div className="shimmer absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-800" />
          {/* Faint card back pattern */}
          <div className="absolute inset-0 flex items-center justify-center text-2xl text-neutral-600 opacity-40">
            ✦
          </div>
        </div>

        {/* Actual image — fades in when loaded */}
        {imgSrc && (
          <img
            ref={imgRef}
            src={imgSrc}
            alt={alt || 'Card image'}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{objectPosition: hotspotPos}}
            loading="eager"
          />
        )}

        {/* Navigation arrows — show on hover when multiple versions exist */}
        {hasMultiple && imageLoaded && (
          <>
            <button
              type="button"
              onClick={() => navigate('prev')}
              className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1 text-white/80 opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
              aria-label="Previous deck"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => navigate('next')}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1 text-white/80 opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
              aria-label="Next deck"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Card name */}
      {alt && alt !== 'Card image' && (
        <span className="max-w-[10rem] text-center font-serif text-xs font-medium tracking-wide text-neutral-300">
          {alt}
        </span>
      )}

      {/* Deck name + dots indicator */}
      {current && (
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-neutral-500">{current.deckName}</span>
          {hasMultiple && versions && (
            <div className="flex gap-1">
              {versions.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setImageLoaded(false)
                    setCurrentIndex(i)
                  }}
                  className={`h-1 rounded-full transition-all ${
                    i === currentIndex ? 'w-3 bg-purple-400' : 'w-1 bg-neutral-600 hover:bg-neutral-500'
                  }`}
                  aria-label={`View ${versions[i].deckName} version`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
