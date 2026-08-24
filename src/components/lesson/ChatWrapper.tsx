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
        onCancel={onComplete} 
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
      <div className="absolute inset-0 bg-white z-50">
        <VoiceChatStage
          nativeLanguage={nativeLanguage as any}
          language={language as any}
          topic={topic}
          level={lesson.cefr}
          storyContent={storyContent}
          isPractice={true}
          dayNumber={lesson.day}
          wordDataCache={{}}
          onCacheWordData={() => {}}
          onAddFlashcard={() => {}}
          voiceGender={chatMode.gender}
          onToggleVoiceGender={() => {
            setChatMode({ type: 'voice', gender: chatMode.gender === 'male' ? 'female' : 'male' });
          }}
        />
        <button 
          onClick={onComplete}
          className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md text-red-500 font-bold border-2 border-red-100 z-[60]"
        >
          إنهاء المحادثة
        </button>
      </div>
    );
  }

  if (chatMode.type === 'text') {
    return (
      <div className="absolute inset-0 bg-white z-50 flex items-center justify-center flex-col">
         <h1 className="text-2xl font-bold">محادثة نصية (قيد التطوير)</h1>
         <button onClick={onComplete} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg">إكمال</button>
      </div>
    );
  }

  return null;
}
