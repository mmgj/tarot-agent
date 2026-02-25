'use client'

import {ChevronLeft, ChevronRight} from 'lucide-react'
import {useCallback, useEffect, useRef, useState} from 'react'

interface DeckVersion {
  deckName: string
  deckId: string
  imageUrl: string
}

interface CardImageProps {
  /** Initial image URL from the agent's markdown */
  src: string
  /** Card title (used to fetch other deck versions) */
  alt: string
}

export function CardImage({src, alt}: CardImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [versions, setVersions] = useState<DeckVersion[] | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  // Fetch all deck versions for this card
  useEffect(() => {
    if (!alt || alt === 'Card image') return

    const controller = new AbortController()
    fetch(`/api/card-art?title=${encodeURIComponent(alt)}`, {signal: controller.signal})
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.versions?.length > 0) {
          setVersions(data.versions)
          // Find the version matching the initial src (or default to first)
          const matchIdx = data.versions.findIndex((v: DeckVersion) => src.includes(v.imageUrl.split('?')[0]))
          if (matchIdx >= 0) setCurrentIndex(matchIdx)
        }
      })
      .catch(() => {
        // Silently fail — we still have the original image
      })

    return () => controller.abort()
  }, [alt, src])

  const currentSrc = versions?.[currentIndex]?.imageUrl || src
  const currentDeck = versions?.[currentIndex]?.deckName
  const hasMultiple = versions && versions.length > 1

  const navigate = useCallback(
    (direction: 'left' | 'right') => {
      if (!versions || isAnimating) return
      setIsAnimating(true)
      setSlideDirection(direction)

      setTimeout(() => {
        if (direction === 'left') {
          setCurrentIndex((i) => (i > 0 ? i - 1 : versions.length - 1))
        } else {
          setCurrentIndex((i) => (i < versions.length - 1 ? i + 1 : 0))
        }
        setSlideDirection(null)
        setIsAnimating(false)
      }, 200)
    },
    [versions, isAnimating],
  )

  return (
    <div className="card-deal inline-flex flex-col items-center gap-1.5">
      {/* Card container with fixed aspect ratio */}
      <div
        className="group relative overflow-hidden rounded-lg shadow-lg shadow-black/40"
        style={{width: '10rem', aspectRatio: '2/3'}}
      >
        {/* Placeholder shimmer */}
        {!loaded && (
          <div className="absolute inset-0 bg-neutral-800">
            <div className="shimmer absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-800" />
          </div>
        )}

        {/* Image with fade-in */}
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt || 'Card image'}
          className={`h-full w-full object-cover transition-opacity duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          } ${slideDirection ? 'transition-transform duration-200' : ''}`}
          style={{
            transform: slideDirection === 'left' ? 'translateX(100%)' : slideDirection === 'right' ? 'translateX(-100%)' : 'translateX(0)',
          }}
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />

        {/* Navigation arrows — show on hover when multiple versions exist */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={() => navigate('left')}
              className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1 text-white/80 opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
              aria-label="Previous deck"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('right')}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1 text-white/80 opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
              aria-label="Next deck"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Card name */}
      {alt && alt !== 'Card image' && (
        <span className="font-serif text-xs font-medium tracking-wide text-neutral-300">
          {alt}
        </span>
      )}

      {/* Deck name + dots indicator */}
      {currentDeck && (
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-neutral-500">{currentDeck}</span>
          {hasMultiple && (
            <div className="flex gap-1">
              {versions.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentIndex(i)}
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
