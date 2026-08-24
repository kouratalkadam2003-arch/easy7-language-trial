'use client'

import { useEffect, useRef, useState } from 'react'
import { Volume2 } from 'lucide-react'
import { DICTIONARY } from '@/lib/game/vocab'
import { speakEnglish, useLearning } from '@/lib/game/learning-context'

/**
 * Renders English text where every known word is clickable.
 * Clicking shows an inline translation tooltip (Arabic + pronunciation + audio)
 * and saves the word to Laith's notebook.
 */
export function EnglishText({ text, className }: { text: string; className?: string }) {
  const { addWord } = useLearning()
  const [active, setActive] = useState<string | null>(null)
  const containerRef = useRef<HTMLSpanElement>(null)

  // Close tooltip on outside click
  useEffect(() => {
    if (!active) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActive(null)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [active])

  const tokens = text.split(/(\s+)/)

  return (
    <span ref={containerRef} className={className}>
      {tokens.map((token, i) => {
        const clean = token.replace(/[^a-zA-Z']/g, '').toLowerCase()
        const entry = clean ? DICTIONARY[clean] : undefined
        if (!entry) return <span key={i}>{token}</span>

        const isActive = active === `${i}:${clean}`
        return (
          <span key={i} className="relative inline-block">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (isActive) {
                  setActive(null)
                } else {
                  setActive(`${i}:${clean}`)
                  addWord(clean)
                  speakEnglish(entry.en)
                }
              }}
              className={`rounded-sm underline decoration-dotted underline-offset-4 transition-colors ${
                isActive
                  ? 'bg-primary/25 text-primary decoration-primary'
                  : 'decoration-primary/50 hover:bg-primary/15 hover:text-primary'
              }`}
              aria-label={`ترجمة كلمة ${entry.en}`}
            >
              {token}
            </button>
            {isActive && (
              <span
                dir="rtl"
                className="absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-52 -translate-x-1/2 rounded-md border border-primary/40 bg-black text-white/95 px-3 py-2 text-sm shadow-lg animate-fade-in-slow"
                role="tooltip"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-primary">{entry.ar}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      speakEnglish(entry.en)
                    }}
                    className="text-white/70 hover:text-primary transition-colors"
                    aria-label="استمع للنطق"
                  >
                    <Volume2 className="size-4" />
                  </button>
                </span>
                <span className="mt-1 block text-xs text-white/70">
                  النطق: {entry.pron}
                </span>
                <span className="mt-1 block text-[10px] text-white/70/70">
                  أُضيفت إلى دفتر ليث
                </span>
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}
