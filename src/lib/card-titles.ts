/**
 * The 78 tarot card titles — used to detect card names in streaming text
 * before the full markdown image URL has arrived.
 */
export const CARD_TITLES = [
  'Ace of Cups', 'Ace of Pentacles', 'Ace of Swords', 'Ace of Wands',
  'Two of Cups', 'Two of Pentacles', 'Two of Swords', 'Two of Wands',
  'Three of Cups', 'Three of Pentacles', 'Three of Swords', 'Three of Wands',
  'Four of Cups', 'Four of Pentacles', 'Four of Swords', 'Four of Wands',
  'Five of Cups', 'Five of Pentacles', 'Five of Swords', 'Five of Wands',
  'Six of Cups', 'Six of Pentacles', 'Six of Swords', 'Six of Wands',
  'Seven of Cups', 'Seven of Pentacles', 'Seven of Swords', 'Seven of Wands',
  'Eight of Cups', 'Eight of Pentacles', 'Eight of Swords', 'Eight of Wands',
  'Nine of Cups', 'Nine of Pentacles', 'Nine of Swords', 'Nine of Wands',
  'Ten of Cups', 'Ten of Pentacles', 'Ten of Swords', 'Ten of Wands',
  'Page of Cups', 'Page of Pentacles', 'Page of Swords', 'Page of Wands',
  'Knight of Cups', 'Knight of Pentacles', 'Knight of Swords', 'Knight of Wands',
  'Queen of Cups', 'Queen of Pentacles', 'Queen of Swords', 'Queen of Wands',
  'King of Cups', 'King of Pentacles', 'King of Swords', 'King of Wands',
  'The Fool', 'The Magician', 'The High Priestess', 'The Empress',
  'The Emperor', 'The Hierophant', 'The Lovers', 'The Chariot',
  'Strength', 'The Hermit', 'Wheel Of Fortune', 'Justice',
  'The Hanged Man', 'Death', 'Temperance', 'The Devil',
  'The Tower', 'The Star', 'The Moon', 'The Sun',
  'Judgment', 'The World',
] as const

const TITLE_SET = new Set(CARD_TITLES.map(t => t.toLowerCase()))

/** Check if a string is a known card title (case-insensitive) */
export function isCardTitle(text: string): boolean {
  return TITLE_SET.has(text.trim().toLowerCase())
}
