import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Node3D } from '@/components/ui/Node3D'
import { SurfaceCard } from '@/components/ui/SurfaceCard'
import { useUserStore } from '@/store/userStore'
import { Lock, Check, Star, Crown } from 'lucide-react'

// Curriculum data from خطة دروس lingo v2
import { NORMAL_UNITS } from '@/data/curriculum/normalMap'
import { STORY_UNITS } from '@/data/curriculum/storyMap'


// Zigzag pattern for saga path
const ZIGZAG_OFFSETS = [0, 40, 70, 40, 0, -40, -70, -40]

export default function LearnPage() {
  const navigate = useNavigate()
  const { uiLang, gameMode } = useUserStore()
  const isAr = uiLang === 'ar'

  // For now, first node is current, rest locked
  const completedDays: string[] = []

  let globalIdx = 0

  return (
    <div className="min-h-dvh bg-slate-50 relative overflow-hidden text-slate-900 pb-32" dir="rtl">
      {/* Soft ambient background element */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-100/50 -top-32 -right-32 blur-3xl" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-sky-100/40 top-1/2 -left-32 blur-3xl" />
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-10 relative z-10">

      {(gameMode === 'story' ? STORY_UNITS : NORMAL_UNITS).map((unit) => {
        const unitNodes = unit.topics.map((topic) => {
          const done = completedDays.includes(topic.id)
          let status: 'completed' | 'active' | 'locked' = 'locked'
          if (done) status = 'completed'
          else if (globalIdx === 0 || completedDays.includes(unit.topics[0]?.id)) {
            if (!done && !completedDays.length && globalIdx === 0) status = 'active'
          }
          if (globalIdx === 0 && !done) status = 'active'
          const idx = globalIdx++
          return { ...topic, status, idx }
        })

        return (
          <div key={unit.id} className="space-y-6">
            {/* Unit Banner — White background with custom color accent per station */}
            <div className="p-5 rounded-3xl bg-white text-slate-900 shadow-md border-2 border-slate-100 flex items-center justify-between z-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 bottom-0 w-2.5" style={{ backgroundColor: unit.color }} />
              <div className="pr-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black text-white shadow-xs" style={{ backgroundColor: unit.color }}>
                    {unit.level}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {isAr ? `الوحدة ${unit.id}` : `Unit ${unit.id}`}
                  </span>
                </div>
                <div className="font-black text-xl text-slate-900">{isAr ? unit.title : unit.titleEn}</div>
                <div className="text-xs font-medium text-slate-500 mt-0.5">{unit.storyTitle}</div>
              </div>
              <div className="text-4xl p-2 rounded-2xl bg-slate-50 border border-slate-100 shadow-xs">
                {unit.id === 1 ? '🏖️' : unit.id === 2 ? '🏡' : unit.id === 3 ? '🏗️' : '⚔️'}
              </div>
            </div>

            {/* Saga path nodes */}
            <div className="flex flex-col items-center gap-7 py-4">
              {unitNodes.map((node, i) => {
                const offset = ZIGZAG_OFFSETS[i % ZIGZAG_OFFSETS.length]
                return (
                  <motion.div
                    key={node.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.08 }}
                    style={{ transform: `translateX(${offset}px)` }}
                    className="flex flex-col items-center gap-2"
                  >
                    <Node3D
                      state={node.status}
                      color={unit.color}
                      onClick={() => {
                        if (node.status !== 'locked') {
                          if (gameMode === 'story') {
                            // topic.day is the continuous day number 1..180 → story lesson day
                            navigate(`/story?day=${node.day}`)
                          } else {
                            navigate(`/lesson/${node.id}`)
                          }
                        }
                      }}
                    >
                      {node.status === 'completed' ? (
                        <Check className="w-6 h-6" />
                      ) : node.status === 'locked' ? (
                        <Lock className="w-5 h-5" />
                      ) : (
                        <span className="text-2xl">{node.emoji}</span>
                      )}
                    </Node3D>

                    <span className={`text-xs font-bold ${node.status === 'locked' ? 'text-slate-400' : 'text-slate-700'}`}>
                      {isAr ? node.title : node.titleEn}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* End of available content */}
      <div className="text-center py-10 space-y-3">
        <div className="text-5xl">🏗️</div>
        <p className="font-bold text-muted-foreground">
          {isAr ? 'المزيد من الوحدات قادمة قريباً...' : 'More units coming soon...'}
        </p>
      </div>
    </div>
  </div>
  )
}
