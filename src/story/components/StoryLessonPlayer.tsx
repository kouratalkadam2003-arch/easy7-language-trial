import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  BookOpen, Ear, Dumbbell, Repeat2, Radio, ShieldCheck, ChevronLeft, Volume2, Eye, EyeOff,
} from 'lucide-react'
import { loadStoryLesson, scenesByKind, phraseMap } from '../data/loader'
import type { StoryLessonDoc, StoryPhrase } from '../data/types'
import { speak, stopSpeaking, bcp47 } from '@/lib/tts'
import { useUserStore } from '@/store/userStore'

type StepId = 'opening' | 'mission' | 'learning' | 'guided' | 'transfer' | 'radio' | 'proof' | 'done'

interface Props {
  day: number
  onExit: () => void
  onNextDay?: (day: number) => void
}

const STEP_META: Record<StepId, { label: string; labelEn: string; icon: any; color: string }> = {
  opening: { label: 'المشهد', labelEn: 'Scene', icon: BookOpen, color: '#8B5CF6' },
  mission: { label: 'المهمة', labelEn: 'Mission', icon: BookOpen, color: '#0EA5E9' },
  learning: { label: 'الحوار', labelEn: 'Dialogue', icon: Ear, color: '#10B981' },
  guided: { label: 'تدريب', labelEn: 'Practice', icon: Dumbbell, color: '#EAB308' },
  transfer: { label: 'نقل المهارة', labelEn: 'Transfer', icon: Repeat2, color: '#F97316' },
  radio: { label: 'راديو', labelEn: 'Radio', icon: Radio, color: '#3B82F6' },
  proof: { label: 'الاختبار', labelEn: 'Proof', icon: ShieldCheck, color: '#EF4444' },
  done: { label: 'اكتمل', labelEn: 'Done', icon: ShieldCheck, color: '#58CC02' },
}

export default function StoryLessonPlayer({ day, onExit, onNextDay }: Props) {
  const { uiLang } = useUserStore()
  const isAr = uiLang === 'ar'
  const lang = useUserStore.getState().targetLanguage || 'en'

  const [doc, setDoc] = useState<StoryLessonDoc | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading')
  const [stepIdx, setStepIdx] = useState(0)

  useEffect(() => {
    let alive = true
    setState('loading')
    setStepIdx(0)
    loadStoryLesson(lang, day).then(d => {
      if (!alive) return
      if (d) { setDoc(d); setState('ready') } else { setState('missing') }
    })
    return () => { alive = true; stopSpeaking() }
  }, [lang, day])

  const s = useMemo(() => (doc ? scenesByKind(doc) : null), [doc])
  const pmap = useMemo(() => (doc ? phraseMap(doc) : null), [doc])

  // Build the step list dynamically from what the document actually has
  const steps: StepId[] = useMemo(() => {
    if (!s || !doc) return []
    const out: StepId[] = []
    const firstNarrative = s.narrative[0]
    if (firstNarrative) out.push('opening')
    out.push('learning')
    if (s.guided?.activities?.length) out.push('guided')
    if (s.transfer) out.push('transfer')
    if (s.radio && !s.radio.optional) out.push('radio')
    if (s.proof) out.push('proof')
    out.push('done')
    return out
  }, [s, doc])

  if (state === 'loading') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0b1020] z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/70" />
      </div>
    )
  }

  if (state === 'missing' || !doc || !s || !pmap) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black z-50" dir="rtl">
        <div className="text-center space-y-4 px-6">
          <div className="text-6xl">🗺️</div>
          <h1 className="text-xl font-black text-white">هذا الفصل من القصة لم يُكتشف بعد</h1>
          <p className="text-white/50 text-sm">تعذّر تحميل درس اليوم {day} للغة «{lang}».</p>
          <button onClick={onExit} className="px-6 py-3 rounded-2xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors">
            العودة
          </button>
        </div>
      </div>
    )
  }

  const step = steps[Math.min(stepIdx, steps.length - 1)]
  const meta = STEP_META[step]
  const md = doc.metadata

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#0b1020] via-[#101731] to-[#0b1020] text-white" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2 shrink-0">
        <button
          onClick={() => { stopSpeaking(); onExit() }}
          className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white/70"
          aria-label="خروج"
        >
          <ChevronLeft className="w-5 h-5 rotate-180" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-white/40 font-bold">{md.cefrLevel} · يوم {((day - 1) % 30) + 1}/30</div>
          <div className="font-black truncate">{isAr ? md.arabicTitle : md.englishTitle}</div>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5 px-4 pb-2 shrink-0">
        {steps.map((sid, i) => (
          <motion.div
            key={sid}
            animate={{ width: i === stepIdx ? 22 : 7, opacity: i > stepIdx ? 0.25 : 1 }}
            className="h-2 rounded-full"
            style={{ backgroundColor: i <= stepIdx ? STEP_META[sid].color : '#ffffff33' }}
          />
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step + String(stepIdx)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="max-w-xl mx-auto w-full"
          >
            {/* Step banner */}
            <div className="flex items-center gap-2 mb-4 mt-1">
              <span className="w-8 h-8 rounded-xl grid place-items-center" style={{ backgroundColor: meta.color + '33', color: meta.color }}>
                <meta.icon className="w-4 h-4" />
              </span>
              <h2 className="font-black text-lg">{isAr ? meta.label : meta.labelEn}</h2>
            </div>

            {step === 'opening' && (
              <NarrationStep
                lines={(s.narrative[0]?.lines ?? []).map(l => l.narrationArabic ?? '').filter(Boolean)}
                extra={doc.story.storyContextArabic}
              />
            )}

            {step === 'learning' && s.learning && (
              <LearningStep doc={doc} lines={s.learning.lines ?? []} pmap={pmap} isAr={isAr} lang={lang} />
            )}

            {step === 'guided' && s.guided && (
              <GuidedStep activities={s.guided.activities ?? []} pmap={pmap} lang={lang} />
            )}

            {step === 'transfer' && s.transfer && (
              <TransferStep scene={s.transfer} pmap={pmap} />
            )}

            {step === 'radio' && s.radio && (
              <RadioStep lines={s.radio.lines ?? []} lang={lang} spoiler={s.radio.spoilerSafe !== false} />
            )}

            {step === 'proof' && s.proof && (
              <ProofStep scene={s.proof} beforeAfter={s.proof.beforeAfter} />
            )}

            {step === 'done' && (
              <DoneStep
                doc={doc}
                onRestart={() => setStepIdx(0)}
                onNext={() => { stopSpeaking(); if (onNextDay) onNextDay(day + 1) }}
                hasNext={day < 180}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer nav */}
      <div className="p-3 border-t border-white/10 shrink-0">
        <div className="max-w-xl mx-auto flex gap-3">
          {stepIdx > 0 && (
            <button
              onClick={() => { stopSpeaking(); setStepIdx(i => i - 1) }}
              className="px-5 py-3 rounded-2xl bg-white/10 font-bold text-sm hover:bg-white/15 transition-colors"
            >
              السابق
            </button>
          )}
          <button
            onClick={() => { stopSpeaking(); setStepIdx(i => Math.min(steps.length - 1, i + 1)) }}
            disabled={stepIdx >= steps.length - 1}
            className="flex-1 py-3 rounded-2xl font-black text-sm bg-[#1CB0F6] text-white disabled:opacity-30 hover:bg-[#4cc2f7] transition-colors shadow-lg shadow-sky-500/20"
          >
            {stepIdx >= steps.length - 1 ? 'انتهى الدرس' : 'التالي'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Steps ---------- */

function NarrationStep({ lines, extra }: { lines: string[]; extra?: string }) {
  useEffect(() => () => stopSpeaking(), [])
  return (
    <div className="space-y-3">
      {lines.map((t, i) => (
        <motion.p
          key={i}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.35 }}
          className="text-base leading-loose text-white/85 bg-white/5 rounded-2xl p-4 border border-white/10"
        >
          {t}
        </motion.p>
      ))}
      {extra && (
        <p className="text-xs leading-relaxed text-white/45 bg-white/[0.03] rounded-xl p-3 border border-white/5">
          {extra}
        </p>
      )}
    </div>
  )
}

function LearningStep({ doc, lines, pmap, isAr, lang }: {
  doc: StoryLessonDoc
  lines: NonNullable<StoryLessonDoc['scenes'][number]['lines']>
  pmap: Map<string, StoryPhrase>
  isAr: boolean
  lang: string
}) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [playing, setPlaying] = useState<number | null>(null)
  useEffect(() => () => stopSpeaking(), [])

  const toggleReveal = (i: number) =>
    setRevealed(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n })

  const play = async (i: number, text: string) => {
    setPlaying(i)
    await speak(text, bcp47(lang))
    setPlaying(null)
  }

  const speakerName = (id?: string) =>
    id === 'laith' ? 'ليث' : id === 'elly' ? 'إيلي' : id ?? ''

  return (
    <div className="space-y-3">
      <p className="text-xs text-white/40 mb-1">{isAr ? doc.curriculum.languageObjectiveArabic : ''}</p>
      {lines.map((l, i) => {
        const phrase = l.phraseIds?.length ? pmap.get(l.phraseIds[0]) : undefined
        const shown = revealed.has(i)
        const core = phrase?.classification === 'core'
        return (
          <motion.div
            key={l.lineId ?? i}
            layout
            className={`rounded-2xl overflow-hidden border cursor-pointer select-none transition-colors ${core ? 'border-emerald-400/60' : 'border-white/10'} bg-white/5 hover:bg-white/10`}
            onClick={() => toggleReveal(i)}
          >
            <div className="flex items-center gap-3 p-3.5" dir="ltr">
              <button
                onClick={e => { e.stopPropagation(); l.targetText && play(i, l.targetText) }}
                className={`shrink-0 w-9 h-9 grid place-items-center rounded-full bg-white/10 hover:bg-[#1CB0F6]/30 transition-colors ${playing === i ? 'animate-pulse text-[#1CB0F6]' : 'text-white/70'}`}
                aria-label="تشغيل الصوت"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-white/35 font-bold mb-0.5" dir="rtl">
                  {speakerName(l.speakerId)}
                </div>
                <div className="font-bold text-[15px]" dir="ltr">{l.targetText}</div>
                {l.pronunciation && l.pronunciation !== l.targetText && (
                  <div className="text-xs text-white/40 italic" dir="ltr">{l.pronunciation}</div>
                )}
              </div>
              <div className="ms-auto shrink-0 text-white/40">
                {shown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </div>
            </div>
            <AnimatePresence>
              {shown && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-3.5 pt-1 bg-black/20 space-y-1" dir="rtl">
                    <div className="text-sm font-bold text-emerald-300">{l.arabicTranslation}</div>
                    {phrase?.transferContexts?.slice(0, 1).map((c, k) => (
                      <div key={k} className="text-[11px] text-white/45">💡 {c}</div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
      <p className="text-center text-[11px] text-white/30 pt-1">اضغط على البطاقة لكشف المعنى · زر السماع ينطق الجملة</p>
    </div>
  )
}

function GuidedStep({ activities, pmap, lang }: {
  activities: NonNullable<StoryLessonDoc['scenes'][number]['activities']>
  pmap: Map<string, StoryPhrase>
  lang: string
}) {
  const [done, setDone] = useState<Set<number>>(new Set())
  useEffect(() => () => stopSpeaking(), [])

  const LABELS: Record<string, string> = {
    listen_and_point: 'استمع وأشر',
    echo_then_hide: 'ردّد ثم اخفِ النص',
    meaning_match: 'طابق المعنى',
    context_change: 'غيّر السياق',
    argument_rebuild: 'أعد بناء الحوار',
  }
  const HINTS: Record<string, string> = {
    listen_and_point: 'شغّل صوت كل عبارة ثم اضغط «فهمتها».',
    echo_then_hide: 'ردّد العبارة بصوت عالٍ، ثم اضغط «فهمتها» لإخفائها تدريجياً.',
    meaning_match: 'اقرأ الترجمة أولاً وحاول استرجاع الجملة قبل كشفها.',
    context_change: 'استخدم العبارة في جملة جديدة من عندك.',
    argument_rebuild: 'أعد ترتيب الحوار ذهنياً ثم تحقق بالصوت.',
  }

  return (
    <div className="space-y-4">
      {activities.map((a, ai) => (
        <div key={ai} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-yellow-300">{LABELS[a.activityType] ?? a.activityType}</h3>
            <span className="text-[10px] text-white/35">{ai + 1}/{activities.length}</span>
          </div>
          <p className="text-xs text-white/45">{HINTS[a.activityType] ?? ''}</p>
          <div className="space-y-2">
            {a.phraseIds.map(pid => {
              const ph = pmap.get(pid)
              if (!ph) return null
              return (
                <div key={pid} className="flex items-center gap-2 rounded-xl bg-black/25 px-3 py-2.5" dir="ltr">
                  <button
                    onClick={() => speak(ph.text, bcp47(lang))}
                    className="shrink-0 w-8 h-8 grid place-items-center rounded-full bg-white/10 hover:bg-[#EAB308]/30 text-white/80 transition-colors"
                    aria-label="تشغيل"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold truncate" dir="ltr">{ph.text}</div>
                    <div className="text-[11px] text-white/45 truncate" dir="rtl">{ph.arabicTranslation}</div>
                  </div>
                  <button
                    onClick={() => setDone(prev => new Set(prev).add(ai))}
                    className={`shrink-0 text-[11px] font-black px-2.5 py-1.5 rounded-lg transition-colors ${done.has(ai) ? 'bg-green-500/90 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                  >
                    ✓ فهمتها
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function TransferStep({ scene, pmap }: { scene: NonNullable<StoryLessonDoc['scenes'][number]>; pmap: Map<string, StoryPhrase> }) {
  const required = scene.requiredPhraseIds?.map(id => pmap.get(id)).filter(Boolean) as StoryPhrase[] | undefined
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-orange-400/40 bg-orange-500/10 p-4">
        <p className="text-sm leading-relaxed text-orange-100">{scene.promptArabic}</p>
      </div>
      {required && required.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-white/50">عبارات مطلوبة في هذه المهمة:</p>
          {required.map(p => (
            <div key={p.phraseId} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2" dir="ltr">
              <div className="text-sm font-bold">{p.text}</div>
              <div className="text-[11px] text-white/45" dir="rtl">{p.arabicTranslation}</div>
            </div>
          ))}
        </div>
      )}
      <p className="text-[11px] text-white/35 leading-relaxed">تكلّم بصوت عالٍ أو اكتب إجابتك، وركّز على استخدام هذه العبارات في سياق حياتك أنت.</p>
    </div>
  )
}

function RadioStep({ lines, lang, spoiler }: { lines: StoryLessonDoc['scenes'][number]['lines']; lang: string; spoiler: boolean }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => () => stopSpeaking(), [])
  const line = lines?.[idx]
  if (!line) return <p className="text-white/50 text-sm">لا يوجد محتوى راديو لهذا اليوم.</p>
  const fullText = lines!.map(l => l.targetText ?? '').filter(Boolean).join(' ')
  return (
    <div className="space-y-4" dir="ltr">
      <div className="flex items-center justify-center gap-2 text-[11px] text-white/35">
        <Radio className="w-3.5 h-3.5" /> بثّ خفيف لتحسين الأذن {spoiler ? '· بدون حرق أحداث' : ''}
      </div>
      <div className="rounded-2xl border border-blue-400/30 bg-blue-500/10 p-5 min-h-28 grid place-items-center text-center">
        <p className="text-lg font-bold leading-relaxed">{line.targetText}</p>
      </div>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => line.targetText && speak(line.targetText, bcp47(lang), 0.85)}
          className="px-5 py-2.5 rounded-xl bg-[#3B82F6] text-white font-bold text-sm hover:brightness-110"
        >
          ▶ استمع
        </button>
        <button
          onClick={() => fullText && speak(fullText, bcp47(lang))}
          className="px-5 py-2.5 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/20"
        >
          ⏩ البث الكامل
        </button>
        <button
          onClick={() => setIdx(i => (i + 1) % lines!.length)}
          className="px-5 py-2.5 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/20"
        >
          التالي ↻
        </button>
      </div>
      {line.arabicTranslation && (
        <p className="text-center text-xs text-white/40" dir="rtl">{line.arabicTranslation}</p>
      )}
    </div>
  )
}

function ProofStep({ scene, beforeAfter }: {
  scene: NonNullable<StoryLessonDoc['scenes'][number]>
  beforeAfter?: { beforeArabic?: string; afterArabic?: string }
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 space-y-3">
        <h3 className="font-black text-red-200">🛡️ مهمة الإثبات</h3>
        <p className="text-sm leading-relaxed text-red-50/90">{scene.setupArabic}</p>
        {beforeAfter?.beforeArabic && (
          <div className="text-xs text-white/55 border-t border-white/10 pt-2">
            <b>قبل:</b> {beforeAfter.beforeArabic}
          </div>
        )}
        {beforeAfter?.afterArabic && (
          <div className="text-xs text-white/55">
            <b>بعد النجاح:</b> {beforeAfter.afterArabic}
          </div>
        )}
      </div>
      <ul className="text-xs text-white/50 space-y-1.5 list-disc ps-5">
        {scene.task?.disallowDirectAnswerOptions && <li>لا توجد خيارات جاهزة — صُغ إجابتك بنفسك (صوتاً أو كتابة).</li>}
        {(scene.task?.minimumResponseIdeas ?? 0) > 1 && <li>تحتاج فكرتين على الأقل في إجابتك.</li>}
        {scene.task?.requiredFunctions?.includes('polite_response') && <li>احرص على أسلوب مهذّب.</li>}
        {scene.retryPolicy && <li>{scene.retryPolicy}</li>}
      </ul>
    </div>
  )
}

function DoneStep({ doc, onRestart, onNext, hasNext }: {
  doc: StoryLessonDoc
  onRestart: () => void
  onNext: () => void
  hasNext: boolean
}) {
  const outcome = doc.story.narrativeOutcomeArabic
  const hook = doc.continuity?.nextLessonHookArabic
  return (
    <div className="space-y-5 text-center py-4">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 14 }} className="text-6xl">
        🏆
      </motion.div>
      <h3 className="text-xl font-black text-[#58CC02]">أحسنت! أكملت يوم القصة</h3>
      {outcome && <p className="text-sm leading-relaxed text-white/75 max-w-md mx-auto">{outcome}</p>}
      {hook && (
        <p className="text-xs text-white/45 max-w-md mx-auto bg-white/5 rounded-xl p-3 border border-white/10">
          🔮 {hook}
        </p>
      )}
      <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
        <button onClick={onNext} disabled={!hasNext} className="py-3.5 rounded-2xl font-black bg-[#58CC02] text-white disabled:opacity-40 hover:brightness-105 transition-all shadow-lg shadow-green-500/20">
          {hasNext ? 'يوم القصة التالي ←' : 'أنهيت الرحلة كاملة! 👑'}
        </button>
        <button onClick={onRestart} className="py-3 rounded-2xl bg-white/10 text-white/80 font-bold text-sm hover:bg-white/15">
          إعادة اليوم
        </button>
      </div>
    </div>
  )
}

