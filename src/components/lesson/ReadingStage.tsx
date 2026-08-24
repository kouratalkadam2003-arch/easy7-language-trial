import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Eye, EyeOff, Flame, Star, Sprout, Check } from 'lucide-react'
import { Button3D } from '@/components/ui/Button3D'
import { SurfaceCard } from '@/components/ui/SurfaceCard'
import type { Lesson, DialogueLine, Tier } from '@/data/lessons/types'
import { useUserStore } from '@/store/userStore'

interface Props {
  lesson: Lesson
  onComplete: () => void
}

const TIER_META: Record<Tier, { label: string; icon: any; color: string }> = {
  core: { label: 'أساسية', icon: Flame, color: '#FF4B4B' },
  medium: { label: 'متوسّطة', icon: Star, color: '#FF9600' },
  secondary: { label: 'ثانوية', icon: Sprout, color: '#58CC02' },
}

export function ReadingStage({ lesson, onComplete }: Props) {
  const { uiLang } = useUserStore()
  const isAr = uiLang === 'ar'

  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [filter, setFilter] = useState<Tier | 'all'>('all')

  const toggleReveal = (idx: number) => {
    const next = new Set(revealed)
    if (next.has(idx)) next.delete(idx)
    else next.add(idx)
    setRevealed(next)
  }

  const revealAll = () => {
    if (revealed.size === lesson.dialogue.length) {
      setRevealed(new Set())
    } else {
      setRevealed(new Set(lesson.dialogue.map((_, i) => i)))
    }
  }

  const visibleLines = lesson.dialogue.map((line, idx) => ({ line, idx })).filter(
    (item) => filter === 'all' || item.line.tier === filter
  )

  const isAllRevealed = revealed.size === lesson.dialogue.length

  return (
    <div className="w-full flex flex-col flex-1 min-h-0">
      {/* Controls */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between">
          <Button3D variant="ghost" size="sm" onClick={revealAll}>
            {isAllRevealed ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {isAllRevealed ? (isAr ? 'إخفاء الكل' : 'Hide All') : (isAr ? 'إظهار الكل' : 'Reveal All')}
          </Button3D>
          
          <div className="flex items-center gap-1 bg-white/80 backdrop-blur-md p-1 rounded-xl border border-white/40 text-slate-600 shadow-sm">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'all' ? 'bg-blue-500 text-white' : 'text-slate-500 hover:text-blue-500 hover:bg-white/50'}`}
            >
              {isAr ? 'الكل' : 'All'}
            </button>
            {(Object.entries(TIER_META) as [Tier, any][]).map(([tier, meta]) => {
               const active = filter === tier
               return (
                 <button
                   key={tier}
                   onClick={() => setFilter(tier)}
                   className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all`}
                   style={{
                     backgroundColor: active ? meta.color + '20' : 'transparent',
                     color: active ? meta.color : 'var(--muted-foreground)'
                   }}
                 >
                   <meta.icon className="w-3 h-3" />
                 </button>
               )
            })}
          </div>
        </div>
      </div>

      {/* Diary Cards */}
      <div className="flex-1 overflow-y-auto space-y-3 px-1 pb-4">
        <AnimatePresence>
          {visibleLines.map(({ line, idx }) => {
            const isRev = revealed.has(idx)
            const meta = TIER_META[line.tier]
            
            return (
              <motion.div
                key={idx}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-white rounded-2xl border-2 border-blue-400 overflow-hidden cursor-pointer hover:bg-slate-50 shadow-sm transition-all text-slate-800"
                onClick={() => toggleReveal(idx)}
              >
                {/* Tier indicator */}
                <div 
                  className="absolute top-0 start-0 w-1.5 h-full"
                  style={{ backgroundColor: meta.color }}
                />

                <div className="p-4 ps-6">
                  <div className="flex justify-between items-start mb-1" dir="ltr">
                    <div>
                      <div className="text-xl font-black text-slate-800">{line.native}</div>
                      {line.romaji && line.romaji !== line.native && (
                        <div className="text-xs font-mono text-blue-600 font-semibold">{line.romaji}</div>
                      )}
                    </div>
                    <meta.icon className="w-4 h-4 opacity-50 shrink-0" style={{ color: meta.color }} />
                  </div>
                  
                  {/* Arabic Pronunciation & Translation */}
                  <div dir="rtl" className="mt-2 pt-2 border-t border-slate-200/80">
                    <div className="text-xs font-bold text-slate-500 mb-0.5">{line.pronunciation}</div>
                    {isRev ? (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-base font-bold text-blue-600"
                      >
                        {line.translation}
                      </motion.div>
                    ) : (
                      <div className="h-6 bg-blue-500/10 rounded-md animate-pulse max-w-[200px]" />
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Next Step */}
      <div className="py-3 bg-white border-t border-black/10 w-full flex-shrink-0">
        <Button3D variant="primary" size="lg" className="w-full !bg-blue-600 hover:!bg-blue-700 !text-white !border-b-4 !border-blue-800 !shadow-none !rounded-2xl" onClick={onComplete}>
          {isAr ? 'قرأت اليوميات 📖 ➔' : 'Read Diary 📖 ➔'}
        </Button3D>
      </div>
    </div>
  )
}
