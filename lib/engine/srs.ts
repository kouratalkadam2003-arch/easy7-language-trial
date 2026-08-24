/**
 * خوارزمية SM-2 الموحّدة — المحرك الوحيد للتكرار المتباعد في التطبيق.
 *
 * يلتزم ببرومبت "نظام المراجعة" (تطبيق 90 يوم) كما هو موصوف في الخطة:
 *   - again: يعود اليوم (lapses+1)
 *   - hard:  ×1.2 (ease-0.15)
 *   - good:  reps=0→1يوم, reps=1→6أيام, ثم ×ease
 *   - easy:  ×ease×1.3 (ease+0.15)
 *
 * قبل دخول SM-2 القياسي، تُستنزف الفواصل الأولية من `tiers.ts`
 * (Core: دقيقة→10د→1ي→3ي→7ي→14ي→30ي) لإرادة أفضل للمنحنى المبكّر.
 *
 * هذا الملف يحلّ محل: utils/srs.ts (الفواصل الثابتة) + lib/learning/srs.ts.
 */

import { INITIAL_INTERVAL_DAYS, TIER_ORDER, type PhraseTier } from "./tiers";

export type SrsGrade = "again" | "hard" | "good" | "easy";

export interface SrsState {
  ease: number; // معامل السهولة
  interval: number; // الفاصل بالأيام (قد يكون كسريًا للدقائق)
  reps: number; // عدد المراجعات الناجحة المتتالية
  lapses: number; // عدد مرات النسيان
  dueAt: number; // موعد الاستحقاق التالي (epoch ms)
  lastReviewedAt: number | null; // آخر تقييم
  lastGrade?: SrsGrade; // آخر تقييم (للترتيب)
}

export const MIN_EASE = 1.3;
export const DEFAULT_EASE = 2.5;
export const DAY_MS = 86_400_000;

/**
 * حالة ابتدائية لبطاقة جديدة.
 * أول استحقاق بعد الفاصل الأولي للطبقة (دقيقة لـ Core).
 */
export function initialSrs(tier: PhraseTier, now: number = Date.now()): SrsState {
  const firstInterval = INITIAL_INTERVAL_DAYS[tier]?.[0] ?? 1;
  return {
    ease: DEFAULT_EASE,
    interval: 0,
    reps: 0,
    lapses: 0,
    dueAt: now + firstInterval * DAY_MS,
    lastReviewedAt: null,
  };
}

/**
 * يحسب الحالة الجديدة بعد تقييم المستخدم.
 * يحترم جدول الفواصل الأولية حتى استنفادها، ثم ينتقل إلى SM-2 القياسي.
 *
 * القاعدة الذهبية للفواصل الأولية:
 *   - reps يحدد مؤشر الخطوة الحالية داخل INITIAL_INTERVAL_DAYS[tier].
 *   - "good" يتقدّم خطوة، "easy" خطوتين، "hard" يبقى/يتأخر، "again" يصفّر.
 */
export function grade(
  state: SrsState,
  tier: PhraseTier,
  g: SrsGrade,
  now: number = Date.now()
): SrsState {
  let { ease, interval, reps, lapses } = state;
  const initialSteps = INITIAL_INTERVAL_DAYS[tier];
  const inInitialPhase = reps < initialSteps.length;

  switch (g) {
    case "again":
      ease = Math.max(MIN_EASE, ease - 0.2);
      interval = 0; // تعود اليوم
      reps = 0;
      lapses += 1;
      break;

    case "hard":
      ease = Math.max(MIN_EASE, ease - 0.15);
      if (inInitialPhase) {
        // ابقَ على نفس الخطوة أو ارجع خطوة (لا تقفز للأمام)
        interval = initialSteps[Math.max(0, reps - 1)] ?? interval * 1.2;
      } else {
        interval = interval * 1.2; // ×1.2 حسب القاعدة
      }
      reps += 1;
      break;

    case "good":
      if (inInitialPhase) {
        // تقدّم خطوة في الفواصل الأولية
        interval = initialSteps[reps + 1] ?? initialSteps[initialSteps.length - 1];
      } else if (reps === 0) {
        interval = 1; // reps=0 → 1 يوم
      } else if (reps === 1) {
        interval = 6; // reps=1 → 6 أيام
      } else {
        interval = interval * ease; // ثم ×ease
      }
      reps += 1;
      break;

    case "easy":
      ease = ease + 0.15;
      if (inInitialPhase) {
        // قفز خطوة إضافية للأمام
        const jump = Math.min(reps + 2, initialSteps.length - 1);
        interval = initialSteps[jump];
      } else if (reps === 0) {
        interval = 1 * ease * 1.3;
      } else if (reps === 1) {
        interval = 6 * ease * 1.3;
      } else {
        interval = interval * ease * 1.3; // ×ease×1.3
      }
      reps += 1;
      break;
  }

  const dueAt = now + Math.max(0, interval) * DAY_MS;

  return {
    ease,
    interval,
    reps,
    lapses,
    dueAt,
    lastReviewedAt: now,
    lastGrade: g,
  };
}

/** هل البطاقة مستحقة الآن؟ */
export function isDue(state: SrsState, now: number = Date.now()): boolean {
  return state.dueAt <= now;
}

/** ترتيب المستحقّات: Core→Medium→Secondary، ثم الأصعب أولًا داخل كل طبقة. */
export function compareDue(
  a: { tier: PhraseTier; state: SrsState },
  b: { tier: PhraseTier; state: SrsState }
): number {
  const t = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
  if (t !== 0) return t; // Core أولاً
  const l = b.state.lapses - a.state.lapses; // lapses DESC
  if (l !== 0) return l;
  const e = a.state.ease - b.state.ease; // ease ASC
  if (e !== 0) return e;
  return a.state.dueAt - b.state.dueAt; // dueAt ASC (الأقدم)
}

/** تنسيق موعد المراجعة القادم لعرضه للمستخدم. */
export function formatNextReview(dueAt: number, now: number = Date.now()): string {
  const diff = dueAt - now;
  if (diff <= 0) return "الآن";
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `بعد ${mins} دقيقة`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `بعد ${hrs} ساعة`;
  const days = Math.round(hrs / 24);
  if (days === 1) return "غدًا";
  if (days < 7) return `بعد ${days} أيام`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `بعد ${weeks} أسابيع`;
  const months = Math.round(days / 30);
  return `بعد ${months} شهور`;
}
