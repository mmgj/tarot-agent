'use client'

import {useSearchParams} from 'next/navigation'
import {Suspense, useCallback, useState} from 'react'

import {Chat} from '@/components/chat'
import {CardInfoPanel} from '@/components/CardInfoPanel'
import {type CachedCard} from '@/lib/card-cache'

function ChatPage() {
  const searchParams = useSearchParams()
  const debug = searchParams.get('debug') === 'true'

  // Top-level card selection state — shared between chat sidebar and info panel
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [spreadCards, setSpreadCards] = useState<CachedCard[]>([])

  const handleSelectCard = useCallback((title: string) => {
    setSelectedCard(title)
  }, [])

  const handleSpreadDealt = useCallback((cards: CachedCard[]) => {
    setSpreadCards(cards)
    // Auto-select the first card in the spread
    if (cards.length > 0) {
      setSelectedCard(cards[0].name)
    }
  }, [])

  return (
    <div className="flex h-dvh flex-col">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b border-[var(--border)] px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-950/60 text-lg">
          &#x2728;
        </div>
        <div>
          <h1 className="font-serif text-base font-semibold tracking-wide text-neutral-100">
            Tarot Agent
          </h1>
          <p className="text-xs text-neutral-500">Reader &middot; Scholar &middot; Guide</p>
        </div>
      </header>

      {/* Main content: chat sidebar + info panel */}
      <div className="flex min-h-0 flex-1">
        {/* Chat sidebar — 1/3 width on desktop, full width on mobile */}
        <div className="flex w-full flex-col border-r border-[var(--border)] md:w-1/3 md:min-w-[320px] md:max-w-[480px]">
          <Chat
            debug={debug}
            onSelectCard={handleSelectCard}
            onSpreadDealt={handleSpreadDealt}
          />
        </div>

        {/* Card info panel — 2/3 width on desktop, hidden on mobile (TODO: slide-over) */}
        <div className="hidden flex-1 md:flex">
          <CardInfoPanel
            selectedCard={selectedCard}
            spreadCards={spreadCards}
            onSelectCard={handleSelectCard}
          />
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ChatPage />
    </Suspense>
  )
}
