/**
 * مخزن البطاقات + تقدّم الدروس + سجلّ المراجعة اليومية — المصدر الوحيد للحقيقة.
 *
 * يحلّ محل:
 *   - lib/cardStore.ts (القديم، المستورد من utils/srs الفواصل الثابتة)
 *   - lib/learning/progress-store.ts
 *
 * يعتمد localStorage عبر zustand/persist (نفس نهج تطبيق 90 يوم المرجعي).
 * يمكن ترحيله لاحقًا إلى سحابة بلا تغيير الواجهة العامة.
 *
 * البوابة الثلاثية + منسّق الـ6 مراحل يقرآن من هنا فقط.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { compareDue, grade, initialSrs, type SrsGrade, type SrsState } from "./srs";
import type { PhraseTier } from "./tiers";

/** لغة كنص حرّ (تتوافق مع LangCode وكذلك 'ar' وأكواد أخرى). */
export type LangStr = string;

/** بطاقة ذاكرة واحدة — تحمل حالة SM-2 + بيانات العبارة. */
export interface Flashcard extends SrsState {
  id: string; // hash(lang + native)
  lang: LangStr;
  day: number; // رقم اليوم/الدرس المرتبط
  tier: PhraseTier;
  native: string; // العبارة بلغة الهدف
  translation: string; // ترجمة عربية
  pronunciation?: string; // نطق عربي مساعد
  character?: string; // المتحدث (Eli/Laith/...)
  createdAt: number;
}

/** تقدّم الدرس عبر المراحل الست الإجبارية + المراجعة الفورية. */
export interface LessonProgress {
  listened: boolean; // 1) الاستماع
  read: boolean; // 2) القراءة
  memorized: boolean; // 3) الحفظ (3 ألعاب)
  practiced: boolean; // 4) الممارسة (محادثة AI)
  radioDone: boolean; // 5) الراديو AI
  immediateReviewDone: boolean; // 6) المراجعة الفورية
}

const EMPTY_PROGRESS: LessonProgress = {
  listened: false,
  read: false,
  memorized: false,
  practiced: false,
  radioDone: false,
  immediateReviewDone: false,
};

/** هل اكتمل الدرس كليًا (المراحل الست + المراجعة الفورية)؟ */
export function isLessonComplete(p: LessonProgress): boolean {
  return (
    p.listened &&
    p.read &&
    p.memorized &&
    p.practiced &&
    p.radioDone &&
    p.immediateReviewDone
  );
}

export type AppMode = "story" | "normal";

interface CardStoreState {
  /** id → Flashcard */
  cards: Record<string, Flashcard>;
  /** `${lang}:${day}` → LessonProgress */
  progress: Record<string, LessonProgress>;
  /** lang → YYYY-MM-DD (آخر مراجعة يومية إجبارية) */
  dailyReviewLastDoneOn: Record<string, string | null>;
  /** الوضع: قصة / عادي */
  mode: AppMode;

  // --- إجراءات البطاقات ---
  addOrUpdateCard: (
    input: Omit<Flashcard, keyof SrsState | "createdAt"> & Partial<SrsState>
  ) => void;
  addCardsFromLesson: (
    lang: LangStr,
    day: number,
    phrases: {
      native: string;
      translation: string;
      tier: PhraseTier;
      pronunciation?: string;
      character?: string;
    }[]
  ) => void;
  rateCard: (id: string, g: SrsGrade) => void;
  getDueCards: (lang: LangStr, now?: number) => Flashcard[];
  getLessonCards: (lang: LangStr, day: number) => Flashcard[];

  // --- إجراءات المراحل الست ---
  markStageDone: (
    lang: LangStr,
    day: number,
    stage: keyof LessonProgress
  ) => void;
  markImmediateReviewDone: (lang: LangStr, day: number) => void;
  getLessonProgress: (lang: LangStr, day: number) => LessonProgress;

  // --- إجراءات المراجعة اليومية + التقدّم ---
  markDailyReviewDone: (lang: LangStr) => void;
  getHighestCompletedDay: (lang: LangStr) => number;
  getPendingImmediateReview: (lang: LangStr) => number | null;
  isDailyReviewPending: (lang: LangStr) => boolean;

  // --- الوضع ---
  setMode: (mode: AppMode) => void;

  resetAll: () => void;
}

const todayStr = () => new Date().toISOString().slice(0, 10);
const hash = (lang: string, native: string) =>
  `${lang}:${native.trim().toLowerCase().replace(/\s+/g, "_")}`;

const SAFE_STORAGE = () => {
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  } as unknown as Storage;
};

export const useCardStore = create<CardStoreState>()(
  persist(
    (set, get) => ({
      cards: {},
      progress: {},
      dailyReviewLastDoneOn: {},
      mode: "story",

      addOrUpdateCard: (input) => {
        const id = input.id ?? hash(input.lang, input.native);
        if (get().cards[id]) return; // لا نطغي على بطاقة موجودة (نحافظ على SRS)
        const srs = initialSrs(input.tier);
        set((s) => ({
          cards: {
            ...s.cards,
            [id]: {
              ...srs,
              ...input,
              id,
              createdAt: Date.now(),
            } as Flashcard,
          },
        }));
      },

      addCardsFromLesson: (lang, day, phrases) => {
        const now = Date.now();
        set((s) => {
          const next = { ...s.cards };
          for (const p of phrases) {
            if (!p.native?.trim() || !p.translation?.trim()) continue;
            const id = hash(lang, p.native);
            if (next[id]) continue;
            const srs = initialSrs(p.tier, now);
            next[id] = {
              ...srs,
              id,
              lang,
              day,
              tier: p.tier,
              native: p.native,
              translation: p.translation,
              pronunciation: p.pronunciation,
              character: p.character,
              createdAt: now,
            };
          }
          return { cards: next };
        });
      },

      rateCard: (id, g) => {
        const card = get().cards[id];
        if (!card) return;
        const next = grade(card, card.tier, g);
        set((s) => ({
          cards: { ...s.cards, [id]: { ...card, ...next } },
        }));
      },

      getDueCards: (lang, now = Date.now()) => {
        const all = Object.values(get().cards).filter(
          (c) => c.lang === lang && c.dueAt <= now
        );
        return all.sort((a, b) =>
          compareDue({ tier: a.tier, state: a }, { tier: b.tier, state: b })
        );
      },

      getLessonCards: (lang, day) =>
        Object.values(get().cards).filter(
          (c) => c.lang === lang && c.day === day
        ),

      markStageDone: (lang, day, stage) => {
        const key = `${lang}:${day}`;
        set((s) => ({
          progress: {
            ...s.progress,
            [key]: {
              ...EMPTY_PROGRESS,
              ...s.progress[key],
              [stage]: true,
            },
          },
        }));
      },

      markImmediateReviewDone: (lang, day) => {
        const key = `${lang}:${day}`;
        set((s) => ({
          progress: {
            ...s.progress,
            [key]: {
              ...EMPTY_PROGRESS,
              ...s.progress[key],
              immediateReviewDone: true,
            },
          },
        }));
      },

      getLessonProgress: (lang, day) => {
        const key = `${lang}:${day}`;
        return { ...EMPTY_PROGRESS, ...get().progress[key] };
      },

      markDailyReviewDone: (lang) => {
        set((s) => ({
          dailyReviewLastDoneOn: {
            ...s.dailyReviewLastDoneOn,
            [lang]: todayStr(),
          },
        }));
      },

      getHighestCompletedDay: (lang) => {
        const { progress } = get();
        let max = 0;
        for (const [key, p] of Object.entries(progress)) {
          const sep = key.lastIndexOf(":");
          const l = key.slice(0, sep);
          const dStr = key.slice(sep + 1);
          if (l !== lang) continue;
          if (!isLessonComplete(p)) continue;
          const d = Number(dStr);
          if (Number.isFinite(d) && d > max) max = d;
        }
        return max;
      },

      getPendingImmediateReview: (lang) => {
        const { progress } = get();
        let earliest: number | null = null;
        for (const [key, p] of Object.entries(progress)) {
          const sep = key.lastIndexOf(":");
          const l = key.slice(0, sep);
          const dStr = key.slice(sep + 1);
          if (l !== lang) continue;
          // مراجعة فورية معلّقة = اكتملت المراحل 1-5 لكن لم تُكمل المراجعة الفورية
          const stages5 =
            p.listened &&
            p.read &&
            p.memorized &&
            p.practiced &&
            p.radioDone;
          if (stages5 && !p.immediateReviewDone) {
            const d = Number(dStr);
            if (Number.isFinite(d) && (earliest === null || d < earliest)) {
              earliest = d;
            }
          }
        }
        return earliest;
      },

      isDailyReviewPending: (lang) => {
        const highest = get().getHighestCompletedDay(lang);
        if (highest === 0) return false; // لم يُكمل أي درس بعد
        return get().dailyReviewLastDoneOn[lang] !== todayStr();
      },

      setMode: (mode) => set({ mode }),

      resetAll: () =>
        set({
          cards: {},
          progress: {},
          dailyReviewLastDoneOn: {},
          mode: "story",
        }),
    }),
    {
      name: "lingo-blue-engine-v1",
      storage: createJSONStorage(SAFE_STORAGE),
      version: 1,
    }
  )
);

// ===== دوال مساعدة خارج المكوّن (للاستخدام في الخدمات/الخادم) =====

/** عدد المستحقّات ذات lapses>0 (لعرضها كتنبيه "صعبة"). */
export function hardDueCount(lang: LangStr, now: number = Date.now()): number {
  return useCardStore
    .getState()
    .getDueCards(lang, now)
    .filter((c) => c.lapses > 0).length;
}

/** عدد مستحقّات طبقة معيّنة (Core عادةً = أولوية قصوى). */
export function tierDueCount(
  lang: LangStr,
  tier: PhraseTier,
  now: number = Date.now()
): number {
  return useCardStore
    .getState()
    .getDueCards(lang, now)
    .filter((c) => c.tier === tier).length;
}
