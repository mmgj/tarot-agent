/**
 * Client-side card drawing.
 *
 * ONLY handles pure random draws — "draw 3 cards", "pull a card", etc.
 * Anything with intent, theme, or qualifiers ("spread about love",
 * "cards for new beginnings", "optimistic reading") goes to the AI,
 * which uses MCP tools to select appropriate cards.
 *
 * The rule: if the user just wants randomness, we do it instantly.
 * If they want the AI's judgment, we stay out of the way.
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
 * Words/phrases that signal the user wants AI judgment, not pure randomness.
 * If any of these appear, we let the AI handle the entire request.
 */
const INTENT_SIGNALS = [
  /\babout\b/i,
  /\bfor\s+(?:my|our|the|a)\b/i,
  /\bregarding\b/i,
  /\brelated\s+to\b/i,
  /\boptimistic\b/i,
  /\bpessimistic\b/i,
  /\blove\b/i,
  /\bcareer\b/i,
  /\bhealth\b/i,
  /\bmoney\b/i,
  /\brelationship\b/i,
  /\bfuture\b/i,
  /\bpast\b/i,
  /\bguidance\b/i,
  /\badvice\b/i,
  /\binsight\b/i,
  /\bmeaning\b/i,
  /\brepresent\b/i,
  /\bthat\s+(show|reflect|symbolize|embod)/i,
  /\bwhich\b/i,
  /\bwhat\b/i,
  /\bspecific\b/i,
  /\bchoose\b/i,
  /\bselect\b/i,
  /\bpick\b/i,
  /\bbest\b/i,
  /\bsuit(able|ed)?\b/i,
]

function hasIntentSignals(text: string): boolean {
  return INTENT_SIGNALS.some((re) => re.test(text))
}

/**
 * Detect if a message is a pure random draw request.
 * Returns the count, or null if:
 * - No draw intent detected
 * - The message has qualifiers/themes that need AI judgment
 */
export function detectDrawIntent(text: string): number | null {
  const normalized = text.trim()

  // If the message has intent signals, let the AI handle it entirely
  if (hasIntentSignals(normalized)) return null

  // Pure random patterns only:

  // "draw/pull a (random) card" = 1
  if (/^(?:draw|pull)\s+(?:a\s+)?(?:random\s+)?card\.?$/i.test(normalized)) return 1

  // "draw/pull N cards" (short, no qualifiers)
  const drawN = normalized.match(/^(?:draw|pull)\s+(?:a\s+)?(?:random\s+)?(\d+)\s+cards?\.?$/i)
  if (drawN) return Math.min(parseInt(drawN[1], 10), 78)

  // "N-card spread/draw/reading" (bare, no qualifiers)
  const spreadN = normalized.match(/^(\d+)[- ]card\s+(?:spread|draw|reading)\.?$/i)
  if (spreadN) return Math.min(parseInt(spreadN[1], 10), 78)

  // "card of the day" / "daily card" = 1
  if (/^(?:card\s+of\s+the\s+day|daily\s+card)\.?$/i.test(normalized)) return 1

  // "draw a random card" from suggestion chip
  if (/^draw\s+a\s+random\s+card\.?$/i.test(normalized)) return 1

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
