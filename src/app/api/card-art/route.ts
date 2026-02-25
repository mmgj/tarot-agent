import {NextRequest, NextResponse} from 'next/server'

// Same Sanity project as tarotify — public dataset, read-only CDN
const PROJECT_ID = 'mzfc5dty'
const DATASET = 'semantic'

function sanityQuery(query: string, params?: Record<string, string>) {
  const apiUrl = new URL(`https://${PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${DATASET}`)
  apiUrl.searchParams.set('query', query)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      apiUrl.searchParams.set(`$${k}`, `"${v}"`)
    }
  }

  const headers: Record<string, string> = {}
  if (process.env.SANITY_API_READ_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.SANITY_API_READ_TOKEN}`
  }

  return fetch(apiUrl.toString(), {headers})
}

/**
 * GET /api/card-art?title=The Star
 *   → Returns all deck versions for a single card
 *
 * GET /api/card-art?titles=The Star,The Moon,The Sun
 *   → Returns versions for multiple cards (batch)
 *
 * GET /api/card-art?deck=smith-waite&titles=The Star,The Moon
 *   → Returns versions from a specific deck only
 *
 * GET /api/card-art?decks=true
 *   → Returns all available decks with creator info
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams

  // Deck listing endpoint
  if (params.get('decks') === 'true') {
    return handleDeckList()
  }

  const title = params.get('title')
  const titles = params.get('titles')
  const deckSlug = params.get('deck')

  if (!title && !titles) {
    return NextResponse.json({error: 'title or titles parameter required'}, {status: 400})
  }

  const cardTitles = titles ? titles.split(',').map((t) => t.trim()) : [title!]

  return handleCardArt(cardTitles, deckSlug)
}

async function handleDeckList() {
  const query = `*[_type == "deck"]{
    _id,
    name,
    "slug": slug.current,
    cornerRounding,
    "creators": creators[]{
      role,
      "name": person->name
    }
  } | order(name asc)`

  try {
    const response = await sanityQuery(query)
    if (!response.ok) {
      return NextResponse.json({error: 'Failed to query Sanity'}, {status: 502})
    }

    const data = await response.json()
    return NextResponse.json(
      {decks: data.result || []},
      {headers: {'Cache-Control': 'public, max-age=3600, s-maxage=3600'}},
    )
  } catch {
    return NextResponse.json({error: 'Internal error'}, {status: 500})
  }
}

async function handleCardArt(cardTitles: string[], deckSlug: string | null) {
  // Build query — optionally filter by deck
  const deckFilter = deckSlug ? ` && deck->slug.current == $deckSlug` : ''
  const query = `*[_type == "cardArt" && card->title in $titles${deckFilter}]{
    "cardTitle": card->title,
    "deckName": deck->name,
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
    "hotspot": image.hotspot,
    "creators": deck->creators[]{
      role,
      "name": person->name
    },
    "cardMeta": card->{
      "names": names,
      suit,
      number,
      arcana,
      element,
      astrology,
      hebrewLetter,
      tldr,
      "upright": meanings.upright[].children[0].text,
      "reversed": meanings.reversed[].children[0].text
    }
  } | order(cardTitle asc, deckName asc)`

  const apiUrl = new URL(`https://${PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${DATASET}`)
  apiUrl.searchParams.set('query', query)
  apiUrl.searchParams.set('$titles', JSON.stringify(cardTitles))
  if (deckSlug) {
    apiUrl.searchParams.set('$deckSlug', `"${deckSlug}"`)
  }

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
    const results = (data.result || []).filter((v: {imageUrl?: string}) => v.imageUrl)

    return NextResponse.json(
      {cards: results},
      {headers: {'Cache-Control': 'public, max-age=3600, s-maxage=3600'}},
    )
  } catch (err) {
    console.error('Card art query error:', err)
    return NextResponse.json({error: 'Internal error'}, {status: 500})
  }
}
