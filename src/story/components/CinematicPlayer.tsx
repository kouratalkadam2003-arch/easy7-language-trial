import { useCallback, useEffect, useMemo, useState } from 'react'
import { openingChapter, type CinematicStep, type DialogueLine } from '../script'

type Phase = { stepIndex: number; lineIndex: number; extraLines: DialogueLine[] | null }

function useTypewriter(text: string, speed = 38) {
  const [shown, setShown] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    setShown('')
    setDone(false)
    let i = 0
    const interval = setInterval(() => {
      i++
      setShown(text.slice(0, i))
      if (i >= text.length) {
        setDone(true)
        clearInterval(interval)
      }
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed])

  const skip = useCallback(() => {
    setShown(text)
    setDone(true)
  }, [text])

  return { shown, done, skip }
}

export function CinematicPlayer({
  onComplete,
  steps = openingChapter,
}: {
  onComplete: () => void
  steps?: CinematicStep[]
}) {
  const [phase, setPhase] = useState<Phase>({ stepIndex: 0, lineIndex: 0, extraLines: null })
  const [shaking, setShaking] = useState(false)

  const step = steps[phase.stepIndex]
  const lines = phase.extraLines ?? step.lines
  const line = lines[Math.min(phase.lineIndex, lines.length - 1)]
  const { shown, done, skip } = useTypewriter(line.text)

  const isLastLine = phase.lineIndex >= lines.length - 1
  const showChoices =
    done &&
    isLastLine &&
    phase.extraLines === null &&
    step.type === 'scene' &&
    step.choices !== undefined

  useEffect(() => {
    if (line.shake) {
      setShaking(true)
      const t = setTimeout(() => setShaking(false), 500)
      return () => clearTimeout(t)
    }
  }, [line])

  const advance = useCallback(() => {
    if (!done) {
      skip()
      return
    }
    if (showChoices) return

    if (!isLastLine) {
      setPhase((p) => ({ ...p, lineIndex: p.lineIndex + 1 }))
      return
    }
    // Move to next step
    if (phase.stepIndex >= steps.length - 1) {
      onComplete()
    } else {
      setPhase({ stepIndex: phase.stepIndex + 1, lineIndex: 0, extraLines: null })
    }
  }, [done, skip, showChoices, isLastLine, phase.stepIndex, onComplete, steps.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [advance])

  const chooseOption = (choiceId: string) => {
    if (step.type !== 'scene' || !step.choices) return
    const choice = step.choices.find((c) => c.id === choiceId)
    if (!choice) return
    setPhase((p) => ({ ...p, lineIndex: 0, extraLines: choice.response }))
  }

  const progress = useMemo(
    () => ((phase.stepIndex + 1) / steps.length) * 100,
    [phase.stepIndex, steps.length],
  )

  return (
    <div
      className="relative h-dvh w-full overflow-hidden bg-black cursor-pointer select-none"
      onClick={advance}
      role="button"
      tabIndex={0}
      aria-label="اضغط للمتابعة"
    >
      {/* Skip button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onComplete();
        }}
        className="absolute top-14 left-4 z-50 rounded-xl bg-black/60 hover:bg-black/80 border border-white/20 px-3 py-1.5 text-xs text-white/90 font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1"
      >
        تخطي السيناريو ⏭️
      </button>
      {/* Scene background */}
      <div className={`absolute inset-0 ${shaking ? 'animate-camera-shake' : ''}`}>
        {step.type === 'scene' ? (
          <img
            key={step.image + phase.stepIndex}
            src={step.image}
            alt={step.alt}
            className="h-full w-full object-cover"
            style={{ animation: 'kenBurns 20s ease-in-out infinite alternate, fadeInSlow 1s ease-out' }}
          />
        ) : (
          <div className="h-full w-full bg-black" />
        )}
        {step.type === 'scene' && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/50" />
        )}
      </div>

      {/* Letterbox bars */}
      <div className="pointer-events-none absolute top-0 inset-x-0 h-10 md:h-16 bg-black" />
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-10 md:h-16 bg-black" />

      {/* Progress */}
      <div className="absolute top-10 md:top-16 inset-x-0 h-0.5 bg-black/40">
        <div
          className="h-full bg-[#1CB0F6]/70 transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Black-screen centered text */}
      {step.type === 'black' ? (
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <p
            key={phase.stepIndex}
            className="text-3xl md:text-5xl text-white/90 text-center leading-relaxed"
            style={{ fontFamily: 'serif', animation: 'fadeInSlow 1s ease-out' }}
          >
            {shown}
          </p>
        </div>
      ) : (
        /* Dialogue box */
        <div className="absolute bottom-14 md:bottom-24 inset-x-0 flex justify-center px-4">
          <div className="w-full max-w-3xl">
            {line.speaker && (
              <span className="inline-block mb-2 rounded-sm bg-[#1CB0F6]/90 px-3 py-1 text-sm font-semibold text-white">
                {line.speaker}
              </span>
            )}
            <div className="rounded-md border border-white/20 bg-black/70 backdrop-blur-sm px-5 py-4">
              <p
                dir={/[\u0600-\u06FF]/.test(line.text) ? 'rtl' : 'ltr'}
                className={`text-lg md:text-2xl leading-relaxed text-white ${
                  /[\u0600-\u06FF]/.test(line.text) ? '' : 'text-left'
                }`}
                style={{ fontFamily: 'serif' }}
              >
                {shown}
                {!done && <span className="text-[#1CB0F6] animate-pulse">|</span>}
              </p>
            </div>

            {/* Choices */}
            {showChoices && step.type === 'scene' && step.choices && (
              <div className="mt-4 grid gap-2" style={{ animation: 'fadeInSlow 0.5s ease-out' }}>
                {step.choices.map((choice, i) => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      chooseOption(choice.id)
                    }}
                    className="w-full rounded-md border border-[#1CB0F6]/40 bg-black/70 backdrop-blur-sm px-4 py-3 text-right text-base md:text-lg text-white transition-colors hover:bg-[#1CB0F6]/20 hover:border-[#1CB0F6]"
                  >
                    <span className="text-[#1CB0F6] ml-2">{i + 1}.</span>
                    {choice.label}
                  </button>
                ))}
              </div>
            )}

            {done && !showChoices && (
              <p className="mt-3 text-center text-xs text-white/50 animate-pulse">
                اضغط للمتابعة
              </p>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes kenBurns {
          0% { transform: scale(1); }
          100% { transform: scale(1.08); }
        }
        @keyframes fadeInSlow {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cameraShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px) translateY(2px); }
          50% { transform: translateX(5px) translateY(-2px); }
          75% { transform: translateX(-3px) translateY(1px); }
        }
        .animate-camera-shake {
          animation: cameraShake 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}
