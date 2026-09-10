import { useParams, useNavigate } from 'react-router-dom'
import { get, set } from 'idb-keyval';
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Heart, Headphones, BookOpen, MessageCircle, Radio, Trophy, Mic, CheckCircle2, Sparkles, Brain, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { Button3D } from '@/components/ui/Button3D'
import { useUserStore } from '@/store/userStore'
import { useLessonTrackerStore, type MasterEvaluationResult } from '@/store/lessonTrackerStore'

const STAGES = [
  { id: 'chat', icon: Mic, label: 'المحادثة المباشرة', labelEn: 'Live Voice Chat', color: '#10B981', emoji: '🎙️' },
  { id: 'games', icon: Trophy, label: 'ساحة التحديات', labelEn: 'Challenge Arena', color: '#F59E0B', emoji: '🏆' },
  { id: 'read', icon: BookOpen, label: 'الاستماع والقراءة', labelEn: 'Listening & Reading', color: '#8B5CF6', emoji: '📖' },
  { id: 'real_chat', icon: MessageCircle, label: 'محادثة الموقف الواقعي', labelEn: 'Real-Life Chat', color: '#EC4899', emoji: '💬' },
  { id: 'radio', icon: Radio, label: 'راديو القرية', labelEn: 'Village Radio', color: '#3B82F6', emoji: '📻' },
]

import { ChatWrapper } from '@/components/lesson/ChatWrapper'
import { GamesArenaHub } from '@/components/lesson/GamesArenaHub'
import { ReadingStage } from '@/components/lesson/ReadingStage'
import { RealRoleplayStage } from '@/components/lesson/RealRoleplayStage'
import { RadioWrapper } from '@/components/lesson/RadioWrapper'

import { useFarmStore } from '@/store/farmStore'
import { useReviewStore } from '@/store/reviewStore'
import { globalSpacedRepetition } from '@/kingdom/engine/spacedRepetition'

export default function LessonPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { uiLang, hearts, completeLesson, gameMode } = useUserStore()
  const targetLanguage = useUserStore((s: any) => s.targetLanguage) || 'en'
  const { addResources, plantSeed } = useFarmStore()
  const addReviewCards = useReviewStore(state => state.addCards)
  const { initLessonPhrases, generateMasterEvaluation, resetTracker } = useLessonTrackerStore()
  const isAr = uiLang === 'ar'

  const [currentStage, setCurrentStage] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false)
  const [showIntro, setShowIntro] = useState(true)  // ← Welcome intro screen
  const [readingAnalytics, setReadingAnalytics] = useState<{
    mastered: string[];
    needsReview: string[];
    accuracyScore: number;
  } | undefined>(undefined);
  const [masterEvaluation, setMasterEvaluation] = useState<MasterEvaluationResult | null>(null);
  const [showEvaluationDetails, setShowEvaluationDetails] = useState(false);
  
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

    // Reset tracker for new lesson
    resetTracker();

    loadLessonData()
      .then(data => {
        const dialogueLines = data.textChat?.messages?.map((msg: any) => ({
          character: msg.speakerName || 'Speaker',
          native: msg.text,
          romaji: msg.pronunciation || msg.romaji || msg.text,
          pronunciation: msg.pronunciation || msg.text,
          translation: msg.translation,
          tier: 'core'
        })) || [];

        setLesson({
          day: data.dayNumber || dayNumber,
          lang: data.targetLang || langCode,
          cefr: data.level || level,
          storyArc: 'standalone',
          title: data.metadata?.topic?.title || `الدرس ${dayNumber}`,
          dialogue: dialogueLines
        });

        // Initialize cross-stage tracker with all lesson phrases and explicit language
        initLessonPhrases(dialogueLines.map((l: any) => ({
          native: l.native,
          translation: l.translation,
          pronunciation: l.pronunciation
        })), data.targetLang || langCode);

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
      if (id) completeLesson(id);
      completeLesson(`d${dayNumber}`);
      completeLesson(String(dayNumber));
      addResources(50, 20, 0)

      // Sync progress to Kingdom village growth!
      globalSpacedRepetition.syncWithEasy7Progress({
        completedLessons: [...useUserStore.getState().completedLessons, `d${dayNumber}`],
        cards: useReviewStore.getState().cards || [],
        streak: useUserStore.getState().streak,
      });

      if (lesson) {
        // Add phrases to Farm store
        lesson.dialogue.forEach((line: any, i: number) => {
          plantSeed({ id: `d${dayNumber}_${i}`, word: line.native, translation: line.translation })
        })
        
        // Generate AI Master Evaluation across ALL stages
        // This automatically classifies phrases and adds SRS cards to ReviewStore
        const evaluation = generateMasterEvaluation(lesson?.lang || targetLanguage);
        console.log('[LessonTracker] Master Evaluation:', evaluation);
        setMasterEvaluation(evaluation);
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
                  className="text-xl py-5 !bg-emerald-500 hover:!bg-emerald-600 !text-white !border-b-4 !border-emerald-700 !shadow-lg !rounded-3xl cursor-pointer"
                  onClick={() => setShowIntro(false)}
                >
                  {isAr ? 'ابدأ المحادثة المباشرة 🎙️' : 'Start Live Chat 🎙️'}
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

              {stage.id === 'chat' && <ChatWrapper lesson={lesson} onComplete={handleNext} />}
              {stage.id === 'games' && <GamesArenaHub lesson={lesson} onComplete={handleNext} />}
              {stage.id === 'read' && (
                <ReadingStage 
                  lesson={lesson} 
                  onComplete={(analytics) => {
                    if (analytics) setReadingAnalytics(analytics);
                    handleNext();
                  }} 
                />
              )}
              {stage.id === 'real_chat' && (
                <RealRoleplayStage 
                  lesson={lesson} 
                  analyticsFromReading={readingAnalytics}
                  onComplete={handleNext} 
                />
              )}
              {stage.id === 'radio' && <RadioWrapper lesson={lesson} onComplete={handleNext} />}
              
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

      {/* 🎉 Celebratory Lesson Completion & AI Master Evaluation Modal */}
      <AnimatePresence>
        {isCompletedModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 20 }}
              className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col text-center shadow-2xl border border-slate-200 overflow-hidden text-slate-800"
            >
              {/* Scrollable Modal Content */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                {/* Trophy & Badge */}
                <div className="text-5xl sm:text-6xl animate-bounce">🏆</div>
                
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-black">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    <span>{isAr ? 'تقرير الذكاء الاصطناعي الشامل للدرس' : 'AI Master Evaluation'}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                    {isAr ? `إنجاز رائع! اليوم ${dayNumber}` : `Awesome Job! Day ${dayNumber}`}
                  </h2>
                  {masterEvaluation && (
                    <div className="pt-1">
                      <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300 shadow-sm">
                        {isAr ? `معدل إتقان العبارات: ${masterEvaluation.accuracyScore}% 🎯` : `Overall Mastery: ${masterEvaluation.accuracyScore}% 🎯`}
                      </span>
                    </div>
                  )}
                </div>

                {/* AI Coach Personalized Message */}
                {masterEvaluation?.coachPersonalMessage && (
                  <div className="bg-gradient-to-br from-blue-50 via-indigo-50/50 to-blue-50 border border-blue-200/90 rounded-2xl p-3.5 text-right shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1 text-xs font-black text-blue-700">
                      <Brain className="w-4 h-4 text-blue-600" />
                      <span>{isAr ? 'همسة المدرب الذكي:' : 'Coach Insight:'}</span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed">
                      {masterEvaluation.coachPersonalMessage}
                    </p>
                  </div>
                )}

                {/* Three Performance Trajectory Badges */}
                {masterEvaluation && (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {/* Conquered */}
                    <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-2.5 flex flex-col items-center shadow-sm">
                      <span className="text-xl">🌟</span>
                      <span className="text-lg font-black text-amber-700 mt-0.5">
                        {masterEvaluation.conqueredPhrases.length}
                      </span>
                      <span className="text-[10px] font-black text-amber-800 leading-tight">
                        {isAr ? 'تم التغلب عليها' : 'Conquered'}
                      </span>
                      <span className="text-[9px] text-amber-600 font-bold mt-0.5 hidden xs:inline">
                        {isAr ? 'أتقنتها بعد تعثر' : 'Struggled then won'}
                      </span>
                    </div>

                    {/* Mastered */}
                    <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-2.5 flex flex-col items-center shadow-sm">
                      <span className="text-xl">👑</span>
                      <span className="text-lg font-black text-emerald-700 mt-0.5">
                        {masterEvaluation.masteredPhrases.length}
                      </span>
                      <span className="text-[10px] font-black text-emerald-800 leading-tight">
                        {isAr ? 'إتقان فوري' : 'Mastered'}
                      </span>
                      <span className="text-[9px] text-emerald-600 font-bold mt-0.5 hidden xs:inline">
                        {isAr ? 'من أول محاولة' : 'First try'}
                      </span>
                    </div>

                    {/* Needs Review / SRS */}
                    <div className="bg-purple-50/90 border border-purple-200 rounded-2xl p-2.5 flex flex-col items-center shadow-sm">
                      <span className="text-xl">📦</span>
                      <span className="text-lg font-black text-purple-700 mt-0.5">
                        {masterEvaluation.needsReviewPhrases.length}
                      </span>
                      <span className="text-[10px] font-black text-purple-800 leading-tight">
                        {isAr ? 'في المراجعة' : 'In SRS'}
                      </span>
                      <span className="text-[9px] text-purple-600 font-bold mt-0.5 hidden xs:inline">
                        {isAr ? 'تكرار ذكي' : 'Spaced review'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Spaced Repetition SRS Notice */}
                {masterEvaluation && masterEvaluation.srsCardsAddedCount > 0 && (
                  <div className="text-[11px] font-bold text-slate-600 bg-slate-50 rounded-xl p-2.5 border border-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-right">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{isAr ? 'تمت جدولة جميع العبارات آلياً في المراجعة الذكية (SRS)' : 'All phrases auto-scheduled in Spaced Repetition (SRS)'}</span>
                    </span>
                    <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full shrink-0">
                      {masterEvaluation.srsCardsAddedCount} {isAr ? 'بطاقة' : 'cards'}
                    </span>
                  </div>
                )}

                {/* Expandable Detailed Phrases List Toggle */}
                {masterEvaluation && (
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowEvaluationDetails(!showEvaluationDetails)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>{isAr ? 'عرض تفاصيل تشخيص كل عبارة 📋' : 'View Detailed Phrase Diagnostics 📋'}</span>
                      {showEvaluationDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {showEvaluationDetails && (
                      <div className="max-h-48 overflow-y-auto space-y-2 text-right pr-1">
                        {/* Conquered list */}
                        {masterEvaluation.conqueredPhrases.map((p, idx) => (
                          <div key={`conq-${idx}`} className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs">
                            <div className="flex items-center justify-between mb-0.5" dir="ltr">
                              <span className="font-black text-slate-800">{p.native}</span>
                              <span className="text-[10px] font-black bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                                🌟 تم التغلب عليها
                              </span>
                            </div>
                            <div className="text-slate-600 font-bold" dir="rtl">{p.translation}</div>
                            {p.diagnosticNote && (
                              <div className="text-[10px] text-amber-800 font-bold mt-1" dir="rtl">{p.diagnosticNote}</div>
                            )}
                          </div>
                        ))}

                        {/* Mastered list */}
                        {masterEvaluation.masteredPhrases.map((p, idx) => (
                          <div key={`mast-${idx}`} className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs">
                            <div className="flex items-center justify-between mb-0.5" dir="ltr">
                              <span className="font-black text-slate-800">{p.native}</span>
                              <span className="text-[10px] font-black bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">
                                👑 إتقان فوري
                              </span>
                            </div>
                            <div className="text-slate-600 font-bold" dir="rtl">{p.translation}</div>
                            {p.diagnosticNote && (
                              <div className="text-[10px] text-emerald-800 font-bold mt-1" dir="rtl">{p.diagnosticNote}</div>
                            )}
                          </div>
                        ))}

                        {/* Needs review list */}
                        {masterEvaluation.needsReviewPhrases.map((p, idx) => (
                          <div key={`need-${idx}`} className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-200 text-xs">
                            <div className="flex items-center justify-between mb-0.5" dir="ltr">
                              <span className="font-black text-slate-800">{p.native}</span>
                              <span className="text-[10px] font-black bg-purple-200/80 text-purple-900 px-2 py-0.5 rounded-full">
                                📦 مراجعة قادمة (10د)
                              </span>
                            </div>
                            <div className="text-slate-600 font-bold" dir="rtl">{p.translation}</div>
                            {p.diagnosticNote && (
                              <div className="text-[10px] text-purple-800 font-bold mt-1" dir="rtl">{p.diagnosticNote}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Rewards Box */}
                <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 flex justify-around items-center shadow-inner">
                  <div className="text-center">
                    <div className="text-2xl font-black text-amber-400">+50</div>
                    <div className="text-xs font-bold text-slate-400">{isAr ? 'ذهب 🪙' : 'Gold 🪙'}</div>
                  </div>
                  <div className="w-px h-8 bg-slate-800" />
                  <div className="text-center">
                    <div className="text-2xl font-black text-emerald-400">+20</div>
                    <div className="text-xs font-bold text-slate-400">{isAr ? 'خشب 🪵' : 'Wood 🪵'}</div>
                  </div>
                  <div className="w-px h-8 bg-slate-800" />
                  <div className="text-center">
                    <div className="text-2xl font-black text-amber-300">+100</div>
                    <div className="text-xs font-bold text-slate-400">{isAr ? 'ازدهار القرية 🏰' : 'Prosperity 🏰'}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Sticky Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2 shrink-0">
                <Button3D
                  variant="success"
                  fullWidth
                  size="lg"
                  className="text-base py-3 !bg-[#58CC02] hover:!bg-[#46A302] !border-b-4 !border-[#46A302] !shadow-none !rounded-2xl cursor-pointer"
                  onClick={() => {
                    setIsCompletedModalOpen(false)
                    navigate(`/lesson/d${dayNumber + 1}`)
                  }}
                >
                  {isAr ? 'الدرس التالي ➔' : 'Next Lesson ➔'}
                </Button3D>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setIsCompletedModalOpen(false)
                      navigate('/village')
                    }}
                    className="py-2.5 px-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-black text-xs border border-amber-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>🏰 {isAr ? 'قريتك' : 'Village'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsCompletedModalOpen(false)
                      navigate('/review')
                    }}
                    className="py-2.5 px-2 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-black text-xs border border-purple-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Brain className="w-3.5 h-3.5" />
                    <span>{isAr ? 'المراجعة' : 'Review'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsCompletedModalOpen(false)
                      navigate('/learn')
                    }}
                    className="py-2.5 px-2 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-black text-xs border border-slate-200 transition-colors cursor-pointer"
                  >
                    {isAr ? 'الخريطة 🗺️' : 'Map 🗺️'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
