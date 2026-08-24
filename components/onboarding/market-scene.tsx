'use client'

import { useEffect, useState } from 'react'
import { useSpeech } from '@/hooks/use-speech'
import { MicButton } from './mic-button'
import { EnglishText } from './english-text'

type MarketStep = {
  id: string
  bakerLine: string
  narration: string
  hint: string
  /** keywords — at least one must appear in the player's answer */
  accepts: string[]
  successNarration: string
}

const STEPS: MarketStep[] = [
  {
    id: 'greet',
    bakerLine: '"Welcome, young man! A fine morning, yes?"',
    narration: 'الخباز العجوز يبتسم لك من خلف كومة الخبز الطازج. حيِّه بالإنجليزية.',
    hint: '"Good morning"',
    accepts: ['good morning', 'hello', 'morning', 'hi '],
    successNarration: 'يضحك الخباز بدفء. بداية موفقة!',
  },
  {
    id: 'order',
    bakerLine: '"So, what can I get for you today?"',
    narration: 'حان وقت الطلب. اطلب الخبز بأدب.',
    hint: '"I want bread, please"',
    accepts: ['bread', 'loaf'],
    successNarration: 'يلتقط الخباز رغيفين ذهبيين ساخنين من الفرن.',
  },
  {
    id: 'pay',
    bakerLine: '"Two loaves! That will be three coins, please."',
    narration: 'تُخرج العملات التي أعطتك إياها إيلي. سلِّمها له.',
    hint: '"Here you are"',
    accepts: ['here you are', 'here you go', 'here', 'three coins', 'take'],
    successNarration: 'يأخذ العملات ويضع الخبز في قماش نظيف.',
  },
  {
    id: 'thanks',
    bakerLine: '"Anything else, friend?"',
    narration: 'اشكره وودّعه.',
    hint: '"No, thank you. Goodbye!"',
    accepts: ['thank', 'goodbye', 'bye', 'no,'],
    successNarration: '"Come back soon!" يلوّح لك الخباز... أتممت أول حديث كامل بالإنجليزية وحدك.',
  },
]

export function MarketScene({ onComplete }: { onComplete: () => void }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [passed, setPassed] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const [finished, setFinished] = useState(false)
  const { supported, listening, transcript, error, listen, stop, setTranscript } = useSpeech()
  const canUseMic = supported && !error

  const step = STEPS[stepIndex]

  const check = (raw: string) => {
    const text = raw.trim().toLowerCase()
    if (!text) return
    const ok = step.accepts.some((k) => text.includes(k))
    if (ok) {
      setFeedback(step.successNarration)
      setPassed(true)
    } else {
      setFeedback(`سمعتُ: "${raw.trim()}" — يميل الخباز برأسه محتاراً. جرّب: ${step.hint}`)
    }
    setTyped('')
  }

  // When speech recognition finishes, check the transcript
  useEffect(() => {
    if (!listening && transcript && !passed && !finished) {
      check(transcript)
      setTranscript('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening, transcript])

  // Advance to next step after success
  useEffect(() => {
    if (!passed) return
    const t = setTimeout(() => {
      if (stepIndex >= STEPS.length - 1) {
        setFinished(true)
      } else {
        setStepIndex((i) => i + 1)
        setPassed(false)
        setFeedback(null)
      }
    }, 2200)
    return () => clearTimeout(t)
  }, [passed, stepIndex])

  useEffect(() => {
    if (finished) {
      const t = setTimeout(onComplete, 3500)
      return () => clearTimeout(t)
    }
  }, [finished, onComplete])

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black text-white select-none">
      <img
        src="/scenes/market.png"
        alt="خباز عجوز ودود خلف طاولة خشبية مليئة بأرغفة الخبز الطازج"
        className="h-full w-full object-cover animate-ken-burns"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/50" />

      <div className="pointer-events-none absolute top-0 inset-x-0 h-10 md:h-16 bg-black text-white" />
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-2 bg-black text-white" />

      {/* Progress dots */}
      <div className="absolute top-12 md:top-20 inset-x-0 flex justify-center">
        <div className="flex items-center gap-2 rounded-full border border-border bg-black text-white/70 backdrop-blur-sm px-4 py-2">
          <span className="text-xs text-white/70 ml-1">محادثة الخباز</span>
          {STEPS.map((s, i) => (
            <span
              key={s.id}
              className={`size-2 rounded-full transition-colors ${
                i < stepIndex || finished
                  ? 'bg-primary'
                  : i === stepIndex
                    ? 'bg-primary/50 animate-pulse'
                    : 'bg-secondary'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 md:bottom-14 inset-x-0 flex justify-center px-4">
        <div className="w-full max-w-3xl flex flex-col gap-3">
          {finished ? (
            <div className="rounded-md border border-primary/40 bg-black text-white/75 backdrop-blur-sm px-5 py-4 animate-fade-in-slow">
              <span className="inline-block mb-2 rounded-sm bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">
                إيلي
              </span>
              <p dir="ltr" className="text-left font-serif text-lg md:text-2xl leading-relaxed">
                {'"Laith! You did it! You spoke like a real villager!"'}
              </p>
              <p className="mt-2 text-sm text-white/70">
                تركض إيلي نحوك فخورة... لكن عينيك تعلقان بشيء على لوحة الإعلانات خلفها.
              </p>
            </div>
          ) : (
            <>
              {/* Baker's line */}
              <div className="rounded-md border border-border bg-black text-white/70 backdrop-blur-sm px-5 py-4 animate-fade-in-slow">
                <span className="inline-block mb-2 rounded-sm bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">
                  الخباز
                </span>
                <p dir="ltr" className="text-left font-serif text-lg md:text-2xl leading-relaxed">
                  <EnglishText text={step.bakerLine} />
                </p>
                <p className="mt-2 text-sm text-white/70">{step.narration}</p>
              </div>

              {/* Player input */}
              {!passed && (
                <div className="rounded-md border border-primary/40 bg-black text-white/75 backdrop-blur-sm px-5 py-4 flex flex-col gap-3">
                  <p className="text-sm md:text-base leading-relaxed">
                    قل بالإنجليزية:
                    <span dir="ltr" className="mx-2 font-serif text-primary">
                      {step.hint}
                    </span>
                  </p>
                  <div className="flex flex-wrap items-center gap-2" dir="ltr">
                    {canUseMic && (
                      <MicButton
                        listening={listening}
                        onStart={listen}
                        onStop={stop}
                        label={listening ? '...' : ''}
                      />
                    )}
                    <input
                      value={typed}
                      onChange={(e) => setTyped(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                          check(typed)
                        }
                      }}
                      placeholder="Speak or type in English..."
                      className="flex-1 min-w-40 rounded-full border border-input bg-secondary px-5 py-2.5 text-white placeholder:text-white/70 focus-visible:outline-2 focus-visible:outline-primary"
                      aria-label="تحدث مع الخباز بالإنجليزية"
                    />
                    <button
                      type="button"
                      onClick={() => check(typed)}
                      disabled={!typed.trim()}
                      className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                      قل
                    </button>
                  </div>
                  {error && (
                    <p className="text-sm text-white/70">
                      تعذر استخدام الميكروفون — اكتب ردك بدلاً من ذلك.
                    </p>
                  )}
                </div>
              )}

              {feedback && (
                <p
                  className={`rounded-md border px-4 py-2.5 text-sm backdrop-blur-sm animate-fade-in-slow ${
                    passed
                      ? 'border-primary/50 bg-primary/15 text-white'
                      : 'border-border bg-black text-white/70 text-white/70'
                  }`}
                >
                  {feedback}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
