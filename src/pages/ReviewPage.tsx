import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Clock, 
  PlayCircle, 
  Flame, 
  Volume2, 
  X, 
  Sparkles, 
  Eye, 
  Zap,
  Castle
} from 'lucide-react'
import { Button3D } from '@/components/ui/Button3D'
import { useUserStore } from '@/store/userStore'
import { speak, bcp47 } from '@/lib/tts'
import GoblinFightGame, { ZombieFightStats } from '@/screens/ZombieFightGame'
import KnifeHitGame from '@/screens/KnifeHitGame'
import { ContextChangeGame } from '@/components/lesson/ContextChangeGame'
import { useReviewStore, ReviewCard, previewIntervalText, isErroneousEnglishCard } from '@/store/reviewStore'
import { useFarmStore } from '@/store/farmStore'
import KingdomApp from '@/kingdom/App'

function CountdownTimer({ targetTime }: { targetTime: number }) {
  const [timeLeft, setTimeLeft] = useState(targetTime - Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(targetTime - Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [targetTime])

  if (timeLeft <= 0) {
    return <span className="text-emerald-600 font-black animate-pulse">مستحقة للمراجعة الآن! 🔔</span>
  }

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

  const parts: string[] = []
  if (days > 0) parts.push(`${days} يوم`)
  if (hours > 0) parts.push(`${hours} ساعة`)
  if (minutes > 0) parts.push(`${minutes} دقيقة`)
  parts.push(`${seconds} ثانية`)

  return (
    <span className="font-mono text-blue-700 font-extrabold text-xs sm:text-sm" dir="rtl">
      ⏳ متبقي: {parts.join(' و ')}
    </span>
  )
}

const STARTER_CARDS_BY_LANG: Record<string, Array<{ id: string; native: string; translation: string; tier: 'core'; pronunciation?: string }>> = {
  de: [
    { id: 'starter_de_1', native: 'Hallo! Wie geht es dir?', translation: 'مرحباً! كيف حالك؟', tier: 'core', pronunciation: 'hah-loh vee gayt es deer' },
    { id: 'starter_de_2', native: 'Danke schön', translation: 'شكراً جزيلاً', tier: 'core', pronunciation: 'dahn-kuh shurn' },
    { id: 'starter_de_3', native: 'Guten Morgen', translation: 'صباح الخير', tier: 'core', pronunciation: 'goo-ten mor-gen' },
    { id: 'starter_de_4', native: 'Auf Wiedersehen', translation: 'إلى اللقاء', tier: 'core', pronunciation: 'owf vee-der-zayn' },
    { id: 'starter_de_5', native: 'Ich lerne Deutsch', translation: 'أنا أتعلم الألمانية', tier: 'core', pronunciation: 'ikh lair-nuh doytsh' },
  ],
  fr: [
    { id: 'starter_fr_1', native: 'Bonjour, comment allez-vous?', translation: 'مرحباً، كيف حالكم؟', tier: 'core', pronunciation: 'bon-zhoor koh-mohn tah-lay voo' },
    { id: 'starter_fr_2', native: 'Merci beaucoup', translation: 'شكراً جزيلاً', tier: 'core', pronunciation: 'mair-see boh-koo' },
    { id: 'starter_fr_3', native: 'Bonsoir', translation: 'مساء الخير', tier: 'core', pronunciation: 'bon-swahr' },
    { id: 'starter_fr_4', native: 'Au revoir', translation: 'إلى اللقاء', tier: 'core', pronunciation: 'oh ruh-vwahr' },
    { id: 'starter_fr_5', native: "J'apprends le français", translation: 'أنا أتعلم الفرنسية', tier: 'core', pronunciation: 'zhah-prahn luh frahn-seh' },
  ],
  es: [
    { id: 'starter_es_1', native: '¡Hola! ¿Cómo estás?', translation: 'مرحباً! كيف حالك؟', tier: 'core', pronunciation: 'oh-lah koh-moh es-tahs' },
    { id: 'starter_es_2', native: 'Muchas gracias', translation: 'شكراً جزيلاً', tier: 'core', pronunciation: 'moo-chahs grah-syahs' },
    { id: 'starter_es_3', native: 'Buenos días', translation: 'صباح الخير', tier: 'core', pronunciation: 'bway-nos dee-ahs' },
    { id: 'starter_es_4', native: 'Hasta luego', translation: 'أراك لاحقاً', tier: 'core', pronunciation: 'ahs-tah lway-goh' },
    { id: 'starter_es_5', native: 'Aprendo español', translation: 'أنا أتعلم الإسبانية', tier: 'core', pronunciation: 'ah-pren-doh es-pahn-yol' },
  ],
  it: [
    { id: 'starter_it_1', native: 'Ciao! Come stai?', translation: 'مرحباً! كيف حالك؟', tier: 'core', pronunciation: 'chow koh-may sty' },
    { id: 'starter_it_2', native: 'Grazie mille', translation: 'شكراً جزيلاً', tier: 'core', pronunciation: 'graht-syay meel-lay' },
    { id: 'starter_it_3', native: 'Buongiorno', translation: 'صباح الخير', tier: 'core', pronunciation: 'bwon-zhor-noh' },
    { id: 'starter_it_4', native: 'Arrivederci', translation: 'إلى اللقاء', tier: 'core', pronunciation: 'ah-ree-veh-dair-chee' },
    { id: 'starter_it_5', native: "Imparo l'italiano", translation: 'أنا أتعلم الإيطالية', tier: 'core', pronunciation: 'eem-pah-roh lee-tahl-yah-noh' },
  ],
  ja: [
    { id: 'starter_ja_1', native: 'Konnichiwa! Ogenki desu ka?', translation: 'مرحباً! كيف حالك؟', tier: 'core', pronunciation: 'kon-nee-chee-wah' },
    { id: 'starter_ja_2', native: 'Arigatou gozaimasu', translation: 'شكراً جزيلاً', tier: 'core', pronunciation: 'ah-ree-gah-toh' },
    { id: 'starter_ja_3', native: 'Ohayou gozaimasu', translation: 'صباح الخير', tier: 'core', pronunciation: 'oh-hah-yoh' },
    { id: 'starter_ja_4', native: 'Sayounara', translation: 'إلى اللقاء', tier: 'core', pronunciation: 'sah-yoh-nah-rah' },
    { id: 'starter_ja_5', native: 'Nihongo o benkyou shimasu', translation: 'أنا أتعلم اليابانية', tier: 'core', pronunciation: 'nee-hon-goh' },
  ],
  zh: [
    { id: 'starter_zh_1', native: 'Nǐ hǎo! Nǐ hǎo ma?', translation: 'مرحباً! كيف حالك؟', tier: 'core', pronunciation: 'nee how mah' },
    { id: 'starter_zh_2', native: 'Fēicháng gǎnxiè', translation: 'شكراً جزيلاً', tier: 'core', pronunciation: 'fay chahng gahn shyeh' },
    { id: 'starter_zh_3', native: 'Zǎoshang hǎo', translation: 'صباح الخير', tier: 'core', pronunciation: 'dzow shahng how' },
    { id: 'starter_zh_4', native: 'Zàijiàn', translation: 'إلى اللقاء', tier: 'core', pronunciation: 'dzye jyen' },
    { id: 'starter_zh_5', native: 'Wǒ zài xué Zhōngwén', translation: 'أنا أتعلم الصينية', tier: 'core', pronunciation: 'waw dzye shweh jong wen' },
  ],
  en: [
    { id: 'starter_en_1', native: 'Hello! How are you?', translation: 'مرحباً! كيف حالك؟', tier: 'core', pronunciation: 'hel-oh how ar yoo' },
    { id: 'starter_en_2', native: 'Thank you very much', translation: 'شكراً جزيلاً', tier: 'core', pronunciation: 'thank yoo veh-ree much' },
    { id: 'starter_en_3', native: 'Good morning', translation: 'صباح الخير', tier: 'core', pronunciation: 'good mor-ning' },
    { id: 'starter_en_4', native: 'Goodbye, see you later', translation: 'إلى اللقاء، أراك لاحقاً', tier: 'core', pronunciation: 'good-bye see yoo lay-ter' },
    { id: 'starter_en_5', native: 'I am learning English', translation: 'أنا أتعلم الإنجليزية', tier: 'core', pronunciation: 'eye am lur-ning ing-glish' },
  ],
};

type ReviewMode = 'flashcard' | 'siege' | 'zombie' | 'knife' | 'context'

export default function ReviewPage() {
  const navigate = useNavigate()
  const { uiLang, targetLanguage, gems } = useUserStore()
  const isAr = uiLang === 'ar'
  const { cards, updateCardReview, recordCardReview, getVitalityScore } = useReviewStore()

  // Selected review mode preference (defaults to siege: Castle & Zombie Defense)
  const [selectedReviewMode, setSelectedReviewMode] = useState<ReviewMode>('siege')

  // Purge any erroneous cards on mount
  useEffect(() => {
    useReviewStore.getState().purgeErroneousCards()
  }, [])

  // Active game overlay state
  const [activeReviewGame, setActiveReviewGame] = useState<'none' | 'siege' | 'zombie' | 'knife' | 'context'>('none')
  const [activeReviewCards, setActiveReviewCards] = useState<ReviewCard[]>([])
  const [gameReviewResult, setGameReviewResult] = useState<{ mode: string; total: number; easy: number; hard: number } | null>(null)

  // Active flashcard review session state
  const [sessionQueue, setSessionQueue] = useState<ReviewCard[] | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [reviewedStats, setReviewedStats] = useState({ remembered: 0, struggled: 0 })
  const [revealedListCardIds, setRevealedListCardIds] = useState<Set<string>>(new Set())

  const toggleListCardReveal = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setRevealedListCardIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const now = Date.now()
  const activeLang = (targetLanguage || (typeof window !== 'undefined' ? (localStorage.getItem('target_lang') || localStorage.getItem('easy7_target_language')) : '') || 'en').toLowerCase()
  
  // Strict isolation: only include cards explicitly matching the learner's chosen language,
  // and permanently exclude any English cards saved erroneously under German!
  const langCards = cards.filter(c => {
    if (!c.language || c.language.toLowerCase() !== activeLang) return false
    if (activeLang === 'de' && isErroneousEnglishCard(c.native)) return false
    return true
  })
  const dueCards = langCards.filter(c => c.nextReviewAt <= now)
  const upcomingCards = langCards.filter(c => c.nextReviewAt > now).sort((a, b) => a.nextReviewAt - b.nextReviewAt)

  // Auto-seed starter cards for active language if deck is empty for this language (never fallback to German)
  useEffect(() => {
    if (langCards.length === 0) {
      const starters = STARTER_CARDS_BY_LANG[activeLang] || []
      if (starters && starters.length > 0) {
        const cardsToAdd: ReviewCard[] = starters.map((s, idx) => ({
          id: `${activeLang}_${s.id}`,
          native: s.native,
          translation: s.translation,
          pronunciation: s.pronunciation,
          tier: 'core',
          addedAt: Date.now() - 3600000,
          nextReviewAt: Date.now() + (idx * 10 * 60 * 1000), // Stagger due dates
          intervalMinutes: 1440,
          language: activeLang,
        }))
        useReviewStore.getState().addCards(cardsToAdd)
      }
    }
  }, [activeLang, langCards.length])

  // Force re-render every minute so cards automatically move from upcoming to due
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(timer)
  }, [])

  // Start Flashcard session
  const startFlashcardSession = (cardsToReview: ReviewCard[]) => {
    if (!cardsToReview || cardsToReview.length === 0) return
    setSessionQueue([...cardsToReview])
    setCurrentIndex(0)
    setIsFlipped(false)
    setIsCompleted(false)
    setReviewedStats({ remembered: 0, struggled: 0 })
  }

  // Unified start review action based on selected mode
  const handleStartReview = (cardsToReview: ReviewCard[]) => {
    if (!cardsToReview || cardsToReview.length === 0) return
    setActiveReviewCards(cardsToReview)

    if (selectedReviewMode === 'flashcard') {
      startFlashcardSession(cardsToReview)
    } else if (selectedReviewMode === 'siege' || selectedReviewMode === 'zombie') {
      setActiveReviewGame('siege')
    } else if (selectedReviewMode === 'knife') {
      setActiveReviewGame('knife')
    } else if (selectedReviewMode === 'context') {
      setActiveReviewGame('context')
    }
  }

  // Flashcard answer handler (SM-2 powered with resource rewards)
  const currentCard = sessionQueue ? sessionQueue[currentIndex] : null

  const playCardAudio = (text: string) => {
    speak(text, bcp47(targetLanguage || 'en'), 0.9)
  }

  const handleAnswerCard = (difficulty: 'hard' | 'medium' | 'easy') => {
    if (!currentCard || !sessionQueue) return

    if (difficulty === 'hard') {
      // Hard: SM-2 Again (10 min interval), re-queue at end of session
      recordCardReview(currentCard.id, 'again')
      setReviewedStats(prev => ({ ...prev, struggled: prev.struggled + 1 }))
      setSessionQueue(prev => prev ? [...prev, currentCard] : [currentCard])
      setCurrentIndex(prev => prev + 1)
      setIsFlipped(false)
    } else if (difficulty === 'medium') {
      // Medium: SM-2 Hard (12h to 24h)
      recordCardReview(currentCard.id, 'hard')
      setReviewedStats(prev => ({ ...prev, remembered: prev.remembered + 1 }))
      if (currentIndex + 1 < sessionQueue.length) {
        setCurrentIndex(prev => prev + 1)
        setIsFlipped(false)
      } else {
        setIsCompleted(true)
      }
    } else {
      // Easy: SM-2 Good / Easy (3 to 7 days)
      recordCardReview(currentCard.id, 'good')
      setReviewedStats(prev => ({ ...prev, remembered: prev.remembered + 1 }))
      if (currentIndex + 1 < sessionQueue.length) {
        setCurrentIndex(prev => prev + 1)
        setIsFlipped(false)
      } else {
        setIsCompleted(true)
      }
    }
  }

  // Cards formatted for Zombie Fight with SRS metadata (Strictly for active language)
  const reviewCardsForZombie = useMemo(() => {
    const list = activeReviewCards.length > 0 ? activeReviewCards : dueCards.length > 0 ? dueCards : langCards
    return list.map((card, i) => ({
      id: card.id || String(i),
      character: '',
      originalText: card.native,
      translation: card.translation,
      romanization: card.pronunciation || '',
      translatedText: card.translation,
      nativeText: null,
      speechRate: 1,
      nextReviewTimestamp: card.nextReviewAt,
      status: 'new' as const,
      lapses: card.intervalMinutes <= 60 ? 1 : 0,
      ease: card.intervalMinutes > 1440 ? 3.0 : 2.5,
      tier: card.tier || 'core'
    }))
  }, [activeReviewCards, dueCards, langCards])

  // Cards formatted for Knife Hit with SRS metadata (Strictly for active language)
  const reviewCardsForKnife = useMemo(() => {
    const list = activeReviewCards.length > 0 ? activeReviewCards : dueCards.length > 0 ? dueCards : langCards
    return list.map((card, i) => ({
      id: card.id || String(i),
      character: '',
      originalText: card.native,
      translation: card.translation,
      romanization: card.pronunciation || '',
      tier: card.tier || 'core',
      lapses: card.intervalMinutes <= 60 ? 1 : 0,
      ease: card.intervalMinutes > 1440 ? 3.0 : 2.5,
      dueAt: card.nextReviewAt
    }))
  }, [activeReviewCards, dueCards, langCards])

  // Synthetic lesson for Context Change game (Strictly for active language)
  const syntheticLesson = useMemo(() => {
    const list = activeReviewCards.length > 0 ? activeReviewCards : dueCards.length > 0 ? dueCards : langCards
    return {
      id: 'review-lesson',
      title: isAr ? 'مراجعة السياق الذكية' : 'Context Review',
      lang: activeLang,
      level: 'A1',
      day: 1,
      dialogue: list.map(c => ({
        character: '',
        native: c.native,
        translation: c.translation,
        pronunciation: c.pronunciation || ''
      }))
    } as any
  }, [activeReviewCards, dueCards, cards, targetLanguage, isAr])

  // Game completion callbacks
  const handleFinishSiege = (stats?: { totalCards?: number; rememberedCount?: number; struggledCount?: number }) => {
    setActiveReviewGame('none')
    setGameReviewResult({
      mode: isAr ? 'حصار المملكة 🏰' : 'Siege Defense 🏰',
      total: stats?.totalCards || activeReviewCards.length,
      easy: stats?.rememberedCount || 0,
      hard: stats?.struggledCount || 0
    })
  }

  const handleFinishZombie = (stats?: ZombieFightStats) => {
    setActiveReviewGame('none')
    const mistakesSet = new Set((stats?.mistakes || []).map(m => m.trim().toLowerCase()))
    let easyCount = 0
    let hardCount = 0

    activeReviewCards.forEach(card => {
      const wasMistake = mistakesSet.has(card.native.trim().toLowerCase()) || mistakesSet.has(card.translation.trim().toLowerCase())
      if (wasMistake) {
        recordCardReview(card.id, 'again')
        hardCount++
      } else if (stats?.won) {
        recordCardReview(card.id, 'easy')
        easyCount++
      } else {
        recordCardReview(card.id, 'good')
        easyCount++
      }
    })

    setGameReviewResult({
      mode: isAr ? 'قتال الزومبي 🧟' : 'Zombie Fight 🧟',
      total: activeReviewCards.length,
      easy: easyCount,
      hard: hardCount
    })
  }

  const handleFinishKnife = (success: boolean) => {
    setActiveReviewGame('none')
    let easyCount = 0
    let hardCount = 0

    activeReviewCards.forEach((card, idx) => {
      if (success) {
        recordCardReview(card.id, 'good')
        easyCount++
      } else {
        if (idx < 2) {
          recordCardReview(card.id, 'good')
          easyCount++
        } else {
          recordCardReview(card.id, 'again')
          hardCount++
        }
      }
    })

    setGameReviewResult({
      mode: isAr ? 'رمي السكاكين 🎯' : 'Knife Hit 🎯',
      total: activeReviewCards.length,
      easy: easyCount,
      hard: hardCount
    })
  }

  const handleFinishContext = () => {
    setActiveReviewGame('none')
    activeReviewCards.forEach(card => {
      recordCardReview(card.id, 'good')
    })
    setGameReviewResult({
      mode: isAr ? 'تبديل السياق 🔄' : 'Context Change 🔄',
      total: activeReviewCards.length,
      easy: activeReviewCards.length,
      hard: 0
    })
  }

  const getModeLabel = () => {
    if (selectedReviewMode === 'siege') return isAr ? 'حصار المملكة 🏰' : 'Siege Defense 🏰'
    if (selectedReviewMode === 'zombie') return isAr ? 'معركة الزومبي 🧟' : 'Zombie Battle 🧟'
    if (selectedReviewMode === 'knife') return isAr ? 'تحدي السكاكين 🎯' : 'Knife Challenge 🎯'
    if (selectedReviewMode === 'context') return isAr ? 'تبديل السياق 🔄' : 'Context Shift 🔄'
    return isAr ? 'كروت الذاكرة 🃏' : 'Flashcards 🃏'
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8 min-h-screen">
      {/* Top Banner with Gems */}
      <div className="flex items-center justify-between bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 p-4 rounded-3xl shadow-lg border border-amber-400/50 text-slate-950">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/30 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner shrink-0">
            💎
          </div>
          <div>
            <div className="font-black text-white text-lg sm:text-xl flex items-center gap-1.5">
              <span>{gems ?? 120}</span>
              <span className="text-xs text-amber-100 font-bold">{isAr ? 'جوهرة (Gems)' : 'Gems'}</span>
            </div>
            <div className="text-xs text-amber-100 font-bold">
              {isAr ? 'رصيد الجواهر المكتسبة من إتقان المراجعة والدروس 🏆' : 'Earned Gems from Review & Lessons 🏆'}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center space-y-2">
        <div className="text-6xl mb-4 animate-bounce-soft">🃏</div>
        <h1 className="text-3xl font-black text-slate-800">{isAr ? 'المراجعة الذكية' : 'Smart Review'}</h1>
        <p className="text-slate-500 font-medium">
          {isAr ? 'نظام التكرار المتباعد التفاعلي عبر الكروت والألعاب لضمان عدم النسيان!' : 'Interactive spaced repetition via cards and games to ensure mastery!'}
        </p>
      </div>

      {langCards.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-200">
          <p className="text-lg font-bold text-slate-600 mb-2">
            {isAr ? 'لا توجد بطاقات مسجلة لهذه اللغة حالياً' : 'No cards saved for this language currently'}
          </p>
          <p className="text-sm text-slate-400">
            {isAr ? 'أكمل درسك الأول لتبدأ بإضافة العبارات إلى صندوق المراجعة والألعاب!' : 'Complete your first lesson to start reviewing with cards and games!'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick Action Bar to Start Reviewing */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-right">
              <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full inline-block">
                {isAr ? 'جلسة مراجعة ذكية' : 'Smart Review Session'}
              </span>
              <h3 className="text-lg font-black">
                {dueCards.length > 0 
                  ? (isAr ? `لديك ${dueCards.length} بطاقات مستحقة الآن!` : `You have ${dueCards.length} cards due now!`)
                  : (isAr ? `كل البطاقات (${langCards.length}) في جدولك الزمني` : `All ${langCards.length} cards in schedule`)}
              </h3>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              {dueCards.length > 0 ? (
                <Button3D
                  variant="primary"
                  size="md"
                  onClick={() => handleStartReview(dueCards)}
                  className="!bg-amber-500 hover:!bg-amber-600 !border-amber-700 !text-white flex-1 sm:flex-initial font-black cursor-pointer shadow-md"
                >
                  <Flame className="w-4 h-4 mr-1.5 inline" />
                  {isAr ? `بدء ${getModeLabel()} (${dueCards.length})` : `Start ${getModeLabel()} (${dueCards.length})`}
                </Button3D>
              ) : (
                <Button3D
                  variant="primary"
                  size="md"
                  onClick={() => handleStartReview(langCards)}
                  className="!bg-emerald-500 hover:!bg-emerald-600 !border-emerald-700 !text-white flex-1 sm:flex-initial font-black cursor-pointer shadow-md"
                >
                  <Zap className="w-4 h-4 mr-1.5 inline" />
                  {isAr ? `مراجعة مبكرة (${getModeLabel()})` : `Review Early (${getModeLabel()})`}
                </Button3D>
              )}
            </div>
          </div>

          {/* Memory Vitality & Stability Indicator */}
          <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-md border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl shrink-0">
                🌿
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-100">
                    {isAr ? 'حيوية الذاكرة واستقرار المملكة' : 'Memory Vitality & Realm Stability'}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                    SM-2
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isAr
                    ? 'كل مراجعة تروي ذاكرتك وتمنح موارد لترقية قريتك وصد غارات الأعداء 🏰'
                    : 'Every review strengthens memory and earns resources for your realm 🏰'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <div className="w-28 bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.round(getVitalityScore() * 100)}%` }}
                />
              </div>
              <span className="font-mono font-black text-sm text-emerald-400">
                {Math.round(getVitalityScore() * 100)}%
              </span>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              Review Mode Selector
             ───────────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-800">
                  {isAr ? 'اختر أسلوب المراجعة المفضل لديك:' : 'Choose your review style:'}
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                {isAr ? 'مدعوم بالـ SRS' : 'SRS Powered'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Kingdom & Zombie Siege Defense */}
              <button
                type="button"
                onClick={() => setSelectedReviewMode('siege')}
                className={`p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-center border-2 cursor-pointer ${
                  selectedReviewMode === 'siege' || selectedReviewMode === 'zombie'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm font-black ring-2 ring-amber-400/20'
                    : 'bg-slate-50 hover:bg-slate-100 border-transparent text-slate-600 font-bold'
                }`}
              >
                <span className="text-2xl">🏰🧟</span>
                <span className="text-xs">{isAr ? 'حصار المملكة والزومبي' : 'Kingdom & Zombie Siege'}</span>
                <span className="text-[10px] text-amber-700 bg-amber-100/90 px-1.5 py-0.5 rounded font-bold">
                  {isAr ? 'قرية ودفاع وقذائف 🏹' : 'Village & Arrows'}
                </span>
              </button>

              {/* Flashcards */}
              <button
                type="button"
                onClick={() => setSelectedReviewMode('flashcard')}
                className={`p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-center border-2 cursor-pointer ${
                  selectedReviewMode === 'flashcard'
                    ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-sm font-black'
                    : 'bg-slate-50 hover:bg-slate-100 border-transparent text-slate-600 font-bold'
                }`}
              >
                <span className="text-2xl">🃏</span>
                <span className="text-xs">{isAr ? 'كروت الذاكرة' : 'Flashcards'}</span>
                <span className="text-[10px] text-slate-400 font-medium">{isAr ? 'تقليب تفاعلي' : '3D Flip'}</span>
              </button>

              {/* Knife Hit */}
              <button
                type="button"
                onClick={() => setSelectedReviewMode('knife')}
                className={`p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-center border-2 cursor-pointer ${
                  selectedReviewMode === 'knife'
                    ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-sm font-black'
                    : 'bg-slate-50 hover:bg-slate-100 border-transparent text-slate-600 font-bold'
                }`}
              >
                <span className="text-2xl">🎯</span>
                <span className="text-xs">{isAr ? 'رمي السكاكين' : 'Knife Hit'}</span>
                <span className="text-[10px] text-slate-400 font-medium">{isAr ? 'سرعة وتصويب' : 'Arcade Reflex'}</span>
              </button>

              {/* Context Change */}
              <button
                type="button"
                onClick={() => setSelectedReviewMode('context')}
                className={`p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-center border-2 cursor-pointer ${
                  selectedReviewMode === 'context'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm font-black'
                    : 'bg-slate-50 hover:bg-slate-100 border-transparent text-slate-600 font-bold'
                }`}
              >
                <span className="text-2xl">🔄</span>
                <span className="text-xs">{isAr ? 'تبديل السياق' : 'Context Change'}</span>
                <span className="text-[10px] text-slate-400 font-medium">{isAr ? 'تركيب الجمل' : 'Grammar Shift'}</span>
              </button>
            </div>
          </div>

          {/* Due Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-6 h-6 text-red-500" />
                <h2 className="text-xl font-black text-slate-800">
                  {isAr ? 'عبارات مستحقة للمراجعة الآن' : 'Cards Due for Review Now'}
                </h2>
              </div>
              <span className="bg-red-100 text-red-700 font-black px-3 py-1 rounded-full text-xs">
                {dueCards.length} {isAr ? 'مستحقة' : 'due'}
              </span>
            </div>

            {dueCards.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-6 text-center text-slate-500 font-bold border border-slate-200/70">
                {isAr ? '✨ رائع! لا توجد عبارات متأخرة حالياً، جميع عباراتك في موعدها المحدد.' : 'Awesome! No overdue cards currently.'}
              </div>
            ) : (
              <div className="grid gap-3">
                {dueCards.map(card => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border-2 border-red-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>
                    <div className="flex-1" dir="ltr">
                      <p className="font-black text-lg text-slate-800">{card.native}</p>
                      {revealedListCardIds.has(card.id) ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <p className="text-sm font-bold text-slate-600 mt-0.5" dir={isAr ? 'rtl' : 'ltr'}>{card.translation}</p>
                          {card.pronunciation && (
                            <p className="text-xs font-mono text-slate-400 mt-1" dir="rtl">🗣️ {card.pronunciation}</p>
                          )}
                        </motion.div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => toggleListCardReveal(card.id, e)}
                          className="text-xs font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1 mt-1 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isAr ? 'كشف الترجمة 👁️' : 'Show Translation 👁️'}</span>
                        </button>
                      )}
                    </div>
                    <Button3D 
                      variant="primary" 
                      size="sm" 
                      onClick={() => handleStartReview([card, ...dueCards.filter(c => c.id !== card.id)])}
                      className="!bg-red-500 hover:!bg-red-600 !border-red-700 !text-white shrink-0 w-full sm:w-auto text-sm px-6 cursor-pointer font-black"
                    >
                      <PlayCircle className="w-4 h-4 mr-1.5 inline" />
                      {isAr ? 'ابدأ المراجعة' : 'Start Review'}
                    </Button3D>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Cards (Not Due Yet) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-black text-slate-800">
                  {isAr ? 'قائمة العبارات التي لم يحن وقت مراجعتها بعد' : 'Cards Not Due Yet (Upcoming)'}
                </h2>
              </div>
              <span className="bg-blue-100 text-blue-700 font-black px-3 py-1 rounded-full text-xs">
                {upcomingCards.length} {isAr ? 'قادمة' : 'upcoming'}
              </span>
            </div>

            {upcomingCards.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-6 text-center text-slate-500 font-bold border border-slate-200/70">
                {isAr ? 'لا توجد عبارات قادمة في هذا الجدول.' : 'No upcoming cards currently.'}
              </div>
            ) : (
              <div className="grid gap-3">
                {upcomingCards.map(card => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-50/90 border-2 border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-400"></div>
                    <div className="flex-1" dir="ltr">
                      <p className="font-bold text-base text-slate-800">{card.native}</p>
                      {revealedListCardIds.has(card.id) ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <p className="text-xs font-bold text-slate-600 mt-0.5" dir={isAr ? 'rtl' : 'ltr'}>{card.translation}</p>
                          {card.pronunciation && (
                            <p className="text-[11px] font-mono text-slate-400 mt-0.5" dir="rtl">🗣️ {card.pronunciation}</p>
                          )}
                        </motion.div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => toggleListCardReveal(card.id, e)}
                          className="text-xs font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1 mt-1 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isAr ? 'كشف الترجمة 👁️' : 'Show Translation 👁️'}</span>
                        </button>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                      <div className="bg-white px-3.5 py-2 rounded-xl border border-blue-200 shadow-xs flex items-center justify-between sm:justify-center gap-2">
                        <CountdownTimer targetTime={card.nextReviewAt} />
                      </div>
                      
                      <button
                        onClick={() => handleStartReview([card])}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition-all shadow-xs cursor-pointer active:scale-95 text-center"
                        title="مراجعة هذه البطاقة الآن قبل موعدها"
                      >
                        {isAr ? 'مراجعة مبكرة ⚡' : 'Review Early ⚡'}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          Interactive Flashcard Review Session Modal
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {sessionQueue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none"
            dir="rtl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative overflow-hidden text-slate-800 flex flex-col gap-6"
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                    {currentIndex + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    من أصل {sessionQueue.length} بطاقات
                  </span>
                </div>

                <button
                  onClick={() => setSessionQueue(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="إغلاق جلسة المراجعة"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                  style={{ width: `${((currentIndex) / sessionQueue.length) * 100}%` }}
                />
              </div>

              {/* Completion Screen */}
              {isCompleted ? (
                <div className="text-center py-6 space-y-4">
                  <div className="text-6xl animate-bounce">🏆</div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-800">
                      {isAr ? 'أحسنت! أتممت جلسة المراجعة 🎉' : 'Awesome! Review Session Complete 🎉'}
                    </h2>
                    <p className="text-sm font-bold text-slate-500">
                      {isAr 
                        ? 'تم تحديث مواعيد التكرار المتباعد لجميع البطاقات بنجاح في ذاكرتك!' 
                        : 'Spaced repetition intervals successfully updated!'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-2">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
                      <span className="text-2xl font-black text-emerald-600">{reviewedStats.remembered}</span>
                      <span className="text-xs font-bold text-emerald-800 block mt-1">تذكرتها بنجاح ✅</span>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
                      <span className="text-2xl font-black text-amber-600">{reviewedStats.struggled}</span>
                      <span className="text-xs font-bold text-amber-800 block mt-1">أُعيد تدريبها 🔄</span>
                    </div>
                  </div>

                  <Button3D
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => setSessionQueue(null)}
                    className="!bg-blue-600 hover:!bg-blue-700 !border-blue-800 !text-white font-black py-3.5 !rounded-2xl cursor-pointer"
                  >
                    {isAr ? 'تم، إنهاء الجلسة 👍' : 'Done 👍'}
                  </Button3D>
                </div>
              ) : currentCard ? (
                /* Card Display */
                <div className="space-y-6">
                  <div
                    onClick={() => setIsFlipped(prev => !prev)}
                    className="w-full min-h-[220px] bg-gradient-to-b from-slate-50 to-blue-50/50 rounded-3xl p-6 border-2 border-dashed border-blue-200 hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between relative shadow-inner"
                  >
                    {/* Top Row: Tier and Audio */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                        {currentCard.tier === 'core' ? '⭐ أساسي' : currentCard.tier === 'medium' ? '🔹 متوسط' : '🔸 إضافي'}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playCardAudio(currentCard.native);
                        }}
                        className="p-2.5 rounded-2xl bg-white text-blue-600 hover:bg-blue-50 shadow-sm border border-slate-200 transition-all cursor-pointer"
                        title="استمع للنطق الصوتي"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Central Word / Phrase */}
                    <div className="my-auto text-center py-4">
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-800" dir="ltr">
                        {currentCard.native}
                      </h2>
                      {currentCard.pronunciation && (
                        <p className="text-xs font-mono text-blue-600 font-bold mt-1.5" dir="rtl">
                          النطق: {currentCard.pronunciation}
                        </p>
                      )}

                      {/* Back: Revealed Translation */}
                      <AnimatePresence>
                        {isFlipped ? (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 pt-4 border-t border-blue-200/60"
                          >
                            <span className="text-xs font-bold text-slate-400 block mb-1">المعنى بالعربية:</span>
                            <span className="text-xl font-black text-blue-700 block">
                              "{currentCard.translation}"
                            </span>
                          </motion.div>
                        ) : (
                          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400 animate-pulse">
                            <Eye className="w-4 h-4" />
                            <span>انقر هنا لكشف المعنى والتقييم 👁️</span>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="text-[10px] text-center font-bold text-slate-400">
                      {isFlipped ? 'قيّم مدى تذكرك للعبارة بالأسفل 👇' : 'انقر على البطاقة لقلبها'}
                    </div>
                  </div>

                  {/* 3-Level SRS Rating Response Buttons with Dynamic SM-2 Interval Previews */}
                  {isFlipped ? (
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleAnswerCard('hard')}
                        className="py-3 px-2 rounded-2xl bg-red-50 hover:bg-red-100 border-2 border-red-200 text-red-700 font-black text-xs flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm"
                      >
                        <span className="text-base">🔴</span>
                        <span>صعبة (نسيتها)</span>
                        <span className="text-[10px] text-red-500 font-mono font-bold">
                          {previewIntervalText(currentCard, 'again')}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAnswerCard('medium')}
                        className="py-3 px-2 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 text-amber-800 font-black text-xs flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm"
                      >
                        <span className="text-base">🟡</span>
                        <span>متوسطة (بجهد)</span>
                        <span className="text-[10px] text-amber-600 font-mono font-bold">
                          {previewIntervalText(currentCard, 'hard')}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAnswerCard('easy')}
                        className="py-3 px-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-300 text-emerald-700 font-black text-xs flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm"
                      >
                        <span className="text-base">🟢</span>
                        <span>سهلة (بطلاقة)</span>
                        <span className="text-[10px] text-emerald-600 font-mono font-bold">
                          {previewIntervalText(currentCard, 'good')}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <Button3D
                      variant="primary"
                      size="lg"
                      fullWidth
                      onClick={() => setIsFlipped(true)}
                      className="!bg-blue-600 hover:!bg-blue-700 !border-blue-800 !text-white font-black py-3.5 !rounded-2xl cursor-pointer"
                    >
                      <Eye className="w-4 h-4 mr-2 inline" />
                      {isAr ? 'كشف المعنى والتقييم 👁️' : 'Reveal Meaning 👁️'}
                    </Button3D>
                  )}
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          Kingdom Siege Defense on Real Kingdom Ground (أرض المملكة الحقيقية)
         ───────────────────────────────────────────────────────────── */}
      {activeReviewGame === 'siege' && (
        <div className="fixed inset-0 z-50 bg-slate-950">
          <KingdomApp
            initialMode="defense_review"
            onBackToApp={() => {
              setActiveReviewGame('none');
              setGameReviewResult({
                mode: isAr ? 'حصار المملكة والدفاع 🏰' : 'Kingdom Defense Review 🏰',
                total: dueCards.length > 0 ? dueCards.length : 4,
                easy: dueCards.length > 0 ? dueCards.length : 4,
                hard: 0,
              });
            }}
          />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          Zombie Fight Review Overlay
         ───────────────────────────────────────────────────────────── */}
      {activeReviewGame === 'zombie' && (
        <div className="fixed inset-0 z-50 bg-black">
          <GoblinFightGame
            flashcards={reviewCardsForZombie}
            orderMode="srs"
            onClose={handleFinishZombie}
          />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          Knife Hit Review Overlay
         ───────────────────────────────────────────────────────────── */}
      {activeReviewGame === 'knife' && (
        <div className="fixed inset-0 z-50 bg-black">
          <KnifeHitGame
            flashcards={reviewCardsForKnife}
            orderMode="srs"
            language={targetLanguage || 'en'}
            onComplete={handleFinishKnife}
            onClose={() => handleFinishKnife(false)}
          />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          Context Change Review Overlay
         ───────────────────────────────────────────────────────────── */}
      {activeReviewGame === 'context' && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-xl bg-slate-900 rounded-3xl p-4 shadow-2xl relative border border-slate-700 overflow-hidden min-h-[500px] flex flex-col">
            <button
              onClick={() => setActiveReviewGame('none')}
              className="absolute top-4 left-4 z-50 p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700 cursor-pointer shadow"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
            <ContextChangeGame
              lesson={syntheticLesson}
              onComplete={handleFinishContext}
            />
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          Game Review Result Summary Modal
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {gameReviewResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
            dir="rtl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-slate-200 text-slate-800 space-y-4"
            >
              <div className="text-5xl animate-bounce">🏆</div>
              <h2 className="text-2xl font-black text-slate-800">
                أحسنت! أتممت مراجعة {gameReviewResult.mode}
              </h2>
              <p className="text-sm font-bold text-slate-500">
                تم تحديث مواعيد التكرار المتباعد (SRS) لكافة العبارات المختبرة بنجاح في ذاكرتك!
              </p>

              <div className="grid grid-cols-2 gap-3 py-2">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
                  <span className="text-2xl font-black text-emerald-600">{gameReviewResult.easy}</span>
                  <span className="text-xs font-bold text-emerald-800 block mt-1">أُتقنت وتباعدت 🌟</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
                  <span className="text-2xl font-black text-amber-600">{gameReviewResult.hard}</span>
                  <span className="text-xs font-bold text-amber-800 block mt-1">تكرار عاجل (10د) 🔄</span>
                </div>
              </div>

              <Button3D
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => setGameReviewResult(null)}
                className="!bg-blue-600 hover:!bg-blue-700 !border-blue-800 !text-white font-black py-3.5 !rounded-2xl cursor-pointer"
              >
                تم، متابعة جدول المراجعة 👍
              </Button3D>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
