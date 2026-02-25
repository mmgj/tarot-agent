'use client'

import {ChevronLeft, ChevronRight} from 'lucide-react'
import {useCallback, useRef, useState} from 'react'

import {CardImage} from './CardImage'
import {type CardArtResult, type CardMeta} from '@/lib/sanity-image'

interface CardDetailProps {
  /** All art versions for this card, grouped by deck */
  deckVersions: {slug: string; name: string; creators: string; art: CardArtResult}[]
  /** Card metadata from Sanity */
  meta: CardMeta | null
  /** Initial deck index (default: 0) */
  initialDeckIndex?: number
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function CardDetail({deckVersions, meta, initialDeckIndex = 0}: CardDetailProps) {
  const [deckIndex, setDeckIndex] = useState(initialDeckIndex)
  const [imageLoaded, setImageLoaded] = useState(false)
  const loadedRef = useRef(false)

  const current = deckVersions[deckIndex]
  const hasMultiple = deckVersions.length > 1

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

  const navigate = useCallback(
    (dir: 'prev' | 'next') => {
      const len = deckVersions.length
      switchDeck(dir === 'prev' ? (deckIndex - 1 + len) % len : (deckIndex + 1) % len)
    },
    [deckIndex, deckVersions.length, switchDeck],
  )

  if (!current) return null

  // Build correspondences line
  const corr: string[] = []
  if (meta?.arcana) corr.push(capitalize(meta.arcana))
  if (meta?.element) corr.push(capitalize(meta.element))
  if (meta?.astrology) corr.push(capitalize(meta.astrology))
  if (meta?.hebrewLetter) corr.push(capitalize(meta.hebrewLetter))

  return (
    <div className="my-4">
      {/* Floated image + deck nav */}
      <div className="float-left mr-4 mb-3 flex flex-col items-center gap-2">
        <div
          className={`transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{minHeight: imageLoaded ? undefined : '20rem'}}
        >
          <CardImage
            key={`${current.slug}-${current.art.cardTitle}`}
            art={current.art}
            width={200}
            onLoad={handleLoad}
          />
        </div>

        {/* Deck carousel */}
        {hasMultiple ? (
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
              <span className="text-[11px] font-medium text-neutral-300">{current.name}</span>
              {current.creators && (
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
            <span className="text-[11px] font-medium text-neutral-400">{current.name}</span>
            {current.creators && (
              <span className="text-[10px] text-neutral-500">{current.creators}</span>
            )}
          </div>
        )}
      </div>

      {/* Flowing text content */}
      {meta && (
        <>
          {/* Card name + alternates */}
          <h3 className="font-serif text-lg font-semibold tracking-wide text-neutral-100">
            {meta.names[0]}
          </h3>
          {meta.names.length > 1 && (
            <p className="mt-0.5 text-xs italic text-neutral-500">
              {meta.names.slice(1).join(' · ')}
            </p>
          )}

          {/* Correspondences as inline tags */}
          {corr.length > 0 && (
            <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
              {corr.join(' · ')}
            </p>
          )}

          {meta.tldr && (
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">{meta.tldr}</p>
          )}

          {/* Meanings */}
          {meta.upright?.length > 0 && (
            <p className="mt-2 text-sm leading-relaxed text-neutral-300">
              <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">Upright </span>
              {meta.upright.join(' · ')}
            </p>
          )}
          {meta.reversed?.length > 0 && (
            <p className="mt-1 text-sm leading-relaxed text-neutral-400">
              <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">Reversed </span>
              {meta.reversed.join(' · ')}
            </p>
          )}
        </>
      )}

      {/* Clear float */}
      <div className="clear-both" />
    </div>
  )
}
