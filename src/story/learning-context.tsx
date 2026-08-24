import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { DICTIONARY, type WordEntry } from './vocab'
import { getPhrase, PHRASES, type Phrase } from './phrases'
import {
  applyResult,
  buildSession,
  createReviewState,
  dueCount,
  type ReviewState,
} from './srs'
import { loadProgress, saveProgress } from './progress-store'

export type SessionCard = { state: ReviewState; phrase: Phrase }

type LearningState = {
  /** words the player tapped for translation */
  words: WordEntry[]
  addWord: (key: string) => void
  /** بدء تتبع عبارة (تُستدعى عند إتقانها في التدريب) — تنشئ بطاقة SRS */
  trackPhrase: (phraseId: string) => void
  /** تتبع عبارة بنصها الإنجليزي إن وُجدت في الكتالوج */
  trackPhraseByText: (en: string) => void
  /** كل حالات المراجعة */
  reviews: ReviewState[]
  /** عدد البطاقات المستحقة الآن */
  due: number
  /** بطاقات جلسة المراجعة الحالية (core أولاً، حد أقصى 12) */
  buildReviewSession: () => SessionCard[]
  /** تسجيل نتيجة بطاقة */
  answerCard: (phraseId: string, success: boolean) => void
  notebookOpen: boolean
  setNotebookOpen: (open: boolean) => void
}

const LearningContext = createContext<LearningState | null>(null)

export function LearningProvider({ children }: { children: ReactNode }) {
  const [wordKeys, setWordKeys] = useState<string[]>([])
  const [reviews, setReviews] = useState<ReviewState[]>([])
  const [notebookOpen, setNotebookOpen] = useState(false)
  const hydrated = useRef(false)

  // تحميل التقدم المحفوظ (متصفح فقط)
  useEffect(() => {
    const saved = loadProgress()
    if (saved.reviews.length > 0) setReviews(saved.reviews)
    if (saved.wordKeys.length > 0) setWordKeys(saved.wordKeys.filter((k) => DICTIONARY[k]))
    hydrated.current = true
  }, [])

  // حفظ عند كل تغيير (بعد التحميل الأولي)
  useEffect(() => {
    if (!hydrated.current) return
    saveProgress({ reviews, wordKeys, version: 1 })
  }, [reviews, wordKeys])

  const addWord = useCallback((key: string) => {
    const k = key.toLowerCase()
    if (!DICTIONARY[k]) return
    setWordKeys((prev) => (prev.includes(k) ? prev : [...prev, k]))
  }, [])

  const trackPhrase = useCallback((phraseId: string) => {
    const phrase = getPhrase(phraseId)
    if (!phrase) return
    setReviews((prev) =>
      prev.some((r) => r.phraseId === phraseId)
        ? prev
        : [...prev, createReviewState(phraseId, phrase.tier)],
    )
  }, [])

  const trackPhraseByText = useCallback(
    (en: string) => {
      const normalized = en.trim().toLowerCase().replace(/[.!?"]/g, '')
      const phrase = PHRASES.find(
        (p) => p.en.toLowerCase().replace(/[.!?"]/g, '') === normalized,
      )
      if (phrase) trackPhrase(phrase.id)
    },
    [trackPhrase],
  )

  const answerCard = useCallback((phraseId: string, success: boolean) => {
    setReviews((prev) =>
      prev.map((r) => (r.phraseId === phraseId ? applyResult(r, success) : r)),
    )
  }, [])

  const buildReviewSession = useCallback((): SessionCard[] => {
    return buildSession(reviews)
      .map((state) => {
        const phrase = getPhrase(state.phraseId)
        return phrase ? { state, phrase } : null
      })
      .filter((c): c is SessionCard => c !== null)
  }, [reviews])

  const value = useMemo<LearningState>(
    () => ({
      words: wordKeys.map((k) => DICTIONARY[k]),
      addWord,
      trackPhrase,
      trackPhraseByText,
      reviews,
      due: dueCount(reviews),
      buildReviewSession,
      answerCard,
      notebookOpen,
      setNotebookOpen,
    }),
    [
      wordKeys,
      addWord,
      trackPhrase,
      trackPhraseByText,
      reviews,
      buildReviewSession,
      answerCard,
      notebookOpen,
    ],
  )

  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>
}

export function useLearning() {
  const ctx = useContext(LearningContext)
  if (!ctx) throw new Error('useLearning must be used within LearningProvider')
  return ctx
}

/** Speak English text aloud using the browser's TTS */
export function speakEnglish(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.85
  window.speechSynthesis.speak(utterance)
}
