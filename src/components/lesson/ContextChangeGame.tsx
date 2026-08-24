import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { RefreshCw, Play, Volume2 } from 'lucide-react'
import { Button3D } from '@/components/ui/Button3D'
import { bcp47, speak } from '@/lib/tts'
import type { Lesson } from '@/data/lessons/types'
import { useUserStore } from '@/store/userStore'

interface Props {
  lesson: Lesson
  onComplete: () => void
}

const CONTEXT_DICTIONARY = {
  names: [
    { en: 'Alex', ar: 'أحمد' },
    { en: 'Sarah', ar: 'سارة' },
    { en: 'Saeed', ar: 'سعيد' },
    { en: 'Ahmed', ar: 'أحمد' },
    { en: 'Omar', ar: 'عمر' },
    { en: 'Laila', ar: 'ليلى' }
  ],
  family: [
    { en: 'mother', ar: 'أمي' },
    { en: 'father', ar: 'أبي' },
    { en: 'sister', ar: 'أختي' },
    { en: 'brother', ar: 'أخي' },
    { en: 'friend', ar: 'صديقي' }
  ],
  jobs: [
    { en: 'student', ar: 'طالب' },
    { en: 'teacher', ar: 'معلم' },
    { en: 'doctor', ar: 'طبيب' },
    { en: 'engineer', ar: 'مهندس' },
    { en: 'driver', ar: 'سائق' }
  ],
  places: [
    { en: 'village', ar: 'القرية' },
    { en: 'city', ar: 'المدينة' },
    { en: 'capital', ar: 'العاصمة' },
    { en: 'school', ar: 'المدرسة' },
    { en: 'hospital', ar: 'المستشفى' }
  ]
}

interface Challenge {
  baseNative: string;
  baseTranslation: string;
  originalWord: { en: string; ar: string };
  variations: { en: string; ar: string }[];
}

export function ContextChangeGame({ lesson, onComplete }: Props) {
  const { uiLang } = useUserStore()
  const isAr = uiLang === 'ar'

  const challenges = useMemo(() => {
    const list: Challenge[] = []
    
    lesson.dialogue.forEach(line => {
      let found = false
      for (const words of Object.values(CONTEXT_DICTIONARY)) {
        if (found) break
        for (const w of words) {
          const regex = new RegExp(`\\b${w.en}\\b`, 'i')
          if (regex.test(line.native)) {
            // Get 3-4 other words from the same category
            const others = words.filter(x => x.en !== w.en).sort(() => 0.5 - Math.random()).slice(0, 4)
            if (others.length > 0) {
              list.push({
                baseNative: line.native,
                baseTranslation: line.translation,
                originalWord: w,
                variations: others
              })
              found = true
              break
            }
          }
        }
      }
    })

    if (list.length === 0) {
      list.push({
        baseNative: "Hello, my name is Alex.",
        baseTranslation: "مرحباً، اسمي أحمد.",
        originalWord: { en: "Alex", ar: "أحمد" },
        variations: [
          { en: "Ahmed", ar: "أحمد" },
          { en: "Saeed", ar: "سعيد" },
          { en: "Sarah", ar: "سارة" },
          { en: "Laila", ar: "ليلى" }
        ]
      });
    }

    return list.slice(0, 5)
  }, [lesson])

  const [chalIdx, setChalIdx] = useState(0)
  const [activeVarIdx, setActiveVarIdx] = useState<number | null>(null)
  
  const currentChallenge = challenges[chalIdx]

  const variationsList = useMemo(() => {
    if (!currentChallenge) return []
    return currentChallenge.variations.map(variation => {
      const native = currentChallenge.baseNative.replace(
        new RegExp(`\\b${currentChallenge.originalWord.en}\\b`, 'i'), 
        variation.en
      )
      const arabic = currentChallenge.baseTranslation.replace(
        currentChallenge.originalWord.ar, 
        variation.ar
      )
      return { native, arabic, variation }
    })
  }, [currentChallenge])

  const handleSelect = (idx: number, native: string) => {
    setActiveVarIdx(idx)
    speak(native, bcp47(lesson.lang), 1)
  }

  const handleNext = () => {
    if (chalIdx < challenges.length - 1) {
      setChalIdx(c => c + 1)
      setActiveVarIdx(null)
    } else {
      onComplete()
    }
  }

  if (!currentChallenge) return null

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 relative rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 text-center shrink-0 shadow-md z-10 relative">
        <button 
          onClick={onComplete}
          className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-sm transition-colors"
        >
          تخطي ➔
        </button>
        <h2 className="text-xl font-black flex items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6" />
          تغيير السياق
        </h2>
        <p className="text-blue-100 text-sm mt-1">استمع للعبارة بسياقات مختلفة لتتعلم كيف تستخدمها</p>
      </div>

      <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto w-full max-w-2xl mx-auto gap-4">
        
        {/* Base Sentence Reference */}
        <div className="w-full bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm relative overflow-hidden min-h-fit flex flex-col justify-center">
          <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
            <RefreshCw className="w-24 h-24" />
          </div>
          <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider relative z-10">العبارة الأصلية</p>
          <p className="text-lg sm:text-xl font-black text-slate-800 relative z-10 leading-tight" dir="auto">{currentChallenge.baseNative || "..."}</p>
          <p className="text-sm sm:text-base text-slate-500 mt-2 font-medium relative z-10 leading-tight" dir="auto">{currentChallenge.baseTranslation}</p>
        </div>

        <p className="text-sm font-bold text-slate-400 mt-2">اضغط على السياقات البديلة للاستماع لها:</p>

        {/* Options */}
        <div className="w-full flex flex-col gap-3 pb-24">
          {variationsList.map((item, i) => {
            const isActive = activeVarIdx === i

            return (
              <button
                key={i}
                onClick={() => handleSelect(i, item.native)}
                className={`relative w-full p-4 rounded-2xl text-left transition-all cursor-pointer flex flex-col gap-3 ${
                  isActive 
                    ? "bg-blue-50 border-2 border-blue-400 shadow-md" 
                    : "bg-white border-2 border-slate-200 hover:border-blue-300 hover:bg-slate-50 shadow-sm"
                }`}
                dir="auto"
              >
                <div className="flex items-start justify-between w-full gap-3 sm:gap-4">
                  <span className={`text-base sm:text-lg font-bold flex-1 break-words leading-tight ${isActive ? 'text-blue-700' : 'text-slate-700'}`} dir="auto">
                    {item.native}
                  </span>
                  <div className={`p-2 rounded-full shrink-0 mt-0.5 ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                    {isActive ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </div>
                </div>
                
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden w-full"
                    >
                      <div className="pt-3 mt-2 border-t border-blue-200 flex flex-col gap-2" dir="auto">
                        <span className="text-blue-800 font-bold text-base">{item.arabic}</span>
                        <div className="text-xs text-blue-700 mt-1 font-bold bg-blue-100 inline-block px-3 py-1.5 rounded-lg w-fit">
                          استبدال بـ: {item.variation.ar}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            )
          })}
        </div>
      </div>

      {/* Next Step */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
        <Button3D 
          variant="primary" 
          size="lg" 
          className="w-full max-w-2xl mx-auto block !bg-blue-600 hover:!bg-blue-700 !text-white !border-b-4 !border-blue-800 !shadow-none !rounded-2xl" 
          onClick={handleNext}
        >
          {chalIdx < challenges.length - 1 ? 'العبارة التالية ➔' : 'أكملت الاستكشاف ➔'}
        </Button3D>
      </div>
    </div>
  )
}
