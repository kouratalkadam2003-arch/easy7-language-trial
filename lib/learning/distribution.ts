/**
 * جدول توزيع العبارات عبر المراحل السبع — نقي، بلا React.
 * المرجع: عبارة Core تُقابَل ≥7 مرات في الفصل، Medium 3–4، Secondary 1–2 (فهم فقط).
 */

import type { Phrase, PhraseTier } from './phrases'

export type Stage =
  | 'cinematic' // 1. المشهد السينمائي — تعرّض أولي
  | 'interactive-words' // 2. الكلمات التفاعلية — ترجمة عند الضغط
  | 'guided-dialogue' // 3. الحوار الموجّه (السوق) — إنتاج مقيّد
  | 'free-dialogue' // 4. الحوار الحر مع إيلي
  | 'night-repeat' // 5. التدريب الليلي — تكرار (Shadowing)
  | 'night-transform' // 6. التدريب الليلي — تخيّل/تبديل
  | 'notebook-srs' // 7. دفتر ليث — تكرار متباعد

export type Exposure = 'none' | 'passive' | 'optional' | 'required'

/** ماذا يحدث لكل tier في كل مرحلة */
export const DISTRIBUTION: Record<Stage, Record<PhraseTier, Exposure>> = {
  cinematic: { core: 'passive', medium: 'passive', secondary: 'passive' },
  'interactive-words': { core: 'required', medium: 'optional', secondary: 'optional' },
  'guided-dialogue': { core: 'required', medium: 'passive', secondary: 'none' },
  'free-dialogue': { core: 'required', medium: 'optional', secondary: 'none' },
  'night-repeat': { core: 'required', medium: 'optional', secondary: 'none' },
  'night-transform': { core: 'required', medium: 'optional', secondary: 'none' },
  'notebook-srs': { core: 'required', medium: 'required', secondary: 'passive' },
}

/** هل تظهر هذه العبارة في هذه المرحلة أصلاً؟ */
export function appearsIn(phrase: Phrase, stage: Stage): boolean {
  return DISTRIBUTION[stage][phrase.tier] !== 'none'
}

/** هل يُطلب من اللاعب إنتاج (نطق/كتابة) هذه العبارة في هذه المرحلة؟ */
export function productionRequired(phrase: Phrase, stage: Stage): boolean {
  return DISTRIBUTION[stage][phrase.tier] === 'required'
}

/** عبارات فصلٍ ما المؤهلة لمرحلة معينة */
export function phrasesForStage(phrases: Phrase[], stage: Stage): Phrase[] {
  return phrases.filter((p) => appearsIn(p, stage))
}

/** الحد الأدنى للقاءات المخططة لكل tier عبر الفصل (للتدقيق) */
export const MIN_ENCOUNTERS: Record<PhraseTier, number> = {
  core: 7,
  medium: 3,
  secondary: 1,
}
