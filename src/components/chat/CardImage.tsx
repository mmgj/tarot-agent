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
  /** Rendered width in px */
  width?: number
  /** If true, image fits within its parent container (max-height: 100%) */
  contain?: boolean
  /** Callback when image is fully loaded */
  onLoad?: () => void
}

export function CardImage({art, width = 160, contain = false, onLoad}: CardImageProps) {
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const aspectRatio = getCroppedAspectRatio(art)
  const borderRadius = getScaledBorderRadius(art.cornerRounding, width)
  const hotspotPos = getHotspotPosition(art.hotspot)
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

  // In contain mode, compute height from width + aspect ratio, capped by parent
  const computedHeight = Math.round(width / aspectRatio)

  return (
    <div className="card-deal inline-flex flex-col items-center gap-1.5">
      <div
        className="relative overflow-hidden shadow-lg shadow-black/40"
        style={{
          width: `${width}px`,
          height: contain ? `${computedHeight}px` : undefined,
          maxHeight: contain ? '100%' : undefined,
          aspectRatio: contain ? undefined : String(aspectRatio),
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

        {/* Actual image */}
        <img
          ref={imgRef}
          src={imgSrc}
          alt={art.cardTitle}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{objectPosition: hotspotPos}}
          loading="eager"
        />
      </div>

      {/* Card name — hide in contain mode (detail view shows it separately) */}
      {!contain && (
        <span className="max-w-[10rem] text-center font-serif text-xs font-medium tracking-wide text-neutral-300">
          {art.cardTitle}
        </span>
      )}
    </div>
  )
}
