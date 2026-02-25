'use client'

import {useEffect, useRef, useState} from 'react'

import {
  buildImageUrl,
  getCroppedAspectRatio,
  getHotspotPosition,
  getScaledBorderRadius,
  type CardArtResult,
} from '@/lib/sanity-image'

interface CardImageProps {
  /** Card art data from the API */
  art: CardArtResult
  /** Rendered width in px (used for standalone cards in spread view) */
  width?: number
  /**
   * If true, image scales to fit within its parent container (object-contain).
   * The image preserves its real aspect ratio from Sanity dimensions/crop.
   * Used in the carousel where the container is fixed-size.
   */
  contain?: boolean
  /** Callback when image is fully loaded */
  onLoad?: () => void
}

export function CardImage({art, width = 160, contain = false, onLoad}: CardImageProps) {
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const aspectRatio = getCroppedAspectRatio(art)
  const borderRadius = getScaledBorderRadius(art.cornerRounding, width)
  const imgSrc = buildImageUrl(art, width * 2) // 2x for retina

  // Preload image
  useEffect(() => {
    const img = new Image()
    img.src = imgSrc
    img.onload = () => {
      setLoaded(true)
      onLoad?.()
    }
    img.onerror = () => {
      setLoaded(true) // Show broken state rather than infinite shimmer
      onLoad?.()
    }
  }, [imgSrc]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Contain mode: image fills parent via object-contain ────
  // The parent container is fixed-size (e.g., 200x300 in carousel).
  // The image scales down to fit, preserving its real aspect ratio.
  // No cropping, no layout shift.
  if (contain) {
    return (
      <img
        ref={imgRef}
        src={imgSrc}
        alt={art.cardTitle}
        className={`h-full w-full object-contain transition-opacity duration-500 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{borderRadius: `${borderRadius}px`}}
        loading="eager"
      />
    )
  }

  // ─── Standalone mode: card sizes itself from its own dimensions ──
  // Used in spread view (2-5 cards) and list view rows.
  return (
    <div className="card-deal inline-flex flex-col items-center gap-1.5">
      <div
        className="relative overflow-hidden shadow-lg shadow-black/40"
        style={{
          width: `${width}px`,
          aspectRatio: String(aspectRatio),
          borderRadius: `${borderRadius}px`,
        }}
      >
        {/* Placeholder shimmer */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${loaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <div className="shimmer absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-800" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl text-neutral-600 opacity-40">
            ✦
          </div>
        </div>

        {/* Actual image — object-cover is fine here since the container matches the card's own aspect ratio */}
        <img
          ref={imgRef}
          src={imgSrc}
          alt={art.cardTitle}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{objectPosition: getHotspotPosition(art.hotspot)}}
          loading="eager"
        />
      </div>

      {/* Card name */}
      <span className="max-w-[10rem] text-center font-serif text-xs font-medium tracking-wide text-neutral-300">
        {art.cardTitle}
      </span>
    </div>
  )
}
