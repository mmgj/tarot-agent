/**
 * Static card data cache.
 *
 * All 78 tarot cards with their metadata and Rider Smith Waite artwork
 * are essentially static content. This module fetches them once on first
 * access and caches in memory. The detail view can render instantly from
 * cache without waiting for the AI or an API call.
 *
 * Cache is keyed by card title (case-insensitive) for fast lookup from
 * the alt text in streamed markdown images.
 */

import {type CardMeta} from './sanity-image'

export interface CachedCard {
  id: string
  name: string
  names: string[]
  meta: CardMeta
  smithWaite: {
    imageUrl: string
    dimensions: {width: number; height: number; aspectRatio: number} | null
    crop: {top: number; right: number; bottom: number; left: number} | null
    hotspot: {x: number; y: number; width: number; height: number} | null
    cornerRounding: number
  } | null
}

type CardCache = Map<string, CachedCard>

let cachePromise: Promise<CardCache> | null = null

/**
 * Fetch all 78 cards with Smith-Waite art. Called once, cached forever.
 */
async function fetchAllCards(): Promise<CardCache> {
  const res = await fetch('/api/card-art?cache=all')
  if (!res.ok) {
    throw new Error(`Failed to fetch card cache: ${res.status}`)
  }

  const data: CachedCard[] = await res.json()
  const cache: CardCache = new Map()

  for (const card of data) {
    // Index by primary name (case-insensitive)
    cache.set(card.name.toLowerCase(), card)
    // Also index by alternate names
    for (const altName of card.names) {
      cache.set(altName.toLowerCase(), card)
    }
  }

  return cache
}

/**
 * Get the card cache. First call triggers the fetch; subsequent calls
 * return the same promise (deduped).
 */
export function getCardCache(): Promise<CardCache> {
  if (!cachePromise) {
    cachePromise = fetchAllCards().catch((err) => {
      // Reset on failure so next call retries
      cachePromise = null
      throw err
    })
  }
  return cachePromise
}

/**
 * Look up a card by title. Returns null if cache isn't ready or card not found.
 * Non-blocking — returns immediately from cache if available.
 */
let resolvedCache: CardCache | null = null

export function getCardSync(title: string): CachedCard | null {
  if (!resolvedCache) return null
  return resolvedCache.get(title.toLowerCase()) ?? null
}

/**
 * Initialize the cache. Call this early (e.g., in Chat component mount).
 * Resolves the cache so getCardSync works.
 */
export async function warmCardCache(): Promise<void> {
  const cache = await getCardCache()
  resolvedCache = cache
}

/**
 * Get all cached cards as an array. Returns empty if cache isn't warm yet.
 * Each card appears once (by primary name only, no duplicates from alt names).
 */
export function getAllCards(): CachedCard[] {
  if (!resolvedCache) return []
  // Deduplicate — the cache has entries for alt names pointing to the same card
  const seen = new Set<string>()
  const cards: CachedCard[] = []
  for (const card of resolvedCache.values()) {
    if (!seen.has(card.id)) {
      seen.add(card.id)
      cards.push(card)
    }
  }
  return cards
}
