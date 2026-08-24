import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Clock, PlayCircle, Flame, CheckCircle2 } from 'lucide-react'
import { Button3D } from '@/components/ui/Button3D'
import { useUserStore } from '@/store/userStore'
import { useReviewStore } from '@/store/reviewStore'

function CountdownTimer({ targetTime }: { targetTime: number }) {
  const [timeLeft, setTimeLeft] = useState(targetTime - Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(targetTime - Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [targetTime])

  if (timeLeft <= 0) return <span className="text-red-500 font-bold">مستحقة الآن!</span>

  const hours = Math.floor(timeLeft / (1000 * 60 * 60))
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

  let timeString = ''
  if (hours > 0) timeString += `${hours}س `
  if (minutes > 0 || hours > 0) timeString += `${minutes}د `
  timeString += `${seconds}ث`

  return <span className="font-mono text-slate-700 font-bold" dir="ltr">{timeString}</span>
}

export default function ReviewPage() {
  const { uiLang } = useUserStore()
  const isAr = uiLang === 'ar'
  const { cards } = useReviewStore()

  // force re-render every minute so cards automatically move from upcoming to due if we are idle
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(timer)
  }, [])

  const now = Date.now()
  const dueCards = cards.filter(c => c.nextReviewAt <= now)
  const upcomingCards = cards.filter(c => c.nextReviewAt > now).sort((a, b) => a.nextReviewAt - b.nextReviewAt)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8 min-h-screen">
      <div className="text-center space-y-2">
        <div className="text-6xl mb-4 animate-bounce-soft">🃏</div>
        <h1 className="text-3xl font-black text-slate-800">{isAr ? 'المراجعة الذكية' : 'Smart Review'}</h1>
        <p className="text-slate-500 font-medium">
          {isAr ? 'نظام التكرار المتباعد لضمان عدم النسيان أبدًا!' : 'Spaced repetition system to ensure you never forget!'}
        </p>
      </div>

      {cards.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-200">
          <p className="text-lg font-bold text-slate-600 mb-2">
            {isAr ? 'لا توجد بطاقات مسجلة حالياً' : 'No cards saved currently'}
          </p>
          <p className="text-sm text-slate-400">
            {isAr ? 'أكمل درسك الأول لتبدأ بإضافة العبارات إلى صندوق المراجعة!' : 'Complete your first lesson to start adding phrases to the review box!'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Due Cards */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-black text-slate-800">
                {isAr ? 'بطاقات مستحقة الآن' : 'Cards Due Now'}
                <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-sm">
                  {dueCards.length}
                </span>
              </h2>
            </div>

            {dueCards.length === 0 ? (
              <div className="bg-slate-100 rounded-2xl p-6 text-center text-slate-500 font-bold border border-slate-200/50">
                {isAr ? 'رائع! لا توجد بطاقات متأخرة.' : 'Awesome! No overdue cards.'}
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
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                    <div className="flex-1" dir="ltr">
                      <p className="font-black text-lg text-slate-800">{card.native}</p>
                      <p className="text-sm font-bold text-slate-500 mt-1" dir={isAr ? 'rtl' : 'ltr'}>{card.translation}</p>
                    </div>
                    <Button3D variant="primary" size="sm" className="!bg-red-500 hover:!bg-red-600 !border-red-700 !text-white shrink-0 w-full sm:w-auto text-sm px-6">
                      <PlayCircle className="w-4 h-4 mr-2 inline" />
                      {isAr ? 'ابدأ المراجعة' : 'Start Review'}
                    </Button3D>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Cards */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-black text-slate-800">
                {isAr ? 'بطاقات قادمة' : 'Upcoming Cards'}
                <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-sm">
                  {upcomingCards.length}
                </span>
              </h2>
            </div>

            {upcomingCards.length === 0 ? (
              <div className="bg-slate-100 rounded-2xl p-6 text-center text-slate-500 font-bold border border-slate-200/50">
                {isAr ? 'لا توجد بطاقات قادمة حالياً.' : 'No upcoming cards currently.'}
              </div>
            ) : (
              <div className="grid gap-3">
                {upcomingCards.map(card => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400"></div>
                    <div className="flex-1 opacity-80" dir="ltr">
                      <p className="font-bold text-base text-slate-700">{card.native}</p>
                      <p className="text-xs font-semibold text-slate-500 mt-1" dir={isAr ? 'rtl' : 'ltr'}>{card.translation}</p>
                    </div>
                    <div className="shrink-0 w-full sm:w-auto bg-blue-100/50 px-4 py-2 rounded-xl flex items-center justify-between sm:justify-center gap-3 border border-blue-200/50">
                      <span className="text-xs font-bold text-slate-500">{isAr ? 'المراجعة بعد:' : 'Review in:'}</span>
                      <CountdownTimer targetTime={card.nextReviewAt} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
