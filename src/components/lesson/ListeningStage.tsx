import { useState, useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import { Play, Pause } from 'lucide-react'
import { Button3D } from '@/components/ui/Button3D'
import { bcp47, speak, stopSpeaking } from '@/lib/tts'
import type { Lesson, DialogueLine } from '@/data/lessons/types'
import { useUserStore } from '@/store/userStore'

interface Props {
  lesson: Lesson
  onComplete: () => void
}

const SPEEDS = [1, 1.25, 1.5, 0.75]

export function ListeningStage({ lesson, onComplete }: Props) {
  const { uiLang } = useUserStore()
  const isAr = uiLang === 'ar'

  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const [playingAll, setPlayingAll] = useState(false)
  const [rateIdx, setRateIdx] = useState(0)
  const stopFlag = useRef(false)

  const rate = SPEEDS[rateIdx]

  useEffect(() => () => stopSpeaking(), [])

  const playLine = (line: DialogueLine, idx: number) => {
    stopFlag.current = true
    stopSpeaking()
    setActiveIdx(idx)
    setPlayingAll(false)
    speak(line.native, bcp47(lesson.lang), rate)
  }

  const playAll = async () => {
    if (playingAll) {
      stopFlag.current = true
      stopSpeaking()
      setPlayingAll(false)
      setActiveIdx(null)
      return
    }
    setPlayingAll(true)
    stopFlag.current = false
    for (let i = 0; i < lesson.dialogue.length; i++) {
      if (stopFlag.current) break
      const line = lesson.dialogue[i]
      setActiveIdx(i)
      speak(line.native, bcp47(lesson.lang), rate)
      const waitMs = Math.max(1200, (line.native.length * 95) / rate)
      await new Promise((r) => setTimeout(r, waitMs))
    }
    setPlayingAll(false)
    setActiveIdx(null)
  }

  return (
    <div className="w-full flex flex-col flex-1 min-h-0">
      {/* Controls */}
      <div className="flex items-center justify-between mb-4 bg-white/80 backdrop-blur-md text-slate-800 px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm flex-shrink-0">
        <Button3D
          variant="primary"
          size="sm"
          onClick={playAll}
          className="!bg-blue-600 hover:!bg-blue-700 !text-white !border-b-4 !border-blue-800 !shadow-none !rounded-xl px-6"
        >
          {playingAll ? (
            <><Pause className="w-4 h-4 mr-2 inline" /> {isAr ? 'إيقاف' : 'Pause'}</>
          ) : (
            <><Play className="w-4 h-4 mr-2 inline" /> {isAr ? 'استماع للكل' : 'Listen All'}</>
          )}
        </Button3D>

        <button
          onClick={() => setRateIdx((i) => (i + 1) % SPEEDS.length)}
          className="px-4 py-2 font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors border border-blue-200"
        >
          {rate}x
        </button>
      </div>

      {/* Dialogue — 2-column grid on md+ screens */}
      <div className="flex-1 overflow-y-auto pb-4" dir="ltr">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-1">
          {lesson.dialogue.map((line, idx) => {
            const isActive = activeIdx === idx
            const isRight = idx % 2 !== 0
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex gap-3 ${isRight ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className="w-10 h-10 shrink-0 rounded-full bg-blue-100 border-2 border-blue-300 flex items-center justify-center font-black text-base text-blue-700">
                  {line.character.charAt(0)}
                </div>

                {/* Bubble */}
                <div
                  onClick={() => playLine(line, idx)}
                  className={`flex-1 p-3 rounded-2xl cursor-pointer transition-all ${
                    isActive
                      ? 'bg-blue-100 border-2 border-blue-600 shadow-lg shadow-blue-500/20 scale-[1.02]'
                      : 'bg-white border-2 border-blue-300 hover:bg-blue-50 shadow-sm'
                  }`}
                  style={{
                    borderTopLeftRadius: isRight ? '1rem' : 0,
                    borderTopRightRadius: !isRight ? '1rem' : 0,
                  }}
                >
                  <div className="text-[11px] font-bold text-slate-500 mb-1">{line.character}</div>
                  <div className="text-base font-black tracking-wide text-slate-900">{line.native}</div>
                  {line.romaji && line.romaji !== line.native && (
                    <div className="text-[11px] font-mono mt-0.5 text-blue-600">{line.romaji}</div>
                  )}
                  <div className={`text-xs mt-2 pt-2 border-t flex flex-col gap-0.5 ${isActive ? 'border-blue-300' : 'border-slate-200'}`} dir="rtl">
                    <span className="font-semibold text-slate-600">{line.pronunciation}</span>
                    <span className="text-blue-700 font-bold">{line.translation}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Next Step — always pinned to bottom */}
      <div className="py-3 bg-white border-t border-slate-200 w-full flex-shrink-0">
        <Button3D variant="primary" size="lg" className="w-full !bg-blue-600 hover:!bg-blue-700 !text-white !border-b-4 !border-blue-800 !shadow-none !rounded-2xl" onClick={onComplete}>
          {isAr ? 'أكملت الاستماع ➔' : 'Finished Listening ➔'}
        </Button3D>
      </div>
    </div>
  )
}
