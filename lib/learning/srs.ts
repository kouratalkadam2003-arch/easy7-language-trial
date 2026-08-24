/**
 * خوارزمية التكرار المتباعد (SM-2 المبسطة) — المحرك الأساسي لحفظ الكلمات.
 * لا يوجد صراع بين المراجعة الإجبارية ومنحنى النسيان.
 */

export type Rating = 'again' | 'hard' | 'good' | 'easy'

export type SM2State = {
  phraseId: string
  ease: number
  interval: number // بالأيام
  reps: number
  lapses: number
  dueAt: number // timestamp (ms)
  lastReviewedAt: number | null
}

const DAY_MS = 24 * 60 * 60 * 1000
const MIN_EASE = 1.3

/**
 * تهيئة بطاقة جديدة لأول مرة
 */
export function createSM2State(phraseId: string, now: number = Date.now()): SM2State {
  return {
    phraseId,
    ease: 2.5,
    interval: 0,
    reps: 0,
    lapses: 0,
    dueAt: now,
    lastReviewedAt: null,
  }
}

/**
 * تحديث حالة البطاقة بناءً على التقييم (SM-2)
 */
export function applySM2Result(
  state: SM2State,
  rating: Rating,
  now: number = Date.now()
): SM2State {
  let { ease, interval, reps, lapses } = state

  switch (rating) {
    case 'again':
      interval = 0
      ease = Math.max(MIN_EASE, ease - 0.20)
      reps = 0
      lapses += 1
      break

    case 'hard':
      interval = interval === 0 ? 0.5 : interval * 1.2
      ease = Math.max(MIN_EASE, ease - 0.15)
      reps += 1
      break

    case 'good':
      if (reps === 0) {
        interval = 1
      } else if (reps === 1) {
        interval = 6
      } else {
        interval = interval * ease
      }
      reps += 1
      break

    case 'easy':
      if (reps === 0) {
        interval = 1 * ease * 1.3 // 3.25 days for brand new 'easy'
      } else if (reps === 1) {
        interval = 6 * ease * 1.3 
      } else {
        interval = interval * ease * 1.3
      }
      ease += 0.15
      reps += 1
      break
  }

  return {
    ...state,
    ease,
    interval,
    reps,
    lapses,
    dueAt: now + interval * DAY_MS,
    lastReviewedAt: now,
  }
}

export function isDue(state: SM2State, now: number = Date.now()): boolean {
  return state.dueAt <= now
}

/**
 * ترتيب البطاقات المستحقة: الأصعب أولاً (حسب lapses ثم ease ثم dueAt)
 */
export function buildDueQueue(
  states: SM2State[],
  now: number = Date.now(),
  limit: number = 20
): SM2State[] {
  return states
    .filter((s) => isDue(s, now))
    .sort((a, b) => {
      if (b.lapses !== a.lapses) return b.lapses - a.lapses // Lapses DESC
      if (a.ease !== b.ease) return a.ease - b.ease       // Ease ASC
      return a.dueAt - b.dueAt                            // DueAt ASC
    })
    .slice(0, limit)
}

/** عدد البطاقات المستحقة الآن (تستخدم للتأثير على شكل المزرعة ومنع التقدم) */
export function dueCount(states: SM2State[], now: number = Date.now()): number {
  return states.filter((s) => isDue(s, now)).length
}
