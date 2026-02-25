/**
 * Client-side card drawing.
 *
 * All randomness happens here — the AI never picks cards.
 * We detect draw intent from the user's message, pick cards
 * from the warm cache, and pass the results to the AI as context.
 */

import {getAllCards, type CachedCard} from './card-cache'

export interface DrawResult {
  /** Number of cards drawn */
  count: number
  /** The drawn cards */
  cards: CachedCard[]
  /** The original user message (unmodified) */
  originalText: string
  /** Augmented text to send to the AI */
  augmentedText: string
}

/**
 * Detect if a message is asking to draw/pull cards.
 * Returns the count, or null if no draw intent detected.
 */
export function detectDrawIntent(text: string): number | null {
  const normalized = text.trim().toLowerCase()

  // Celtic Cross = 10 cards
  if (/celtic\s+cross/i.test(normalized)) return 10

  // "card of the day" / "daily card" = 1
  if (/card\s+of\s+the\s+day/i.test(normalized)) return 1
  if (/daily\s+card/i.test(normalized)) return 1

  // "draw/pull a (random) card" = 1
  if (/(?:draw|pull)\s+(?:a\s+)?(?:random\s+)?card\b/i.test(normalized)) return 1

  // "draw/pull N cards" or "N-card spread/draw/reading"
  const drawN = normalized.match(/(?:draw|pull)\s+(?:a\s+)?(?:random\s+)?(\d+)\s+cards?/i)
  if (drawN) return Math.min(parseInt(drawN[1], 10), 78)

  const spreadN = normalized.match(/(\d+)[- ]card\s+(?:spread|draw|reading)/i)
  if (spreadN) return Math.min(parseInt(spreadN[1], 10), 78)

  return null
}

/**
 * Pick N random cards from the cache using Fisher-Yates shuffle.
 * Returns empty array if cache isn't warm.
 */
export function drawRandomCards(count: number): CachedCard[] {
  const all = getAllCards()
  if (all.length === 0) return []

  // Fisher-Yates partial shuffle — only need first `count` elements
  const pool = [...all]
  const n = Math.min(count, pool.length)
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, n)
}

/**
 * Process a user message: detect draw intent, pick cards, augment text.
 * Returns null if no draw intent detected.
 */
export function processDrawIntent(text: string): DrawResult | null {
  const count = detectDrawIntent(text)
  if (count === null) return null

  const cards = drawRandomCards(count)
  if (cards.length === 0) return null // Cache not warm

  const cardNames = cards.map((c) => c.name).join(', ')

  const augmentedText = `${text}

[The following cards were drawn for this reading: ${cardNames}. These cards were randomly selected — provide your reading for exactly these cards. Do NOT draw different cards or use tools to select cards. Do NOT include image markdown (![...](url)) for these cards — they are already displayed to the user. Focus entirely on your interpretation.]`

  return {
    count,
    cards,
    originalText: text,
    augmentedText,
  }
}
