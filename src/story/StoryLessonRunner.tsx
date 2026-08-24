import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import StoryLessonPlayer from './components/StoryLessonPlayer'


/**
 * Story mode lesson runner. Plays audited LINGO_STORY_LESSON_V1 documents
 * from /story_lessons/{lang}/{level}/day{N}.json (1260 files, A1..C2 × 7 languages).
 *
 * Day numbering is continuous 1..180 across the six CEFR levels
 * (A1: 1-30, A2: 31-60, B1: 61-90, B2: 91-120, C1: 121-150, C2: 151-180),
 * mirroring the normal-mode map in @/data/curriculum/storyMap.
 *
 * ?day=N (from LearnPage nodes) jumps straight to that day;
 * otherwise the last visited day is restored from localStorage.
 */
export default function StoryLessonRunner() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [day, setDay] = useState(() => {
    const raw = localStorage.getItem('easy7_story_day')
    const n = raw ? parseInt(raw, 10) : NaN
    return Number.isFinite(n) && n >= 1 ? Math.min(180, n) : 1
  })

  // React to ?day= links coming from the learning path
  useEffect(() => {
    const q = searchParams.get('day')
    if (q) {
      const n = parseInt(q, 10)
      if (Number.isFinite(n) && n >= 1 && n <= 180) setDay(n)
    }
  }, [searchParams])

  useEffect(() => {
    localStorage.setItem('easy7_story_day', String(day))
  }, [day])

  return (
    <StoryLessonPlayer
      day={day}
      onExit={() => navigate('/learn')}
      onNextDay={(d) => { if (d <= 180) setDay(d) }}
    />
  )
}
