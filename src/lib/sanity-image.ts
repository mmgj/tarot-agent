/**
 * Sanity image URL utilities — adapted from tarotify/lib/sanity-image.ts.
 * Handles crop, hotspot, and dimension calculations.
 */

export interface ImageCrop {
  top: number
  left: number
  bottom: number
  right: number
}

export interface ImageHotspot {
  x: number
  y: number
  width?: number
  height?: number
}

export interface ImageDimensions {
  width: number
  height: number
  aspectRatio?: number
}

export interface Creator {
  name: string
  role: string
}

export interface CardArtResult {
  cardTitle: string
  deckName: string
  deckId: string
  deckSlug: string
  cornerRounding: number
  imageUrl: string
  dimensions: ImageDimensions | null
  crop: ImageCrop | null
  hotspot: ImageHotspot | null
  creators: Creator[]
}

export interface DeckInfo {
  _id: string
  name: string
  slug: string
  cornerRounding: number
  creators: Creator[]
}

/** Check if crop data represents an actual crop (not all zeros). */
function hasCrop(crop: ImageCrop | null | undefined): crop is ImageCrop {
  if (!crop) return false
  return crop.top !== 0 || crop.bottom !== 0 || crop.left !== 0 || crop.right !== 0
}

/** Apply Sanity crop rect to a URL. */
function applyCropToUrl(
  url: string,
  crop: ImageCrop | null | undefined,
  dimensions: ImageDimensions | null | undefined,
): string {
  if (!hasCrop(crop) || !dimensions) return url
  const {width, height} = dimensions
  const x = Math.round(crop.left * width)
  const y = Math.round(crop.top * height)
  const w = Math.round(width * (1 - crop.left - crop.right))
  const h = Math.round(height * (1 - crop.top - crop.bottom))
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}rect=${x},${y},${w},${h}`
}

/** Get the aspect ratio of the cropped region. */
export function getCroppedAspectRatio(art: CardArtResult): number {
  const dims = art.dimensions
  if (!dims) return 2 / 3 // Fallback for tarot cards

  if (hasCrop(art.crop)) {
    const croppedW = dims.width * (1 - art.crop.left - art.crop.right)
    const croppedH = dims.height * (1 - art.crop.top - art.crop.bottom)
    return croppedW / croppedH
  }

  return dims.aspectRatio ?? dims.width / dims.height
}

/** Build a complete image URL with crop and width. */
export function buildImageUrl(art: CardArtResult, width = 400): string {
  let url = applyCropToUrl(art.imageUrl, art.crop, art.dimensions)
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}w=${width}&q=80&fit=clip`
}

/** Get CSS object-position for hotspot-aware display. */
export function getHotspotPosition(hotspot: ImageHotspot | null | undefined): string {
  if (!hotspot) return 'center center'
  return `${hotspot.x * 100}% ${hotspot.y * 100}%`
}

/** Scale border radius proportionally to rendered width (from tarotify). */
const REFERENCE_CARD_WIDTH = 150
export function getScaledBorderRadius(cornerRounding: number, renderedWidth: number): number {
  if (cornerRounding <= 0) return 0
  return Math.round(cornerRounding * (renderedWidth / REFERENCE_CARD_WIDTH))
}

/** Format creators for display: "Art by X, written by Y" */
export function formatCreators(creators: Creator[]): string {
  if (!creators || creators.length === 0) return ''
  return creators
    .filter((c) => c.name)
    .map((c) => {
      const role = c.role?.toLowerCase()
      if (role === 'artist') return `Art by ${c.name}`
      if (role === 'author') return `Written by ${c.name}`
      if (role === 'publisher') return `Published by ${c.name}`
      return `${c.name} (${c.role})`
    })
    .join(' · ')
}
