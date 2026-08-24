// جدولة إبنجهاوس/الحفظ المتباعد بفترات ثابتة.
// المستخدم لا يرى هذه الأرقام؛ فقط "س بطاقات للمراجعة اليوم".
// الفترات مبنية على منحنى النسيان: 10د → 1ي → 3ي → 7ي → 14ي → 30ي → 60ي → ×2.

export type Rating = "again" | "hard" | "good" | "easy";

export interface SRSFields {
  ef: number; // ease factor
  interval: number; // days until next review
  reps: number; // consecutive correct reviews
  lapses: number; // times forgotten
  due: number; // epoch ms
  lastRating?: Rating;
}

export const initialSRS = (now: number = Date.now()): SRSFields => ({
  ef: 2.5,
  interval: 0,
  reps: 0,
  lapses: 0,
  due: now, // مستحقة فور إضافتها للمراجعة الأولى مباشرة
});

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_10_MS = 10 * 60 * 1000;

// فترات ثابتة (بالأيام) بحسب عدد المراجعات الناجحة المتتالية reps بعد التقييم.
const BASE_INTERVALS_DAYS: Record<number, number> = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
  6: 60,
};

function baseInterval(reps: number): number {
  if (reps <= 0) return 0;
  if (reps <= 6) return BASE_INTERVALS_DAYS[reps];
  return 60 * Math.pow(2, reps - 6);
}

export function schedule(prev: SRSFields, rating: Rating, now: number = Date.now()): SRSFields {
  let { ef, interval, reps, lapses } = prev;

  if (rating === "again") {
    // نسيان → تعود بعد 10 دقائق، وتُصفَّر السلسلة
    reps = 0;
    interval = 0;
    lapses += 1;
    ef = Math.max(1.3, ef - 0.2);
    return { ef, interval, reps, lapses, due: now + MIN_10_MS, lastRating: rating };
  }

  // تعديل معامل السهولة بحسب الزر
  if (rating === "hard") ef = Math.max(1.3, ef - 0.15);
  else if (rating === "easy") ef = Math.min(3.0, ef + 0.15);
  // "good" لا يغيّر ef

  reps += 1;
  const base = baseInterval(reps); // بالأيام
  // معامل الزر: صعب يقلل، سهل يزيد
  const buttonFactor = rating === "hard" ? 0.6 : rating === "easy" ? 1.4 : 1.0;
  // ef يؤثر بعد الجولة الثانية فقط ليبقى المنحنى قريبًا من إبنجهاوس في البداية
  const efFactor = reps >= 3 ? ef / 2.5 : 1.0;
  interval = Math.max(1, Math.round(base * buttonFactor * efFactor));
  return { ef, interval, reps, lapses, due: now + interval * DAY_MS, lastRating: rating };
}

export const isDue = (c: SRSFields, now: number = Date.now()) => c.due <= now;

// ترتيب الصعب أولًا: البطاقات التي أخفق فيها المتعلم آخر مرة تظهر قبل غيرها.
const RATING_WEIGHT: Record<Rating, number> = { again: 0, hard: 1, good: 2, easy: 3 };

export function difficultyOrder<T extends SRSFields>(a: T, b: T): number {
  const ra = a.lastRating ? RATING_WEIGHT[a.lastRating] : 2.5;
  const rb = b.lastRating ? RATING_WEIGHT[b.lastRating] : 2.5;
  if (ra !== rb) return ra - rb; // "again" أولًا
  if (a.lapses !== b.lapses) return b.lapses - a.lapses; // الأكثر نسيانًا أولًا
  if (a.ef !== b.ef) return a.ef - b.ef; // معامل سهولة أقل = أصعب
  return a.due - b.due; // ثم الأقدم استحقاقًا
}

export function formatNextReview(due: number, now: number = Date.now()): string {
  const diff = due - now;
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

// دوال مساعدة إضافية
export function hardDueCount(lang: string, now: number = Date.now()): number {
  // هذه الدالة تحتاج cardStore، لذا سنستخدمها من cardStore مباشرة
  return 0;
}

/**
 * Shuffles an array using the Fisher-Yates algorithm.
 * @param array The array to shuffle.
 * @returns A new, shuffled array.
 */
export const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};
