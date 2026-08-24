/**
 * خوارزمية التكرار المتباعد (SM-2 مبسّطة حسب الـ tier) — نقية، بلا React.
 * قابلة للنقل إلى أي منصة (React خام / Dart) دون تعديل.
 */

import type { PhraseTier } from './phrases'

/** فواصل المراجعة بالأيام لكل مستوى صندوق (box) حسب الـ tier */
export const INTERVALS_DAYS: Record<PhraseTier, number[]> = {
  core: [0, 1, 3, 7, 16, 35],
  medium: [0, 2, 7, 21, 60],
  secondary: [0, 7, 30],
}

/** حد أقصى للبطاقات في الجلسة الواحدة — منع الإرهاق */
export const MAX_CARDS_PER_SESSION = 12

export type ReviewState = {
  phraseId: string
  tier: PhraseTier
  /** 0..(intervals.length-1) */
  box: number
  /** timestamp (ms) لموعد المراجعة القادمة */
  nextReview: number
  /** عدد مرات الفشل التراكمي */
  lapses: number
}

const DAY_MS = 24 * 60 * 60 * 1000

export function createReviewState(
  phraseId: string,
  tier: PhraseTier,
  now: number = Date.now(),
): ReviewState {
  return { phraseId, tier, box: 0, nextReview: now, lapses: 0 }
}

function maxBox(tier: PhraseTier): number {
  return INTERVALS_DAYS[tier].length - 1
}

/**
 * نجاح → box+1 (حتى الحد الأقصى)
 * فشل → core يتراجع صندوقاً واحداً فقط (لا صفر: منع الإحباط)؛
 *        medium/secondary يعودان للصندوق 0
 */
export function applyResult(
  state: ReviewState,
  success: boolean,
  now: number = Date.now(),
): ReviewState {
  let box: number
  let lapses = state.lapses
  if (success) {
    box = Math.min(state.box + 1, maxBox(state.tier))
  } else {
    lapses += 1
    box = state.tier === 'core' ? Math.max(state.box - 1, 0) : 0
  }
  const intervalDays = INTERVALS_DAYS[state.tier][box]
  return { ...state, box, lapses, nextReview: now + intervalDays * DAY_MS }
}

export function isDue(state: ReviewState, now: number = Date.now()): boolean {
  return state.nextReview <= now
}

const TIER_PRIORITY: Record<PhraseTier, number> = { core: 0, medium: 1, secondary: 2 }

/**
 * بناء جلسة مراجعة: البطاقات المستحقة فقط،
 * Core أولاً دائماً، ثم الأقدم استحقاقاً، بحد أقصى MAX_CARDS_PER_SESSION،
 * وبلا تكرار لنفس العبارة في الجلسة.
 */
export function buildSession(
  states: ReviewState[],
  now: number = Date.now(),
  limit: number = MAX_CARDS_PER_SESSION,
): ReviewState[] {
  const seen = new Set<string>()
  return states
    .filter((s) => isDue(s, now))
    .filter((s) => (seen.has(s.phraseId) ? false : (seen.add(s.phraseId), true)))
    .sort(
      (a, b) => TIER_PRIORITY[a.tier] - TIER_PRIORITY[b.tier] || a.nextReview - b.nextReview,
    )
    .slice(0, limit)
}

/** عدد البطاقات المستحقة الآن */
export function dueCount(states: ReviewState[], now: number = Date.now()): number {
  return states.filter((s) => isDue(s, now)).length
}
