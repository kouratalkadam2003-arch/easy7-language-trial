import type { LangCode, Lesson } from "./types";

// English seed (Wave 1) + Day 90 (all 7 languages, from Legacy 90.html)
import en01 from "./en/day-01";
import en02 from "./en/day-02";
import en03 from "./en/day-03";
import en04 from "./en/day-04";
import en05 from "./en/day-05";
import en90 from "./en/day-90";
import es90 from "./es/day-90";
import fr90 from "./fr/day-90";
import de90 from "./de/day-90";
import ja90 from "./ja/day-90";
import it90 from "./it/day-90";
import zh90 from "./zh/day-90";

const REGISTRY: Record<LangCode, Record<number, Lesson>> = {
  en: { 1: en01, 2: en02, 3: en03, 4: en04, 5: en05, 90: en90 },
  it: { 90: it90 },
  fr: { 90: fr90 },
  es: { 90: es90 },
  de: { 90: de90 },
  ja: { 90: ja90 },
  zh: { 90: zh90 },
};

export const TOTAL_DAYS = 90;

export function getLesson(day: number, lang: LangCode): Lesson | null {
  return REGISTRY[lang]?.[day] ?? null;
}

export function availableDays(lang: LangCode): number[] {
  return Object.keys(REGISTRY[lang] ?? {})
    .map(Number)
    .sort((a, b) => a - b);
}

export type { Lesson, LangCode } from "./types";
