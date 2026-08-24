import { useEffect, useState } from 'react'
import { useSpeech } from '../hooks/use-speech'
import { MicButton } from './MicButton'

type BeachPhase = 'wake' | 'crawl' | 'elly-appears' | 'ask-name' | 'name-accepted'

const CRAWL_GOAL = 6

export function BeachScene({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<BeachPhase>('wake')
  const [crawlProgress, setCrawlProgress] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const { supported, listening, transcript, error, listen, stop } = useSpeech()
  const canUseMic = supported && !error

  // Wake up after a moment
  useEffect(() => {
    if (phase === 'wake') {
      const t = setTimeout(() => setPhase('crawl'), 3200)
      return () => clearTimeout(t)
    }
  }, [phase])

  // Crawl with W / ArrowUp keys
  useEffect(() => {
    if (phase !== 'crawl') return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
        setCrawlProgress((p) => Math.min(p + 1, CRAWL_GOAL))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase])

  useEffect(() => {
    if (phase === 'crawl' && crawlProgress >= CRAWL_GOAL) {
      const t = setTimeout(() => setPhase('elly-appears'), 800)
      return () => clearTimeout(t)
    }
  }, [phase, crawlProgress])

  useEffect(() => {
    if (phase === 'elly-appears') {
      const t = setTimeout(() => setPhase('ask-name'), 4000)
      return () => clearTimeout(t)
    }
  }, [phase])

  // Check spoken name
  useEffect(() => {
    if (phase !== 'ask-name' || listening || !transcript) return
    const lower = transcript.toLowerCase()
    if (lower.includes('laith') || lower.includes('layth') || lower.includes('lace') || lower.includes('life')) {
      setFeedback(`"${transcript}" — أحسنت! إيلي تومئ برأسها.`)
      setPhase('name-accepted')
    } else {
      setFeedback(`سمعتُ: "${transcript}" — تكرر إيلي السؤال بلطف: "What's your name?"`)
    }
  }, [phase, listening, transcript])

  useEffect(() => {
    if (phase === 'name-accepted') {
      const t = setTimeout(onComplete, 4500)
      return () => clearTimeout(t)
    }
  }, [phase, onComplete])

  const submitTyped = () => {
    const lower = typed.toLowerCase()
    if (lower.includes('laith') || lower.includes('my name is')) {
      setFeedback('أحسنت! إيلي تومئ برأسها.')
      setPhase('name-accepted')
    } else {
      setFeedback('حاول كتابة: My name is Laith')
    }
  }

  const blurAmount =
    phase === 'wake' ? 'blur-lg' : phase === 'crawl' ? 'blur-[2px]' : 'blur-none'
  const showElly = phase === 'elly-appears' || phase === 'ask-name' || phase === 'name-accepted'

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black select-none">
      <img
        src={showElly ? '/scenes/elly.png' : '/scenes/beach.png'}
        alt={showElly ? 'إيلي تنظر إليك بقلق والشمس خلفها' : 'شاطئ رملي عند الفجر ورؤية ضبابية'}
        className={`h-full w-full object-cover ${showElly ? 'object-top' : ''} transition-all duration-1000 ${blurAmount}`}
        style={{ animation: 'kenBurns 20s ease-in-out infinite alternate' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40" />

      <div className="pointer-events-none absolute top-0 inset-x-0 h-10 md:h-16 bg-black" />
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-10 md:h-16 bg-black" />

      <div className="absolute bottom-14 md:bottom-24 inset-x-0 flex justify-center px-4">
        <div className="w-full max-w-3xl flex flex-col gap-4">
          {phase === 'wake' && (
            <div className="rounded-md border border-white/20 bg-black/70 backdrop-blur-sm px-5 py-4" style={{ animation: 'fadeInSlow 1s ease-out' }}>
              <p className="font-serif text-lg md:text-2xl leading-relaxed text-white">
                تفتح عينيك... كل شيء ضبابي. الرمال خشنة تحت أصابعك. الماء المالح في فمك.
              </p>
            </div>
          )}

          {phase === 'crawl' && (
            <div className="rounded-md border border-white/20 bg-black/70 backdrop-blur-sm px-5 py-4" style={{ animation: 'fadeInSlow 1s ease-out' }}>
              <p className="text-base md:text-lg leading-relaxed mb-3 text-white">
                {'جسدك ثقيل ومبلل. اضغط '}
                <kbd className="rounded bg-white/20 px-2 py-0.5 font-mono text-[#1CB0F6]">W</kbd>
                {' أو '}
                <kbd className="rounded bg-white/20 px-2 py-0.5 font-mono text-[#1CB0F6]">↑</kbd>
                {' بشكل متكرر للزحف إلى الأمام'}
              </p>
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full bg-[#1CB0F6] transition-all duration-300"
                    style={{ width: `${(crawlProgress / CRAWL_GOAL) * 100}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setCrawlProgress((p) => Math.min(p + 1, CRAWL_GOAL))}
                  className="rounded-md border border-[#1CB0F6]/50 px-4 py-1.5 text-sm hover:bg-[#1CB0F6]/20 transition-colors text-white"
                >
                  ازحف
                </button>
              </div>
            </div>
          )}

          {phase === 'elly-appears' && (
            <div className="rounded-md border border-white/20 bg-black/70 backdrop-blur-sm px-5 py-4" style={{ animation: 'fadeInSlow 1s ease-out' }}>
              <span className="inline-block mb-2 rounded-sm bg-[#58CC02] px-3 py-1 text-sm font-semibold text-white">
                إيلي
              </span>
              <p dir="ltr" className="text-left font-serif text-lg md:text-2xl leading-relaxed text-white">
                {'"Hey... stay with me. Please. What\'s your name?"'}
              </p>
              <p className="mt-2 text-sm text-white/60">
                مهلاً... تسمع خطوات تركض. فتاة تركع بجانبك، تلمس جبهتك بقلق.
              </p>
            </div>
          )}

          {phase === 'ask-name' && (
            <div className="rounded-md border border-[#1CB0F6]/40 bg-black/75 backdrop-blur-sm px-5 py-4 flex flex-col gap-3" style={{ animation: 'fadeInSlow 1s ease-out' }}>
              <p className="text-base md:text-lg leading-relaxed text-white">
                انطق اسمك بالإنجليزية في الميكروفون:
                <span dir="ltr" className="mx-2 font-serif text-[#1CB0F6]">{'"My name is Laith"'}</span>
              </p>
              {canUseMic ? (
                <div className="flex flex-wrap items-center gap-3">
                  <MicButton
                    listening={listening}
                    onStart={listen}
                    onStop={stop}
                    label={listening ? 'جارٍ الاستماع... اضغط للإيقاف' : 'اضغط وتكلم'}
                  />
                </div>
              ) : (
                <div dir="ltr" className="flex gap-2">
                  <input
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitTyped()
                    }}
                    placeholder="My name is Laith"
                    className="flex-1 rounded-md border border-white/20 bg-black/40 px-4 py-2 text-white placeholder:text-white/40 focus-visible:outline-2 focus-visible:outline-[#1CB0F6]"
                    aria-label="اكتب اسمك بالإنجليزية"
                  />
                  <button
                    type="button"
                    onClick={submitTyped}
                    className="rounded-md bg-[#1CB0F6] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                  >
                    إرسال
                  </button>
                </div>
              )}
              {error && (
                <p className="text-sm text-white/60">
                  تعذر استخدام الميكروفون — اكتب اسمك بدلاً من ذلك.
                </p>
              )}
              {feedback && <p className="text-sm text-white/80">{feedback}</p>}
            </div>
          )}

          {phase === 'name-accepted' && (
            <div className="rounded-md border border-white/20 bg-black/70 backdrop-blur-sm px-5 py-4" style={{ animation: 'fadeInSlow 1s ease-out' }}>
              <span className="inline-block mb-2 rounded-sm bg-[#58CC02] px-3 py-1 text-sm font-semibold text-white">
                إيلي
              </span>
              <p dir="ltr" className="text-left font-serif text-lg md:text-2xl leading-relaxed text-white">
                {'"Okay, Laith. I\'m Elly. Let\'s get you inside."'}
              </p>
              <p className="mt-2 text-sm text-white/60">تساعدك على الوقوف...</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes kenBurns {
          0% { transform: scale(1); }
          100% { transform: scale(1.08); }
        }
        @keyframes fadeInSlow {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
