'use client'

import { useState } from 'react'
import { TitleScreen } from './title-screen'
import { CinematicPlayer } from './cinematic-player'
import { BeachScene } from './beach-scene'
import { CabinScene } from './cabin-scene'
import { MarketScene } from './market-scene'
import { ChapterEnd } from './chapter-end'
import { villageChapter, posterScene } from '@/lib/game/script'

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

interface GameShellProps {
  onFinishPrologue?: () => void;
}

export function GameShell({ onFinishPrologue }: GameShellProps) {
  const [stage, setStage] = useState<GameStage>('title')

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
          onRestart={() => setStage('title')}
          onContinue={onFinishPrologue}
          chapterLabel="نهاية الفصل الثاني"
          title="القرية"
          description="اشتريت الخبز بالإنجليزية وحدك، وكسبت ثقة أهل القرية... لكن ملصقات عاصف وصلت قبل أن تلتقط أنفاسك. سرّك لم يعد آمناً."
          nextLabel="دخول القرية والمغامرة ➡️"
          image="/scenes/village.png"
          imageAlt="القرية الساحلية في الصباح"
        />
      )
  }
}
