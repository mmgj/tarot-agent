'use client'

import {useEffect, useRef, useState} from 'react'

// Phases the loader cycles through — gives a sense of life and progress
const PHASES = [
  'Consulting the cards…',
  'Shuffling the deck…',
  'Laying out the spread…',
  'Reading the symbols…',
  'Interpreting the patterns…',
  'Channeling insight…',
]

// After tool calls, show more specific messages
const TOOL_PHASES = [
  'Searching the archives…',
  'Cross-referencing the decks…',
  'Gathering the artwork…',
  'Studying the imagery…',
]

interface LoaderProps {
  /** Whether tool calls are in progress (shows different phase text) */
  hasToolCalls?: boolean
}

export function Loader({hasToolCalls = false}: LoaderProps) {
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [fade, setFade] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const phases = hasToolCalls ? TOOL_PHASES : PHASES

  useEffect(() => {
    // Cycle through phases every 2.5s with a fade transition
    intervalRef.current = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setPhaseIndex((i) => (i + 1) % phases.length)
        setFade(true)
      }, 300) // Brief fade-out before switching text
    }, 2500)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [phases])

  return (
    <div className="flex items-center gap-3 text-xs">
      {/* Pulsating orb */}
      <div className="relative flex h-5 w-5 items-center justify-center">
        <div className="loader-pulse absolute h-full w-full rounded-full bg-purple-500/20" />
        <div className="loader-pulse-inner h-2 w-2 rounded-full bg-purple-400" />
      </div>

      {/* Cycling status text */}
      <span
        className={`text-neutral-400 transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}
      >
        {phases[phaseIndex]}
      </span>
    </div>
  )
}
