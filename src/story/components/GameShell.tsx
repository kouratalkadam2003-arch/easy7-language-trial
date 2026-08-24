import { useState } from 'react'
import { TitleScreen } from './TitleScreen'
import { CinematicPlayer } from './CinematicPlayer'
import { BeachScene } from './BeachScene'
import { CabinScene } from './CabinScene'
import { MarketScene } from './MarketScene'
import { ChapterEnd } from './ChapterEnd'
import { villageChapter, posterScene } from '../script'
import { Notebook } from './Notebook'

type GameStage =
  | 'title'
  | 'cinematic'
  | 'beach'
  | 'cabin'
  | 'chapter-end'
  | 'ch2-cinematic'
  | 'market'
  | 'poster'
  | 'ch2-end'

export function GameShell({ onExit, initialChapter }: { onExit?: () => void, initialChapter?: number }) {
  const [stage, setStage] = useState<GameStage>(
    initialChapter === 2 ? 'ch2-cinematic' : 'title'
  )

  return (
    <div className="relative w-full h-full">
      {/* Global floating notebook */}
      {stage !== 'title' && stage !== 'cinematic' && <Notebook />}

      {(() => {
        switch (stage) {
          case 'title':
            return <TitleScreen onStart={() => setStage('cinematic')} />
          case 'cinematic':
            return <CinematicPlayer onComplete={() => setStage('beach')} />
          case 'beach':
            return <BeachScene onComplete={() => setStage('cabin')} />
          case 'cabin':
            return <CabinScene onComplete={() => setStage('chapter-end')} />
          case 'chapter-end':
            return (
              <ChapterEnd
                onRestart={() => setStage('title')}
                onContinue={() => setStage('ch2-cinematic')}
              />
            )
          case 'ch2-cinematic':
            return <CinematicPlayer steps={villageChapter} onComplete={() => setStage('market')} />
          case 'market':
            return <MarketScene onComplete={() => setStage('poster')} />
          case 'poster':
            return <CinematicPlayer steps={posterScene} onComplete={() => setStage('ch2-end')} />
          case 'ch2-end':
            return (
              <ChapterEnd
                onRestart={() => { if (onExit) onExit(); else setStage('title'); }}
                chapterLabel="نهاية الفصل الثاني"
                title="القرية"
                description="اشتريت الخبز بالإنجليزية وحدك، وكسبت ثقة أهل القرية... لكن ملصقات عاصف وصلت قبل أن تلتقط أنفاسك. سرّك لم يعد آمناً."
                nextLabel="الفصل القادم: الحقيقة — قريباً"
                image="/scenes/village.png"
                imageAlt="القرية الساحلية في الصباح"
              />
            )
          default:
            return <TitleScreen onStart={() => setStage('cinematic')} />
        }
      })()}
    </div>
  )
}
