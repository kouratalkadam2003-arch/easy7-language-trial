import React, { useState } from 'react';
import type { Lesson } from '@/data/lessons/types';
import ChatModeModal, { ChatModeOptions } from '@/components/VoiceModeModal';
import VoiceChatStage from '@/components/VoiceChatStage';

interface Props {
  lesson: Lesson;
  onComplete: () => void;
}

export function ChatWrapper({ lesson, onComplete }: Props) {
  const [chatMode, setChatMode] = useState<ChatModeOptions | null>(null);

  if (!chatMode) {
    return (
      <ChatModeModal 
        mode="practice" 
        onStart={(mode) => setChatMode(mode)} 
        onCancel={() => setChatMode({ type: 'voice', gender: 'male' })} 
      />
    );
  }

  // Convert LingoBlue lesson to the props expected by VoiceChatStage
  const nativeLanguage = { code: 'ar', englishName: 'Arabic', nativeName: 'العربية' };
  const language = { code: lesson.lang, englishName: lesson.lang, nativeName: lesson.lang }; // Rough mapping
  const topic = { id: lesson.title, title: lesson.title };
  const storyContent = lesson.dialogue.map(d => `${d.character}: ${d.native} (${d.translation})`).join('\n');

  if (chatMode.type === 'voice') {
    return (
      <div className="relative w-full h-full flex-1 flex flex-col min-h-0 overflow-hidden rounded-3xl bg-slate-950 shadow-2xl">
        <VoiceChatStage
          nativeLanguage={nativeLanguage as any}
          language={language as any}
          topic={topic}
          level={lesson.cefr}
          storyContent={storyContent}
          lessonDialogue={lesson.dialogue}
          isPractice={true}
          dayNumber={lesson.day}
          wordDataCache={{}}
          onCacheWordData={() => {}}
          onAddFlashcard={() => {}}
          voiceGender={chatMode.gender}
          onToggleVoiceGender={() => {
            setChatMode({ type: 'voice', gender: chatMode.gender === 'male' ? 'female' : 'male' });
          }}
          onComplete={onComplete}
        />
        <button 
          onClick={onComplete}
          className="absolute top-3 left-3 bg-white/90 hover:bg-white text-slate-800 font-extrabold text-xs sm:text-sm px-4 py-2 rounded-full shadow-lg border border-slate-200 z-[60] flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        >
          <span>المتابعة إلى التحديات ➔</span>
        </button>
      </div>
    );
  }

  if (chatMode.type === 'text') {
    return (
      <div className="flex-1 w-full flex items-center justify-center flex-col">
         <h1 className="text-2xl font-bold">محادثة نصية (قيد التطوير)</h1>
         <button onClick={onComplete} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg">المتابعة للتحديات ➔</button>
      </div>
    );
  }

  return null;
}
