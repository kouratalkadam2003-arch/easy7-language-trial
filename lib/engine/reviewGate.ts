/**
 * بوابة المراجعة الثلاثية — تحكم ترتيب ما يظهر للمتعلم عند فتح التطبيق.
 *
 * الترتيب الإلزامي (من برومبت 90 يوم + الخطة v2):
 *   (أ) مراجعة فورية معلّقة  → اعرضها واقفل كل شيء
 *   (ب) مراجعة يومية إجبارية → اعرضها واقفل درس اليوم
 *   (ج) مراجعة منحنى النسيان (Core→Medium→Secondary) → متاحة دائمًا
 *   (د) درس اليوم             → مفتوح فقط بعد (أ) و (ب)
 *
 * القاعدة الذهبية: لا يُفتح الدرس التالي حتى يُختم سابقه كاملًا
 * (المراحل الست + المراجعة الفورية) + المراجعة اليومية.
 */

import { useCardStore, type LangStr } from "./cardStore";

export type GateBlocker =
  | { kind: "immediate"; day: number; cardCount: number }
  | { kind: "daily"; day: number; cardCount: number }
  | { kind: "none" };

export interface GateSnapshot {
  /** الحاجز الأعلى أولوية (أ) ثم (ب). "none" = لا حاجز. */
  blocker: GateBlocker;
  /** عدد البطاقات المستحقة الآن (لمنحنى النسيان). */
  dueCount: number;
  /** المستحقّات الصعبة (lapses>0) — للتنبيه القصصي. */
  hardDueCount: number;
  /** أعلى درس اكتمل كليًا. */
  highestCompletedDay: number;
  /** الدرس التالي المفتوح (= highestCompletedDay + 1). */
  nextUnlockedDay: number;
  /** هل يُسمح بفتح درس جديد الآن؟ */
  canOpenNewLesson: boolean;
}

/**
 * يحسب لقطة البوابة للّغة المعطاة. selector نقّي يُستدعى داخل React أو خارجه.
 * @param startDay أول درس في المسار (افتراضيًا 1).
 */
export function computeGate(lang: LangStr, startDay = 1): GateSnapshot {
  const store = useCardStore.getState();
  const pendingImmediate = store.getPendingImmediateReview(lang);
  const highest = store.getHighestCompletedDay(lang);
  const dailyPending = store.isDailyReviewPending(lang);
  const dueCards = store.getDueCards(lang);
  const dueCount = dueCards.length;
  const hardDue = dueCards.filter((c) => c.lapses > 0).length;

  let blocker: GateBlocker = { kind: "none" };
  if (pendingImmediate !== null) {
    // (أ) مراجعة فورية معلّقة → اقفل كل شيء
    const cardCount = store.getLessonCards(lang, pendingImmediate).length;
    blocker = { kind: "immediate", day: pendingImmediate, cardCount };
  } else if (dailyPending && highest > 0) {
    // (ب) مراجعة يومية إجبارية → اقفل درس اليوم فقط
    const cardCount = store.getLessonCards(lang, highest).length;
    blocker = { kind: "daily", day: highest, cardCount };
  }

  const nextUnlockedDay = Math.max(startDay, highest + 1);
  const canOpenNewLesson = blocker.kind === "none";

  return {
    blocker,
    dueCount,
    hardDueCount: hardDue,
    highestCompletedDay: highest,
    nextUnlockedDay,
    canOpenNewLesson,
  };
}

/**
 * خطّاف تفاعلي يحسب البوابة ويعيد حسابها عند تغيّر المخزن.
 * يُستخدم في المكوّنات بدل استدعاء computeGate يدويًا.
 */
export function subscribeGate(
  lang: LangStr,
  onChange: (snapshot: GateSnapshot) => void
): () => void {
  // نُعاد الحساب عند أي تغيّر في cards/progress/dailyReviewLastDoneOn.
  const unsub = useCardStore.subscribe(() => {
    onChange(computeGate(lang));
  });
  // أرسل اللقطة الأولى فورًا.
  onChange(computeGate(lang));
  return unsub;
}
