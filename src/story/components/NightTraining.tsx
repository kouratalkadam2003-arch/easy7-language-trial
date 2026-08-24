import { useEffect, useState } from 'react'
import { Ear, Lightbulb, Repeat2, Volume2 } from 'lucide-react'
import { useSpeech } from '../hooks/use-speech'
import { MicButton } from './MicButton'
import { EnglishText } from './EnglishText'
import { speakEnglish, useLearning } from '../learning-context'
import type { TrainingSet } from '../vocab'

type DrillPhase = 'repeat' | 'imagine' | 'swap'
type ScenePhase = 'intro' | 'drill' | 'outro'

const PHASE_META: Record<DrillPhase, { label: string; icon: typeof Ear; instructionAr: string }> = {
  repeat: {
    label: 'كرِّر',
    icon: Repeat2,
    instructionAr: 'استمع للجملة ثم كررها — بالصوت أو الكتابة.',
  },
  imagine: {
    label: 'تخيَّل',
    icon: Lightbulb,
    instructionAr: 'عِش الموقف... ثم قل الجملة المناسبة بالإنجليزية.',
  },
  swap: {
    label: 'بدِّل',
    icon: Ear,
    instructionAr: 'غيّر كلمة واحدة لتصنع جملة جديدة بنفسك.',
  },
}

export function NightTraining({
  training,
  onComplete,
}: {
  training: TrainingSet
  onComplete: () => void
}) {
  const [scenePhase, setScenePhase] = useState<ScenePhase>('intro')
  const [sentenceIndex, setSentenceIndex] = useState(0)
  const [drillPhase, setDrillPhase] = useState<DrillPhase>('repeat')
  const [typed, setTyped] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [passed, setPassed] = useState(false)
  const { supported, listening, transcript, error, listen, stop, setTranscript } = useSpeech()
  const { trackPhraseByText } = useLearning()
  const canUseMic = supported && !error

  const sentence = training.sentences[sentenceIndex]
  const meta = PHASE_META[drillPhase]
  const PhaseIcon = meta.icon

  const check = (raw: string) => {
    const text = raw.trim().toLowerCase()
    if (!text || passed) return
    let ok = false
    if (drillPhase === 'swap') {
      ok = text.includes(sentence.swap.replacement.toLowerCase())
    } else {
      ok = sentence.accepts.some((k) => text.includes(k))
    }
    if (ok) {
      setPassed(true)
      setFeedback(
        drillPhase === 'swap'
          ? `ممتاز! "${sentence.swap.result}" — إيلي تصفق لك: "You made a NEW sentence, Laith!"`
          : 'أحسنت! إيلي تومئ برأسها بفخر.',
      )
    } else {
      setFeedback(
        `سمعتُ: "${raw.trim()}" — ليس بعد. ${
          drillPhase === 'swap'
            ? `تذكّر استخدام كلمة "${sentence.swap.replacement}"`
            : `الجملة: ${sentence.en}`
        }`,
      )
    }
    setTyped('')
  }

  // Speech result handling
  useEffect(() => {
    if (!listening && transcript && scenePhase === 'drill') {
      check(transcript)
      setTranscript('')
    }
  }, [listening, transcript, scenePhase, setTranscript])

  // Advance after passing a drill
  useEffect(() => {
    if (!passed) return
    const t = setTimeout(() => {
      setPassed(false)
      setFeedback(null)
      if (drillPhase === 'repeat') {
        setDrillPhase('imagine')
      } else if (drillPhase === 'imagine') {
        setDrillPhase('swap')
      } else {
        // mastered sentence
        trackPhraseByText(sentence.en)
        if (sentenceIndex >= training.sentences.length - 1) {
          setScenePhase('outro')
        } else {
          setSentenceIndex((i) => i + 1)
          setDrillPhase('repeat')
        }
      }
    }, 2000)
    return () => clearTimeout(t)
  }, [passed, drillPhase, sentenceIndex, sentence, training.sentences.length, trackPhraseByText])

  const totalDrills = training.sentences.length * 3
  const doneDrills =
    sentenceIndex * 3 + (drillPhase === 'repeat' ? 0 : drillPhase === 'imagine' ? 1 : 2)
  const progress = scenePhase === 'outro' ? 100 : (doneDrills / totalDrills) * 100

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black select-none">
      <img
        src="/scenes/cabin-night.png"
        alt="الكوخ ليلاً على ضوء الفانوس، إيلي تجلس إلى الطاولة مع أوراق التدريب"
        className="h-full w-full object-cover"
        style={{ animation: 'kenBurns 20s ease-in-out infinite alternate' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/60" />

      <div className="pointer-events-none absolute top-0 inset-x-0 h-10 md:h-16 bg-black" />
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-2 bg-black" />

      {/* Header: title + progress */}
      <div className="absolute top-12 md:top-20 inset-x-0 flex justify-center px-4">
        <div className="flex items-center gap-3 rounded-full border border-white/20 bg-black/60 backdrop-blur-sm px-4 py-2">
          <span className="text-xs md:text-sm text-white/50">تدريب الليل مع إيلي</span>
          <div className="h-1.5 w-28 md:w-40 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-[#1CB0F6] transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 md:bottom-14 inset-x-0 flex justify-center px-4">
        <div className="w-full max-w-3xl flex flex-col gap-3">
          {scenePhase === 'intro' && (
            <div className="rounded-md border border-white/20 bg-black/75 backdrop-blur-sm px-5 py-4 flex flex-col gap-3">
              <span className="self-start rounded-sm bg-[#58CC02] px-3 py-1 text-sm font-semibold text-white">
                إيلي
              </span>
              <p dir="ltr" className="text-left font-serif text-lg md:text-2xl leading-relaxed text-white">
                <EnglishText text={training.introEn} />
              </p>
              <p className="text-sm text-white/60">{training.introAr}</p>
              <button
                type="button"
                onClick={() => setScenePhase('drill')}
                className="self-center rounded-md bg-[#1CB0F6] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                ابدأ التدريب
              </button>
            </div>
          )}

          {scenePhase === 'drill' && (
            <>
              {/* Drill card */}
              <div className="rounded-md border border-white/20 bg-black/75 backdrop-blur-sm px-5 py-4 flex flex-col gap-3">
                <div className="flex items-between justify-between w-full">
                  <span className="flex items-center gap-2 rounded-sm bg-[#1CB0F6]/90 px-3 py-1 text-sm font-semibold text-white">
                    <PhaseIcon className="size-4" />
                    {meta.label}
                  </span>
                  <span className="text-xs text-white/60">
                    جملة {sentenceIndex + 1} من {training.sentences.length}
                  </span>
                </div>

                {drillPhase === 'repeat' && (
                  <>
                    <div className="flex items-center gap-3 w-full" dir="ltr">
                      <button
                        type="button"
                        onClick={() => speakEnglish(sentence.en)}
                        className="rounded-full border border-[#1CB0F6]/50 p-2.5 text-[#1CB0F6] hover:bg-[#1CB0F6]/20 transition-colors"
                        aria-label="استمع للجملة"
                      >
                        <Volume2 className="size-5" />
                      </button>
                      <p className="font-serif text-xl md:text-3xl text-left leading-relaxed text-white flex-1">
                        <EnglishText text={sentence.en} />
                      </p>
                    </div>
                    <p className="text-sm text-white/60">
                      {sentence.ar} — {meta.instructionAr}
                    </p>
                  </>
                )}

                {drillPhase === 'imagine' && (
                  <>
                    <p className="text-base md:text-lg leading-relaxed text-white">{sentence.imagineAr}</p>
                    <p className="text-sm text-white/60">{meta.instructionAr}</p>
                  </>
                )}

                {drillPhase === 'swap' && (
                  <>
                    <p dir="ltr" className="font-serif text-xl md:text-3xl text-left leading-relaxed text-white">
                      {sentence.swap.base.split(sentence.swap.target).map((part, i, arr) => (
                        <span key={i}>
                          {part}
                          {i < arr.length - 1 && (
                            <span className="rounded-sm bg-red-500/30 px-1.5 text-red-400 line-through decoration-2">
                              {sentence.swap.target}
                            </span>
                          )}
                        </span>
                      ))}
                    </p>
                    <p className="text-base leading-relaxed text-white">{sentence.swap.promptAr}</p>
                  </>
                )}
              </div>

              {/* Input */}
              {!passed && (
                <div className="rounded-md border border-[#1CB0F6]/40 bg-black/75 backdrop-blur-sm px-5 py-4 flex flex-wrap items-center gap-2" dir="ltr">
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
                      if (e.key === 'Enter') check(typed)
                    }}
                    placeholder="Speak or type in English..."
                    className="flex-1 min-w-40 rounded-full border border-white/20 bg-black/40 px-5 py-2.5 text-white placeholder:text-white/40 focus-visible:outline-2 focus-visible:outline-[#1CB0F6]"
                    aria-label="أجب بالإنجليزية"
                  />
                  <button
                    type="button"
                    onClick={() => check(typed)}
                    disabled={!typed.trim()}
                    className="rounded-full bg-[#1CB0F6] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    قل
                  </button>
                </div>
              )}

              {feedback && (
                <p
                  className={`rounded-md border px-4 py-2.5 text-sm backdrop-blur-sm ${
                    passed
                      ? 'border-[#1CB0F6]/50 bg-[#1CB0F6]/15 text-white'
                      : 'border-white/20 bg-black/60 text-white/60'
                  }`}
                >
                  {feedback}
                </p>
              )}
            </>
          )}

          {scenePhase === 'outro' && (
            <div className="rounded-md border border-[#1CB0F6]/40 bg-black/75 backdrop-blur-sm px-5 py-4 flex flex-col gap-3">
              <span className="self-start rounded-sm bg-[#58CC02] px-3 py-1 text-sm font-semibold text-white">
                إيلي
              </span>
              <p dir="ltr" className="text-left font-serif text-lg md:text-2xl leading-relaxed text-white">
                <EnglishText text={training.outroEn} />
              </p>
              <p className="text-sm text-white/60">{training.outroAr}</p>
              <p className="text-sm text-[#1CB0F6]">
                أتقنت {training.sentences.length} جمل — أُضيفت إلى دفتر ليث للمراجعة.
              </p>
              <button
                type="button"
                onClick={onComplete}
                className="self-center rounded-md bg-[#1CB0F6] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                تابع القصة
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes kenBurns {
          0% { transform: scale(1); }
          100% { transform: scale(1.08); }
        }
      `}</style>
    </div>
  )
}
