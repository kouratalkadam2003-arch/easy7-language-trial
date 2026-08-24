// Loader for story-mode lesson documents (LINGO_STORY_LESSON_V1)
import type { StoryLessonDoc } from './types'

const cache = new Map<string, StoryLessonDoc>()

export const STORY_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
export type StoryLevel = (typeof STORY_LEVELS)[number]

/** dayNumber is 1..180 across the whole journey: level = ceil(day/30), relDay = ((day-1)%30)+1 */
export function levelForDay(day: number): { level: string; relDay: number } {
  const idx = Math.min(5, Math.max(0, Math.floor((day - 1) / 30)))
  return { level: STORY_LEVELS[idx], relDay: ((day - 1) % 30) + 1 }
}

export async function loadStoryLesson(lang: string, day: number): Promise<StoryLessonDoc | null> {
  const { level, relDay } = levelForDay(day)
  const key = `${lang}/${level}/${relDay}`
  if (cache.has(key)) return cache.get(key)!
  try {
    const res = await fetch(`/story_lessons/${lang}/${level}/day${relDay}.json`)
    if (!res.ok) return null
    const doc = (await res.json()) as StoryLessonDoc
    if (!doc || doc.type !== 'LINGO_STORY_LESSON_V1') return null
    cache.set(key, doc)
    return doc
  } catch {
    return null
  }
}

export function scenesByKind(doc: StoryLessonDoc) {
  const by = (k: string) => doc.scenes.filter(s => s.kind === k)
  return {
    narrative: by('narrative'),
    learning: by('learning')[0] ?? null,
    guided: by('guided_practice')[0] ?? null,
    transfer: by('transfer')[0] ?? null,
    radio: by('radio')[0] ?? null,
    proof: by('proof')[0] ?? null,
  }
}

export function phraseMap(doc: StoryLessonDoc): Map<string, StoryLessonDoc['phraseBank'][number]> {
  return new Map(doc.phraseBank.map(p => [p.phraseId, p]))
}
