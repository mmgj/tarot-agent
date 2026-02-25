import {NextRequest, NextResponse} from 'next/server'

// Same Sanity project as tarotify — public dataset, read-only CDN
const PROJECT_ID = 'mzfc5dty'
const DATASET = 'semantic'

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get('title')
  if (!title) {
    return NextResponse.json({error: 'title parameter required'}, {status: 400})
  }

  // Fetch full image metadata: dimensions, crop, hotspot — same as tarotify uses
  const query = `*[_type == "cardArt" && card->title == $title]{
    "deckName": deck->title,
    "deckId": deck->_id,
    "deckSlug": deck->slug.current,
    "cornerRounding": deck->cornerRounding,
    "imageUrl": image.asset->url,
    "dimensions": image.asset->metadata.dimensions {
      width,
      height,
      aspectRatio
    },
    "crop": image.crop,
    "hotspot": image.hotspot
  } | order(deckName asc)`

  const apiUrl = new URL(`https://${PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${DATASET}`)
  apiUrl.searchParams.set('query', query)
  apiUrl.searchParams.set('$title', `"${title}"`)

  const headers: Record<string, string> = {}
  if (process.env.SANITY_API_READ_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.SANITY_API_READ_TOKEN}`
  }

  try {
    const response = await fetch(apiUrl.toString(), {headers})
    if (!response.ok) {
      console.error('Sanity query failed:', response.status, await response.text())
      return NextResponse.json({error: 'Failed to query Sanity'}, {status: 502})
    }

    const data = await response.json()
    const versions = (data.result || [])
      .filter((v: {imageUrl?: string}) => v.imageUrl)
      .map(
        (v: {
          deckName: string
          deckId: string
          deckSlug: string
          cornerRounding?: number
          imageUrl: string
          dimensions?: {width: number; height: number; aspectRatio: number}
          crop?: {top: number; left: number; bottom: number; right: number}
          hotspot?: {x: number; y: number; width?: number; height?: number}
        }) => ({
          deckName: v.deckName,
          deckId: v.deckId,
          deckSlug: v.deckSlug,
          cornerRounding: v.cornerRounding ?? 0,
          imageUrl: v.imageUrl,
          dimensions: v.dimensions || null,
          crop: v.crop || null,
          hotspot: v.hotspot || null,
        }),
      )

    return NextResponse.json(
      {cardTitle: title, versions},
      {headers: {'Cache-Control': 'public, max-age=3600, s-maxage=3600'}},
    )
  } catch (err) {
    console.error('Card art query error:', err)
    return NextResponse.json({error: 'Internal error'}, {status: 500})
  }
}
