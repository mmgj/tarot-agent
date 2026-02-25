'use client'

import {useSearchParams} from 'next/navigation'
import {Suspense} from 'react'

import {Chat} from '@/components/chat'

function ChatPage() {
  const searchParams = useSearchParams()
  const debug = searchParams.get('debug') === 'true'

  return (
    <main className="mx-auto flex h-dvh max-w-2xl flex-col">
      <header className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
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

      <Chat debug={debug} />
    </main>
  )
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ChatPage />
    </Suspense>
  )
}
