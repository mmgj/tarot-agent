'use client'

import {useSearchParams} from 'next/navigation'
import {Suspense} from 'react'

import {Chat} from '@/components/chat'

function ChatPage() {
  const searchParams = useSearchParams()
  const debug = searchParams.get('debug') === 'true'

  return (
    <main className="mx-auto flex h-dvh max-w-2xl flex-col">
      <header className="flex items-center gap-3 border-b border-neutral-800 px-4 py-3">
        <div className="text-2xl">&#x2728;</div>
        <div>
          <h1 className="text-sm font-medium text-neutral-100">Tarot Agent</h1>
          <p className="text-xs text-neutral-500">Ask me anything about the cards</p>
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
