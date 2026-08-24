import React from 'react';
import type { Lesson } from '@/data/lessons/types';
import RadioStage from '@/components/RadioStage';
import { RadioContentType } from '@/types/remix_types';

interface Props {
  lesson: Lesson;
  onComplete: () => void;
}

export function RadioWrapper({ lesson, onComplete }: Props) {
  const nativeLanguage = { code: 'ar', englishName: 'Arabic', nativeName: 'العربية' };
  const language = { code: lesson.lang || 'en', englishName: lesson.lang || 'English', nativeName: lesson.lang || 'English' };
  const topic = { id: lesson.title || 'Lesson Topic', title: lesson.title || 'Lesson Topic' };

  const turns = (lesson.dialogue || []).map((line: any, idx: number) => ({
    id: String(idx),
    speaker: (idx % 2 === 0 ? 'Sara' : 'Khalid') as 'Sara' | 'Khalid',
    speakerName: idx % 2 === 0 ? 'سارة' : 'خالد',
    nativeScript: line.native || '',
    text: line.native || '',
    translation: line.translation || '',
    phonetic: line.pronunciation || ''
  }));

  const content: RadioContentType = {
    turns
  };

  return (
    <div className="absolute inset-0 bg-slate-950 z-50 overflow-hidden">
      <RadioStage
        content={content}
        isLoading={false}
        error={false}
        onRetry={() => {}}
        onRegenerate={() => {}}
        language={language as any}
        nativeLanguage={nativeLanguage as any}
        topic={topic}
        dayNumber={lesson.day || 1}
        level={lesson.cefr || 'A1'}
        onBack={onComplete}
        onNextStage={onComplete}
      />
    </div>
  );
}

export default RadioWrapper;
