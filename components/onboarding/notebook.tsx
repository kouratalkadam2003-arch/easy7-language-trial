'use client'

import { useState } from 'react'
import { BookOpen, Check, Clock, Volume2, X } from 'lucide-react'
import { speakEnglish, useLearning, type SessionCard } from '@/lib/game/learning-context'
import type { Rating } from '@/lib/learning/srs'

const TIER_LABEL: Record<string, string> = {
  core: 'أساسية',
  medium: 'متوسطة',
  secondary: 'إثرائية',
}

/** Floating notebook button + SRS review overlay ("دفتر ليث") */
export function Notebook() {
  const { words, reviews, due, buildReviewSession, answerCard, notebookOpen, setNotebookOpen } =
    useLearning()
  const [tab, setTab] = useState<'cards' | 'words'>('cards')
  const [session, setSession] = useState<SessionCard[] | null>(null)
  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [sessionDone, setSessionDone] = useState(false)

  const totalItems = words.length + reviews.length

  if (!notebookOpen) {
    return (
      <button
        type="button"
        onClick={() => setNotebookOpen(true)}
        className="fixed top-12 md:top-20 right-3 md:right-5 z-40 flex items-center gap-2 rounded-full border border-border bg-black text-white/70 backdrop-blur-sm px-3.5 py-2 text-xs md:text-sm text-white/70 hover:text-primary hover:border-primary/60 transition-colors"
        aria-label="افتح دفتر ليث"
      >
        <BookOpen className="size-4" />
        دفتر ليث
        {due > 0 ? (
          <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
            {due} للمراجعة
          </span>
        ) : totalItems > 0 ? (
          <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-white/70">
            {totalItems}
          </span>
        ) : null}
      </button>
    )
  }

  const startSession = () => {
    const cards = buildReviewSession()
    setSession(cards)
    setCardIndex(0)
    setFlipped(false)
    setSessionDone(cards.length === 0)
  }

  const answer = (rating: Rating) => {
    if (!session) return
    try {
      answerCard(session[cardIndex].phrase.id, rating)
    } catch (err) {
      console.error('Error answering card:', err)
      // صمت الخطأ للمتابعة للبطاقة التالية
    }
    
    if (cardIndex >= session.length - 1) {
      setSessionDone(true)
    } else {
      setCardIndex((i) => i + 1)
      setFlipped(false)
    }
  }

  const closeNotebook = () => {
    setNotebookOpen(false)
    setSession(null)
    setSessionDone(false)
  }

  const card = session?.[cardIndex]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white/80 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-label="دفتر ليث — المراجعة"
    >
      <div className="w-full max-w-xl rounded-lg border border-border bg-card p-5 md:p-6 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-serif text-xl md:text-2xl text-primary">
            <BookOpen className="size-5" />
            دفتر ليث
          </h2>
          <button
            type="button"
            onClick={closeNotebook}
            className="rounded-full p-1.5 text-white/70 hover:text-white hover:bg-secondary transition-colors"
            aria-label="أغلق الدفتر"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab('cards')}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              tab === 'cards'
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'border border-border text-white/70 hover:text-white'
            }`}
          >
            المراجعة ({reviews.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('words')}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              tab === 'words'
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'border border-border text-white/70 hover:text-white'
            }`}
          >
            الكلمات ({words.length})
          </button>
        </div>

        {tab === 'cards' &&
          (reviews.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/70 leading-relaxed">
              لا توجد بطاقات بعد. أكمل تدريب الليل مع إيلي لتُضاف الجمل التي أتقنتها هنا.
            </p>
          ) : !session ? (
            /* Session start screen */
            <div className="flex flex-col items-center gap-4 py-8">
              <Clock className="size-8 text-primary" />
              {due > 0 ? (
                <>
                  <p className="text-center text-sm leading-relaxed">
                    لديك <span className="font-bold text-primary">{due}</span> بطاقة مستحقة
                    للمراجعة الآن.
                    <br />
                    <span className="text-white/70 text-xs">
                      الجمل الأساسية أولاً — بحد أقصى 12 بطاقة في الجلسة.
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={startSession}
                    className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    ابدأ جلسة المراجعة
                  </button>
                </>
              ) : (
                <p className="text-center text-sm text-white/70 leading-relaxed">
                  لا بطاقات مستحقة الآن — ذاكرتك محدّثة!
                  <br />
                  عد لاحقاً؛ الفواصل تتباعد كلما نجحت.
                </p>
              )}
            </div>
          ) : sessionDone ? (
            /* Session complete */
            <div className="flex flex-col items-center gap-4 py-8">
              <Check className="size-8 text-primary" />
              <p className="text-center text-sm leading-relaxed">
                انتهت الجلسة! البطاقات الناجحة ستعود بعد فترة أطول،
                <br />
                والصعبة ستعود قريباً.
              </p>
              <button
                type="button"
                onClick={closeNotebook}
                className="rounded-full border border-border px-6 py-2.5 text-sm text-white/70 hover:text-white transition-colors"
              >
                عودة إلى القصة
              </button>
            </div>
          ) : card ? (
            /* Active review card */
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-white/70">
                <span>
                  بطاقة {cardIndex + 1} / {session.length}
                </span>
                <span className="rounded-full border border-border px-2 py-0.5">
                  {TIER_LABEL[card.phrase.tier]} · {card.phrase.cefr}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setFlipped((f) => !f)}
                className="min-h-40 rounded-lg border border-primary/40 bg-secondary/50 px-6 py-8 flex flex-col items-center justify-center gap-3 hover:border-primary transition-colors"
                aria-label={flipped ? 'أظهر الجملة الإنجليزية' : 'أظهر الترجمة'}
              >
                {flipped ? (
                  <p className="font-serif text-2xl md:text-3xl text-primary text-balance text-center">
                    {card.phrase.ar}
                  </p>
                ) : (
                  <p dir="ltr" className="font-serif text-2xl md:text-3xl text-balance text-center">
                    {card.phrase.en}
                  </p>
                )}
                <span className="text-xs text-white/70">
                  {flipped ? 'هل تذكرتها قبل الكشف؟' : 'تذكّر المعنى ثم اضغط للكشف'}
                </span>
              </button>

              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      speakEnglish(card.phrase.en)
                    } catch (e) {
                      console.error(e)
                    }
                  }}
                  className="rounded-full border border-primary/50 p-2 text-primary hover:bg-primary/20 transition-colors"
                  aria-label="استمع للجملة"
                >
                  <Volume2 className="size-4" />
                </button>
              </div>

              {/* Answer buttons — only after flipping */}
              {flipped && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => answer('again')}
                    className="rounded-md border border-destructive/50 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    نسيتها
                  </button>
                  <button
                    type="button"
                    onClick={() => answer('hard')}
                    className="rounded-md border border-orange-500/50 py-2.5 text-sm text-orange-500 hover:bg-orange-500/10 transition-colors"
                  >
                    صعب
                  </button>
                  <button
                    type="button"
                    onClick={() => answer('good')}
                    className="rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    جيد
                  </button>
                  <button
                    type="button"
                    onClick={() => answer('easy')}
                    className="rounded-md border border-emerald-500/50 py-2.5 text-sm font-semibold text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                  >
                    سهل
                  </button>
                </div>
              )}
            </div>
          ) : null)}

        {tab === 'words' &&
          (words.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/70 leading-relaxed">
              لا توجد كلمات بعد. اضغط على أي كلمة إنجليزية في الحوار أثناء اللعب لتُحفظ هنا.
            </p>
          ) : (
            <ul className="max-h-72 overflow-y-auto flex flex-col gap-1.5 pr-1">
              {words.map((w) => (
                <li
                  key={w.en}
                  className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-4 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => speakEnglish(w.en)}
                      className="text-white/70 hover:text-primary transition-colors"
                      aria-label={`استمع لكلمة ${w.en}`}
                    >
                      <Volume2 className="size-4" />
                    </button>
                    <span dir="ltr" className="font-serif text-lg">
                      {w.en}
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="text-sm text-primary">{w.ar}</span>
                    <span className="mx-2 text-xs text-white/70">{w.pron}</span>
                  </div>
                </li>
              ))}
            </ul>
          ))}
      </div>
    </div>
  )
}
