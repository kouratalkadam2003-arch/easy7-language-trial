/**
 * حفظ تقدم المتعلم — واجهة تخزين قابلة للاستبدال.
 * القرار المعلق [PENDING]: قاعدة بيانات دائمة لاحقاً (M4).
 * التنفيذ الحالي: متصفح فقط (localStorage) حسب قرار المستخدم.
 * نقاط الاستدعاء لن تتغير عند الترحيل — يُستبدل هذا الملف فقط.
 */

import type { ReviewState } from './srs'

export type LearnerProgress = {
  /** حالات SRS لكل عبارة بدأ تعلّمها */
  reviews: ReviewState[]
  /** مفاتيح الكلمات المفردة المحفوظة من الضغط على الحوار */
  wordKeys: string[]
  version: 1
}

const STORAGE_KEY = 'kos-learner-progress-v1'

const EMPTY: LearnerProgress = { reviews: [], wordKeys: [], version: 1 }

export function loadProgress(): LearnerProgress {
  if (typeof window === 'undefined') return EMPTY
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as LearnerProgress
    if (parsed.version !== 1 || !Array.isArray(parsed.reviews)) return EMPTY
    return parsed
  } catch {
    return EMPTY
  }
}

export function saveProgress(progress: LearnerProgress): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // التخزين ممتلئ أو محظور — نتجاهل بصمت، التقدم يبقى في الذاكرة
  }
}
