/** Suggestion chip pools for the empty state and persistent quick-actions. */

const SUITS = ['Cups', 'Wands', 'Swords', 'Pentacles']
const MAJOR_ARCANA = 'Major Arcana'

const GROUPABLE_PROPERTIES: {label: string; query: string}[] = [
  {label: 'the element Fire', query: 'the element Fire'},
  {label: 'the element Water', query: 'the element Water'},
  {label: 'the element Air', query: 'the element Air'},
  {label: 'the element Earth', query: 'the element Earth'},
  {label: 'the planet Venus', query: 'the planet Venus'},
  {label: 'the planet Mars', query: 'the planet Mars'},
  {label: 'the planet Mercury', query: 'the planet Mercury'},
  {label: 'the planet Jupiter', query: 'the planet Jupiter'},
  {label: 'the planet Saturn', query: 'the planet Saturn'},
  {label: 'the Moon', query: 'the Moon'},
  {label: 'the Sun', query: 'the Sun'},
]

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export interface Suggestion {
  /** Display text on the chip */
  label: string
  /** If set, this is a client-side draw — pick this many random cards */
  drawCount?: number
}

/** Generate a set of suggestion chips. Call once on mount for stable values. */
export function generateSuggestions(): Suggestion[] {
  // Pick a random suit or major arcana for the "list all" suggestion
  const suitOrMajor = Math.random() < 0.3
    ? MAJOR_ARCANA
    : pickRandom(SUITS, 1)[0]

  // Pick a random groupable property
  const prop = pickRandom(GROUPABLE_PROPERTIES, 1)[0]

  return [
    {label: 'Draw a random card', drawCount: 1},
    {label: 'Draw 3 cards', drawCount: 3},
    {label: 'Draw 5 cards', drawCount: 5},
    {label: `List all ${suitOrMajor} cards`},
    {label: `Which cards have ${prop.query} in common?`},
  ]
}
