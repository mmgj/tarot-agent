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

export interface DeckVersion {
  deckName: string
  deckId: string
  deckSlug: string
  cornerRounding: number
  imageUrl: string
  dimensions: ImageDimensions | null
  crop: ImageCrop | null
  hotspot: ImageHotspot | null
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
export function getCroppedAspectRatio(version: DeckVersion): number {
  const dims = version.dimensions
  if (!dims) return 2 / 3 // Fallback for tarot cards

  if (hasCrop(version.crop)) {
    const croppedW = dims.width * (1 - version.crop.left - version.crop.right)
    const croppedH = dims.height * (1 - version.crop.top - version.crop.bottom)
    return croppedW / croppedH
  }

  return dims.aspectRatio ?? dims.width / dims.height
}

/** Build a complete image URL with crop and width. */
export function buildImageUrl(version: DeckVersion, width = 400): string {
  let url = applyCropToUrl(version.imageUrl, version.crop, version.dimensions)
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
