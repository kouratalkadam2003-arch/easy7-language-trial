import React, { useMemo } from 'react'
import FullRadioStage from '@/components/RadioStage'
import type { Lesson } from '@/data/lessons/types'
import { useUserStore } from '@/store/userStore'
import { RadioContentType, Language } from '@/types/remix_types'

interface Props {
  lesson: Lesson
  onComplete: () => void
}

export function RadioStage({ lesson, onComplete }: Props) {
  const { uiLang } = useUserStore()

  const language: Language = useMemo(() => {
    const langCode = lesson.lang || 'en'
    const nameMap: Record<string, string> = {
      en: 'English',
      fr: 'French',
      es: 'Spanish',
      de: 'German',
      it: 'Italian',
      ja: 'Japanese',
      zh: 'Chinese',
      ar: 'Arabic'
    }
    return {
      code: langCode,
      englishName: nameMap[langCode] || 'English',
      nativeName: nameMap[langCode] || 'English',
      name: nameMap[langCode] || 'English',
      flag: '🏳️'
    }
  }, [lesson.lang])

  const nativeLanguage: Language = useMemo(() => ({
    code: 'ar',
    englishName: 'Arabic',
    nativeName: 'العربية',
    name: 'العربية',
    flag: '🇸🇦'
  }), [])

  // Build radio turns from lesson dialogue with Sarah & Khalid podcast hosts
  const content: RadioContentType = useMemo(() => {
    const turns = [
      {
        speaker: 'Sara',
        text: `Welcome to Village Radio! With you Sarah and Khalid, today we review: ${lesson.title}`,
        translation: `أهلاً بكم في راديو القرية! معكم سارة وخالد، اليوم سنراجع: ${lesson.title}`
      },
      {
        speaker: 'Khalid',
        text: `Welcome! Great performance today in learning, let's review the main phrases together!`,
        translation: `مرحباً! أداء رائع اليوم في التعلم، دعنا نراجع العبارات الرئيسية معاً!`
      },
      ...(lesson.dialogue || []).map((d: any, idx) => ({
        speaker: idx % 2 === 0 ? 'Sara' : 'Khalid',
        text: (language.code === 'ja' || language.code === 'zh')
          ? (d.romaji || d.pronunciation || d.native)
          : d.native,
        romaji: d.romaji || d.pronunciation || d.native,
        pronunciation: d.pronunciation || d.romaji || d.native,
        nativeScript: d.native,
        translation: d.ar || d.translation || '',
      })),
      {
        speaker: 'Sara',
        text: `Excellent! Thank you for listening and Village Radio greets you. See you next lesson!`,
        translation: `ممتاز! شكراً لاستماعكم وراديو القرية يحييكم. نراكم في الدرس القادم!`
      }
    ]
    return { turns }
  }, [lesson])

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 overflow-hidden rounded-3xl shadow-2xl border border-slate-700/50">
      <FullRadioStage
        content={content}
        isLoading={false}
        error={false}
        onRetry={() => {}}
        onRegenerate={() => {}}
        language={language}
        nativeLanguage={nativeLanguage}
        topic={{ id: (lesson as any).id || String(lesson.day || 1), title: lesson.title }}
        dayNumber={lesson.day || 1}
        level="A1"
        onBack={onComplete}
        onNextStage={onComplete}
      />
    </div>
  )
}
