/**
 * منسّق المراحل الست + ترابط الدروس القصصي.
 *
 * كل درس = رحلة خطية لا رجعة فيها حتى الإكمال:
 *   1) الاستماع   → 2) القراءة  → 3) الحفظ (3 ألعاب)
 *   4) الممارسة   → 5) الراديو   → 6) المراجعة الفورية → ختم الدرس
 *
 * ترابط الدروس (حسب طلب المستخدم): كل درس يكمل سابقه ويبني عليه —
 * شخصيات ثابتة (Eli + Laith + خالد + سارة)، أحداث متسلسلة،
 * مفردات تُراكم عبر الأيام. يوفّر سياقًا للمولّد AI لخلق ترابط أفكار.
 */

import {
  isLessonComplete,
  useCardStore,
  type LessonProgress,
  type LangStr,
} from "./cardStore";
import { computeGate, type GateSnapshot } from "./reviewGate";
import type { PhraseTier } from "./tiers";

/** المراحل الست الإجبارية بالترتيب. */
export const LESSON_STAGES = [
  "listened", // 1) الاستماع
  "read", // 2) القراءة
  "memorized", // 3) الحفظ (3 ألعاب: سكاكين/زومبي/سياق)
  "practiced", // 4) الممارسة (محادثة AI)
  "radioDone", // 5) الراديو AI
  "immediateReviewDone", // 6) المراجعة الفورية
] as const;

export type LessonStageKey = (typeof LESSON_STAGES)[number];

/** أسماء عربية للمراحل حسب الوضع (قصة / عادي). */
export const STAGE_LABELS: Record<LessonStageKey, { story: string; normal: string }> = {
  listened: { story: "الاستماع — السوق مع إيلي ولايث", normal: "الاستماع" },
  read: { story: "القراءة — دفتر إيلي السحري", normal: "القراءة" },
  memorized: { story: "الحفظ — احتطاب وعفاريت ووحش بركلز", normal: "الحفظ (3 ألعاب)" },
  practiced: { story: "الممارسة — جلسة النار مع إيلي", normal: "الممارسة (محادثة AI)" },
  radioDone: { story: "الراديو — خالد وسارة يضحكان", normal: "الراديو AI" },
  immediateReviewDone: { story: "ختم الدرس", normal: "ختم الدرس" },
};

/** شرط الانتقال لكل مرحلة. */
export function stageRequirement(
  lang: LangStr,
  day: number,
  stage: LessonStageKey
): boolean {
  const p = useCardStore.getState().getLessonProgress(lang, day);
  switch (stage) {
    case "listened":
      return true; // أول مرحلة، مفتوحة دائمًا عند فتح الدرس
    case "read":
      return p.listened;
    case "memorized":
      return p.read;
    case "practiced":
      return p.memorized;
    case "radioDone":
      return p.practiced;
    case "immediateReviewDone":
      return p.radioDone;
  }
}

/** هل اكتمل الدرس كليًا (المراحل الست كلها)؟ */
export function isLessonDone(lang: LangStr, day: number): boolean {
  const p = useCardStore.getState().getLessonProgress(lang, day);
  return isLessonComplete(p);
}

/** هل الدرس مفتوح (السابق مكتمل كليًا)؟ */
export function isLessonUnlocked(
  lang: LangStr,
  day: number,
  startDay = 1
): boolean {
  if (day <= startDay) return true;
  // الدرس N مفتوح فقط إذا اكتمل N-1 كليًا.
  for (let d = startDay; d < day; d++) {
    if (!isLessonDone(lang, d)) return false;
  }
  return true;
}

/** أول درس مفتوح لم يُكمَل بعد. */
export function nextOpenLesson(lang: LangStr, startDay = 1): number {
  let d = startDay;
  while (isLessonUnlocked(lang, d, startDay)) {
    if (!isLessonDone(lang, d)) return d;
    d++;
  }
  return d;
}

/** علام المرحلة كمنجزة. */
export function completeStage(
  lang: LangStr,
  day: number,
  stage: LessonStageKey
): void {
  useCardStore.getState().markStageDone(lang, day, stage);
}

/** علام المراجعة الفورية كمنجزة (ويختم الدرس). */
export function completeImmediateReview(lang: LangStr, day: number): void {
  useCardStore.getState().markImmediateReviewDone(lang, day);
}

// ===================================================================
// ترابط الدروس القصصي — كل درس يكمل سابقه ويبني عليه
// ===================================================================

/** شخصيات القصة الثابتة عبر كل الدروس (هوية Lingo Blue v2). */
export const STORY_CHARACTERS = {
  eli: { name: "Eli", arabicName: "إيلي", role: "المعلمة الدافئة" },
  laith: { name: "Laith", arabicName: "ليث", role: "المتعلم الشاب المسافر" },
  khalid: { name: "Khalid", arabicName: "خالد", role: "مقدم الراديو الكوميدي" },
  sara: { name: "Sara", arabicName: "سارة", role: "مقدمة الراديو المرحة" },
} as const;

/** موقع القصة الحالي (يتقدّم مع الأيام — كل محطة = مشهد جديد). */
export interface StoryBeat {
  day: number;
  stationName: string;
  scene: string; // وصف المكان/الحدث
  arc: string; // خيط القصة المستمر
}

/**
 * يبني سياق الترابط القصصي لدرس معيّن، آخذًا بعين الاعتبار
 * ما حدث في الدروس السابقة. يُمرَّر للمولّد AI ليربط الأفكار.
 *
 * القاعدة: الدرس N يكمل الدرس N-1 — نفس الشخصيات، أحداث متسلسلة،
 * مفردات متراكمة. لا قفزات عشوائية.
 */
export function buildStoryContinuity(
  lang: LangStr,
  day: number,
  opts?: {
    stationName?: string;
    topicTitle?: string;
    cefr?: string;
  }
): {
  previousDay: number | null;
  previousSummary: string;
  currentScene: string;
  continuityPrompt: string;
  characters: typeof STORY_CHARACTERS;
} {
  const previousDay = day > 1 ? day - 1 : null;
  const store = useCardStore.getState();

  // ملخص ما تعلّمه المتعلم في الدرس السابق (العبارات الأساسية Core).
  let previousSummary = "هذا أول درس — بداية رحلة ليث في القرية.";
  if (previousDay !== null) {
    const prevCards = store.getLessonCards(lang, previousDay);
    const coreCards = prevCards
      .filter((c) => c.tier === "core")
      .slice(0, 5)
      .map((c) => c.native);
    if (coreCards.length > 0) {
      previousSummary = `في الدرس السابق تعلّم ليث: ${coreCards.join("، ")}. `;
    } else {
      previousSummary = `في الدرس السابق بدأ ليث رحلته في القرية. `;
    }
    const prevDone = isLessonDone(lang, previousDay);
    previousSummary += prevDone
      ? "وأكمل درسه بنجاح."
      : "لكنه لم يُكمل درسه بعد.";
  }

  const stationName = opts?.stationName ?? `المحطة ${Math.ceil(day / 6)}`;
  const topicTitle = opts?.topicTitle ?? `درس ${day}`;
  const cefr = opts?.cefr ?? "A1";

  // المشهد الحالي يتقدّم مع المحطات (ترابط مكاني).
  const currentScene = `المشهد: ${stationName} — ${topicTitle}. ليث الآن في يومه ${day}.`;

  // برومبت الترابط للمولّد.
  const continuityPrompt = [
    `هذا الدرس ${day} في رحلة ليث المتواصلة.`,
    `الشخصيات الثابتة: إيلي (معلمته) ولايث (المتعلم) — لا تغيّر أسماءهم.`,
    `${previousSummary}`,
    `ابنِ على ما تعلّمه سابقًا: استخدم بعض الكلمات من الدرس السابق وطوّرها.`,
    `المستوى: ${cefr}. اجعل الحوار يكمل أحداث الأمس مباشرة.`,
  ].join(" ");

  return {
    previousDay,
    previousSummary,
    currentScene,
    continuityPrompt,
    characters: STORY_CHARACTERS,
  };
}

// ===================================================================
// حالة المتعلم الموحّدة (LearnerState من الخطة 1.2)
// ===================================================================

export interface LearnerState {
  lang: LangStr;
  level: string;
  currentDay: number;
  mode: "story" | "normal";
  gate: GateSnapshot;
  lessonProgress: LessonProgress;
  isUnlocked: boolean;
  isDone: boolean;
}

/** يجمع كل حالة المتعلم في كائن واحد (للعرض في الواجهة). */
export function getLearnerState(
  lang: LangStr,
  day: number,
  startDay = 1
): LearnerState {
  const store = useCardStore.getState();
  const gate = computeGate(lang, startDay);
  return {
    lang,
    level: "A1",
    currentDay: day,
    mode: store.mode,
    gate,
    lessonProgress: store.getLessonProgress(lang, day),
    isUnlocked: isLessonUnlocked(lang, day, startDay),
    isDone: isLessonDone(lang, day),
  };
}

/** يبني قائمة العبارات الجاهزة للإضافة من درس (مع التصنيف التلقائي). */
export function buildLessonPhrases(
  dialogue: { native: string; translation: string; character?: string; tier?: PhraseTier }[]
): {
  native: string;
  translation: string;
  tier: PhraseTier;
  character?: string;
}[] {
  return dialogue.map((line) => ({
    native: line.native,
    translation: line.translation,
    tier: line.tier ?? "secondary",
    character: line.character,
  }));
}
