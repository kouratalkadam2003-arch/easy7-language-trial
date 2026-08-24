import { useNavigate, useSearchParams } from 'react-router-dom'
import { GameShell } from '@/story/components/GameShell'
import { LearningProvider } from '@/story/learning-context'

export default function StoryPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const chapterVal = searchParams.get('chapter')
  const initialChapter = chapterVal ? parseInt(chapterVal, 10) : 1

  return (
    <LearningProvider>
      <div className="fixed inset-0 z-50 bg-black">
        <GameShell 
          initialChapter={initialChapter}
          onExit={() => navigate('/learn')} 
        />
      </div>
    </LearningProvider>
  )
}
