'use client'

import {ChevronLeft, ChevronRight} from 'lucide-react'
import {useCallback, useRef, useState} from 'react'

import {CardImage} from './CardImage'
import {formatCreators, type CardArtResult, type CardMeta} from '@/lib/sanity-image'

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

function MetaRow({label, value}: {label: string; value: string}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-neutral-500">
        {label}
      </span>
      <span className="text-sm text-neutral-300">{value}</span>
    </div>
  )
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

  return (
    <div className="my-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
      {/* Left column: large card image + deck carousel */}
      <div className="flex shrink-0 flex-col items-center gap-3">
        <div
          className={`transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{minHeight: imageLoaded ? undefined : '20rem'}}
        >
          <CardImage
            key={`${current.slug}-${current.art.cardTitle}`}
            art={current.art}
            width={240}
            onLoad={handleLoad}
          />
        </div>

        {/* Deck navigation */}
        {hasMultiple && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('prev')}
              className="rounded-full p-1 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-300"
              aria-label="Previous deck"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xs font-medium text-neutral-300">{current.name}</span>
              {current.creators && (
                <span className="text-[10px] text-neutral-500">{current.creators}</span>
              )}
              <div className="mt-1 flex gap-1">
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
              className="rounded-full p-1 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-300"
              aria-label="Next deck"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Single deck info */}
        {!hasMultiple && (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs font-medium text-neutral-400">{current.name}</span>
            {current.creators && (
              <span className="text-[10px] text-neutral-500">{current.creators}</span>
            )}
          </div>
        )}
      </div>

      {/* Right column: card metadata */}
      {meta && (
        <div className="flex flex-col gap-3 pt-1">
          {/* Card name + alternates */}
          <div>
            <h3 className="font-serif text-lg font-semibold tracking-wide text-neutral-100">
              {meta.names[0]}
            </h3>
            {meta.names.length > 1 && (
              <p className="mt-0.5 text-xs italic text-neutral-500">
                {meta.names.slice(1).join(' · ')}
              </p>
            )}
            {meta.tldr && (
              <p className="mt-1 text-sm leading-relaxed text-neutral-400">{meta.tldr}</p>
            )}
          </div>

          {/* Correspondences */}
          <div className="flex flex-col gap-1.5 border-t border-neutral-800 pt-3">
            {meta.arcana && <MetaRow label="Arcana" value={capitalize(meta.arcana)} />}
            {meta.suit && meta.suit !== 'major' && <MetaRow label="Suit" value={capitalize(meta.suit)} />}
            {meta.number != null && <MetaRow label="Number" value={String(meta.number)} />}
            {meta.element && <MetaRow label="Element" value={capitalize(meta.element)} />}
            {meta.astrology && <MetaRow label="Astrology" value={capitalize(meta.astrology)} />}
            {meta.hebrewLetter && <MetaRow label="Hebrew Letter" value={capitalize(meta.hebrewLetter)} />}
          </div>

          {/* Meanings */}
          {(meta.upright?.length > 0 || meta.reversed?.length > 0) && (
            <div className="flex flex-col gap-2 border-t border-neutral-800 pt-3">
              {meta.upright?.length > 0 && (
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                    Upright
                  </span>
                  <p className="mt-0.5 text-sm leading-relaxed text-neutral-300">
                    {meta.upright.join(' · ')}
                  </p>
                </div>
              )}
              {meta.reversed?.length > 0 && (
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                    Reversed
                  </span>
                  <p className="mt-0.5 text-sm leading-relaxed text-neutral-400">
                    {meta.reversed.join(' · ')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
