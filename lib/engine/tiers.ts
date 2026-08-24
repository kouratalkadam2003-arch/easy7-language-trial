/**
 * التصنيف الثلاثي للعبارات — العمود الفقري لكل نظام التطبيق.
 *
 * كل عبارة تُوسَم بأحد التصنيفات الثلاثة عند إعداد الدرس، وهذا التصنيف
 * يحكم: كم مرة تظهر، أين تظهر (استماع/قراءة/ألعاب/ممارسة/راديو/SRS)،
 * وجدول فواصل المراجعة الأولية قبل دخول SM-2 القياسي.
 *
 * المرجع: برومبت "نظام المراجعة" (تطبيق 90 يوم) + docs/easy7-extraction.md.
 */

export type PhraseTier = "core" | "medium" | "secondary";

export const TIER_ORDER: Record<PhraseTier, number> = {
  core: 0,
  medium: 1,
  secondary: 2,
};

/**
 * الفواصل الزمنية الأولية بالأيام (قيم كسرية = أجزاء من اليوم).
 * نستنفد هذه الفواصل أولًا، ثم ينتقل المحرك إلى SM-2 القياسي.
 * - القيمة الكسرية مثل 1/1440 = دقيقة واحدة.
 */
export const INITIAL_INTERVAL_DAYS: Record<PhraseTier, number[]> = {
  core: [1 / 1440, 10 / 1440, 1, 3, 7, 14, 30], // دقيقة → 10د → 1ي → 3ي → 7ي → 14ي → 30ي
  medium: [3, 10, 25],
  secondary: [15, 45],
};

/** حدود ظهور العبارات في كل درس (إرشاد لمولّد المحتوى). */
export const TIER_LESSON_LIMITS: Record<PhraseTier, { max?: number }> = {
  core: { max: 7 },
  medium: { max: 10 },
  secondary: {},
};

/** الألعاب/المراحل التي تدخلها كل عبارة حسب تصنيفها. */
export const TIER_STAGES: Record<
  PhraseTier,
  {
    listening: boolean;
    reading: boolean;
    knifeHit: boolean;
    zombieFight: boolean;
    contextChange: boolean;
    practice: boolean;
    radio: boolean;
    srs: boolean;
  }
> = {
  core: {
    listening: true,
    reading: true,
    knifeHit: true,
    zombieFight: true,
    contextChange: true,
    practice: true,
    radio: true,
    srs: true,
  },
  medium: {
    listening: true,
    reading: true,
    knifeHit: true,
    zombieFight: false,
    contextChange: false,
    practice: true,
    radio: true,
    srs: true,
  },
  secondary: {
    listening: true,
    reading: true,
    knifeHit: false,
    zombieFight: false,
    contextChange: false,
    practice: false,
    radio: false,
    srs: true,
  },
};

/** تسميات + رموز للواجهة (شارات 🔴🟠🟢). */
export const TIER_META: Record<
  PhraseTier,
  { emoji: string; label: string; labelAr: string; colorVar: string }
> = {
  core: {
    emoji: "🔴",
    label: "Core",
    labelAr: "أساسي",
    colorVar: "var(--color-heart)",
  },
  medium: {
    emoji: "🟠",
    label: "Medium",
    labelAr: "متوسط",
    colorVar: "var(--color-warning)",
  },
  secondary: {
    emoji: "🟢",
    label: "Secondary",
    labelAr: "ثانوي",
    colorVar: "var(--color-success)",
  },
};

/** يحوّل سلسلة نصية إلى PhraseTier مع fallback آمن. */
export function parseTier(value: unknown): PhraseTier {
  if (value === "core" || value === "medium" || value === "secondary") return value;
  return "secondary";
}
