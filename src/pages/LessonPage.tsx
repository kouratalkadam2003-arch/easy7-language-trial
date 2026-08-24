import { useParams, useNavigate } from 'react-router-dom'
import { get, set } from 'idb-keyval';
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Heart, Headphones, BookOpen, Axe, Sword, MessageCircle, Radio, ChevronRight, RefreshCw } from 'lucide-react'
import { Button3D } from '@/components/ui/Button3D'
import { useUserStore } from '@/store/userStore'

const STAGES = [
  { id: 'listen', icon: Headphones, label: 'الاستماع', labelEn: 'Listen', color: '#10B981', emoji: '🎧' },
  { id: 'read', icon: BookOpen, label: 'القراءة', labelEn: 'Read', color: '#8B5CF6', emoji: '📖' },
  { id: 'chop', icon: Axe, label: 'الاحتطاب', labelEn: 'Chop', color: '#EAB308', emoji: '🪓' },
  { id: 'fight', icon: Sword, label: 'القتال', labelEn: 'Fight', color: '#EF4444', emoji: '⚔️' },
  { id: 'context', icon: RefreshCw, label: 'السياق', labelEn: 'Context', color: '#0EA5E9', emoji: '🔄' },
  { id: 'chat', icon: MessageCircle, label: 'المحادثة', labelEn: 'Chat', color: '#F97316', emoji: '💬' },
  { id: 'radio', icon: Radio, label: 'الراديو', labelEn: 'Radio', color: '#3B82F6', emoji: '📻' },
]


import { ListeningStage } from '@/components/lesson/ListeningStage'
import { ReadingStage } from '@/components/lesson/ReadingStage'
import { RadioWrapper } from '@/components/lesson/RadioWrapper'
import { ChatWrapper } from '@/components/lesson/ChatWrapper'
import { ContextChangeGame } from '@/components/lesson/ContextChangeGame'
import KnifeHitGame from '@/screens/KnifeHitGame'
import GoblinFightGame from '@/screens/ZombieFightGame'
import AiChatInterface from '@/screens/AiChatInterface'

import { useFarmStore } from '@/store/farmStore'
import { useReviewStore } from '@/store/reviewStore'

export default function LessonPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { uiLang, hearts, completeLesson, gameMode } = useUserStore()
  const targetLanguage = useUserStore((s: any) => s.targetLanguage) || 'en'
  const { addResources, plantSeed } = useFarmStore()
  const addReviewCards = useReviewStore(state => state.addCards)
  const isAr = uiLang === 'ar'

  const [currentStage, setCurrentStage] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false)
  const [showIntro, setShowIntro] = useState(true)  // ← Welcome intro screen
  
  const [lesson, setLesson] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)


  const stage = STAGES[currentStage]

  // Parse day from id (e.g., 'd1' -> 1)
  const dayMatch = id?.match(/\d+/)
  const dayNumber = dayMatch ? parseInt(dayMatch[0], 10) : 1
  
  useEffect(() => {
    const handleJump = (e: any) => {
      const idx = STAGES.findIndex(s => s.id === e.detail.stageId);
      if (idx !== -1) {
        setCurrentStage(idx);
        setProgress(((idx + 1) / STAGES.length) * 100);
      }
    };
    window.addEventListener('JUMP_TO_STAGE', handleJump);
    return () => window.removeEventListener('JUMP_TO_STAGE', handleJump);
  }, []);

  useEffect(() => {
    let level = 'A1';
    let relativeDay = dayNumber;
    if (dayNumber > 150) { level = 'C2'; relativeDay = ((dayNumber - 1) % 30) + 1; }
    else if (dayNumber > 120) { level = 'C1'; relativeDay = ((dayNumber - 1) % 30) + 1; }
    else if (dayNumber > 90) { level = 'B2'; relativeDay = ((dayNumber - 1) % 30) + 1; }
    else if (dayNumber > 60) { level = 'B1'; relativeDay = ((dayNumber - 1) % 30) + 1; }
    else if (dayNumber > 30) { level = 'A2'; relativeDay = ((dayNumber - 1) % 30) + 1; }

    const langCode = targetLanguage || 'en';
    
    const loadLessonData = async () => {
      const cacheKey = `lesson_v2_${gameMode}_${langCode}_${level}_day${dayNumber}`;
      
      try {
        // 1. Try Local Cache First
        const cachedData = await get(cacheKey);
        if (cachedData) {
          return cachedData;
        }

        // 2. Fetch from Network if not in cache
        let res = await fetch(`/lessons/${langCode}/${level}/day${relativeDay}.json`);
        
        if (!res.ok) {
          res = await fetch(`/lessons/${langCode}/${level}/day${dayNumber}.json`);
        }
        
        if (!res.ok && langCode !== 'en') {
          res = await fetch(`/lessons/en/${level}/day${relativeDay}.json`);
        }

        if (!res.ok) {
          throw new Error('Failed to fetch lesson data');
        }

        const data = await res.json();
        
        // 3. Save to Local Cache
        await set(cacheKey, data);
        
        return data;
      } catch (err) {
        console.error("Error loading lesson:", err);
        throw err;
      }
    };

    loadLessonData()
      .then(data => {
        setLesson({
          day: data.dayNumber || dayNumber,
          lang: data.targetLang || langCode,
          cefr: data.level || level,
          storyArc: 'standalone', // Normal mode (بدون قصة)
          title: data.metadata?.topic?.title || `الدرس ${dayNumber}`,
          dialogue: data.textChat?.messages?.map((msg: any) => ({
            character: msg.speakerName || 'Speaker',
            native: msg.text,
            romaji: msg.pronunciation || msg.romaji || msg.text,
            pronunciation: msg.pronunciation || msg.text,
            translation: msg.translation,
            tier: 'core'
          })) || []
        });
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to load lesson completely, using default fallback lesson:", err);
        setLesson({
          day: dayNumber,
          lang: langCode,
          cefr: level,
          storyArc: 'standalone',
          title: `الدرس ${dayNumber}`,
          dialogue: [
            { character: 'ليث', native: 'Hello, welcome to our practice lesson!', romaji: 'Hello, welcome to our practice lesson!', pronunciation: 'Hello, welcome to our practice lesson!', translation: 'مرحباً، أهلاً بك في درس الممارسة الخاص بنا!', tier: 'core' },
            { character: 'إيلي', native: 'Are you ready to practice speaking with AI?', romaji: 'Are you ready to practice speaking with AI?', pronunciation: 'Are you ready to practice speaking with AI?', translation: 'هل أنت مستعد لممارسة التحدث مع الذكاء الاصطناعي؟', tier: 'core' }
          ]
        });
        setIsLoading(false);
      });
  }, [dayNumber, targetLanguage]);

  const handleNext = () => {
    if (currentStage < STAGES.length - 1) {
      setCurrentStage(s => s + 1)
      setProgress(((currentStage + 1) / STAGES.length) * 100)
    } else {
      // Lesson complete!
      if (id) completeLesson(id)
      addResources(50, 20, 0)
      if (lesson) {
        // Add phrases to Farm store
        lesson.dialogue.forEach((line: any, i: number) => {
          plantSeed({ id: `d${dayNumber}_${i}`, word: line.native, translation: line.translation })
        })
        
        // Add phrases to Spaced Repetition Review store
        const reviewCards = lesson.dialogue.map((line: any, i: number) => ({
          id: `review_d${dayNumber}_${i}_${Date.now()}`,
          native: line.native,
          translation: line.translation,
          pronunciation: line.pronunciation,
          tier: line.tier || 'core',
          addedAt: Date.now(),
          intervalMinutes: 5,
          nextReviewAt: Date.now() + 5 * 60 * 1000 // First review in 5 minutes
        }))
        addReviewCards(reviewCards)
      }
      setIsCompletedModalOpen(true)
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--background)] z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--background)] z-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🐾</div>
          <h1 className="text-2xl font-black mb-2">{isAr ? 'الدرس غير موجود' : 'Lesson not found'}</h1>
          <Button3D variant="primary" onClick={() => navigate('/learn')}>{isAr ? 'العودة' : 'Go back'}</Button3D>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-white text-slate-900 z-50 overflow-hidden" dir="rtl" style={{ height: '100dvh' }}>
      {/* Header: Exit + Progress Dots + Hearts */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2 flex-shrink-0">
        <button onClick={() => navigate('/learn')} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600">
          <X className="w-5 h-5" />
        </button>

        {/* ── Progress bar ── */}
        <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: stage.color }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          />
        </div>

        <div className="flex items-center gap-1 text-[#FF4B4B] font-bold">
          <Heart className="w-5 h-5 fill-current" />
          <span>{hearts}</span>
        </div>
      </div>

      {/* ── Progress Dots ── */}
      <div className="flex items-center justify-center gap-2 px-4 pb-2 flex-shrink-0">
        {STAGES.map((s, i) => (
          <motion.div
            key={s.id}
            animate={{
              width: i === currentStage ? 24 : 8,
              opacity: i > currentStage ? 0.3 : 1,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="h-2 rounded-full"
            style={{
              backgroundColor: i < currentStage
                ? '#58CC02'
                : i === currentStage
                ? stage.color
                : '#e2e8f0',
            }}
          />
        ))}
        <span className="text-xs text-slate-500 font-bold ms-2">
          {currentStage + 1}/{STAGES.length}
        </span>
      </div>

      {/* Stage Content */}
      <div className="flex-1 flex flex-col items-center px-4 md:px-8 lg:px-12 mx-auto w-full max-w-5xl pt-1 min-h-0 overflow-hidden">
        {/* AnimatePresence wrapper must be flex-1 for children to fill height */}
        <div className="flex-1 flex flex-col w-full min-h-0">
        <AnimatePresence mode="wait">

          {/* ── Simplified Intro Screen ── */}
          {showIntro ? (
            <motion.div
              key="intro"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="w-full flex-1 flex flex-col items-center justify-center text-center px-4 gap-6 min-h-0"
            >
              {/* Start Listening 3D Blue Button */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="w-full max-w-md"
              >
                <Button3D
                  variant="primary"
                  size="lg"
                  fullWidth
                  className="text-xl py-5 !bg-blue-500 hover:!bg-blue-600 !text-white !border-b-4 !border-blue-700 !shadow-lg !rounded-3xl cursor-pointer"
                  onClick={() => setShowIntro(false)}
                >
                  {isAr ? 'ابدأ الاستماع 🎧' : 'Start Listening 🎧'}
                </Button3D>
              </motion.div>
            </motion.div>
          ) : (
            /* ── Actual Stage Content ── */
            <motion.div
              key={stage.id}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full flex-1 flex flex-col min-h-0 overflow-hidden"
            >
              <div className="text-center mb-2 flex-shrink-0">
                <h2 className="text-lg sm:text-2xl font-black" style={{ color: stage.color }}>
                  {stage.emoji} {isAr ? stage.label : stage.labelEn}
                </h2>
              </div>

              {stage.id === 'listen' && <ListeningStage lesson={lesson} onComplete={handleNext} />}
              {stage.id === 'read' && <ReadingStage lesson={lesson} onComplete={handleNext} />}
              {stage.id === 'context' && <ContextChangeGame lesson={lesson} onComplete={handleNext} />}
              {stage.id === 'chop' && (
                <div className="flex-1 min-h-0 overflow-hidden w-full">
                  <KnifeHitGame onComplete={handleNext} onClose={handleNext} flashcards={lesson.dialogue.map((line: any, i: number) => ({ id: String(i), originalText: line.native, translation: line.translation, romanization: line.pronunciation, tier: line.tier }))} />
                </div>
              )}
              {stage.id === 'fight' && (
                <div className="flex-1 min-h-0 overflow-hidden w-full">
                  <GoblinFightGame onClose={handleNext} flashcards={lesson.dialogue.map((line: any, i: number) => ({ id: String(i), originalText: line.native, translation: line.translation, romanization: line.pronunciation, translatedText: line.translation, nativeText: null, speechRate: 1, nextReviewTimestamp: Date.now(), status: 'new' as const }))} />
                </div>
              )}
              {stage.id === 'chat' && <ChatWrapper lesson={lesson} onComplete={handleNext} />}
              {stage.id === 'radio' && <RadioWrapper lesson={lesson} onComplete={handleNext} />}
              
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

      {/* 🎉 Celebratory Lesson Completion Modal */}
      <AnimatePresence>
        {isCompletedModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-white/80 backdrop-blur-2xl rounded-3xl p-6 max-w-sm w-full text-center shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/40 space-y-6 text-slate-800"
            >
              <div className="text-7xl animate-bounce">🏆</div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-800">
                  {isAr ? 'أحسنت! إنجاز رائع 🎉' : 'Awesome Job! 🎉'}
                </h2>
                <p className="text-sm font-medium text-slate-600">
                  {isAr ? `لقد أكملت جميع مراحل اليوم ${dayNumber} بنجاح` : `You completed all stages of Day ${dayNumber}`}
                </p>
              </div>

              {/* Rewards Box */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-blue-500/20 flex justify-around items-center">
                <div className="text-center">
                  <div className="text-2xl font-black text-amber-500">+50</div>
                  <div className="text-xs font-bold text-blue-300/60">{isAr ? 'ذهب 🪙' : 'Gold'}</div>
                </div>
                <div className="w-px h-8 bg-blue-500/20" />
                <div className="text-center">
                  <div className="text-2xl font-black text-emerald-500">+20</div>
                  <div className="text-xs font-bold text-blue-300/60">{isAr ? 'خشب 🪵' : 'Wood'}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <Button3D
                  variant="success"
                  fullWidth
                  size="lg"
                  className="text-base py-3.5 !bg-[#58CC02] hover:!bg-[#46A302] !border-b-4 !border-[#46A302] !shadow-none !rounded-2xl"
                  onClick={() => {
                    setIsCompletedModalOpen(false)
                    navigate(`/lesson/d${dayNumber + 1}`)
                  }}
                >
                  {isAr ? 'الدرس التالي ➔' : 'Next Lesson ➔'}
                </Button3D>

                <Button3D
                  variant="ghost"
                  fullWidth
                  size="md"
                  onClick={() => {
                    setIsCompletedModalOpen(false)
                    navigate('/learn')
                  }}
                >
                  {isAr ? 'العودة للخريطة 🗺️' : 'Back to Map 🗺️'}
                </Button3D>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
