import React from 'react';
import { useGameStore } from '../../game/store';

export default function StoryDialog({ onStartArcade }: { onStartArcade?: (gameId: 'knifehit' | 'zombie' | 'lostlanguage') => void }) {
  const activeDialog = useGameStore((s) => s.activeDialog);
  const dismissDialog = useGameStore((s) => s.dismissDialog);

  if (!activeDialog) return null;

  const characters: Record<string, any> = {
    eli: {
      name: 'إيلي (رفيقتك ومعلمتك)',
      avatar: '🌸👩‍🏫',
      color: 'border-[#8FAF7E] bg-[#8FAF7E]/10',
      titleColor: 'text-[#8FAF7E]',
    },
    tom: {
      name: 'توم (زميلك في الميناء)',
      avatar: '👨‍🌾🤝',
      color: 'border-[#C4603A] bg-[#C4603A]/10',
      titleColor: 'text-[#C4603A]',
    },
    dirgham: {
      name: 'ضرغام (الخائن)',
      avatar: '🧙‍♂️👁️',
      color: 'border-red-600 bg-red-950/20',
      titleColor: 'text-red-500',
    }
  };

  const current = characters[activeDialog.character] || characters.eli;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div 
        className={`w-full max-w-md bg-[#FDF6E3] border-t-4 ${current.color} rounded-2xl p-5 shadow-2xl flex flex-col gap-4 relative animate-slide-up text-[#5C3D2E]`}
        dir="rtl"
      >
        {/* Character identity row */}
        <div className="flex items-center gap-3">
          <div className="text-4xl p-2 bg-[#F5E6C8] rounded-xl border border-stone-300">
            {current.avatar}
          </div>
          <div className="flex-1">
            <span className={`text-xs font-bold tracking-wider uppercase block ${current.titleColor}`}>
              {current.name}
            </span>
            <h3 className="text-base font-bold text-[#5C3D2E]">
              {activeDialog.title}
            </h3>
          </div>
        </div>

        {/* Speech body */}
        <div className="bg-[#F5E6C8]/40 p-4 rounded-xl border border-stone-200/50">
          <p className="text-sm md:text-base leading-relaxed text-justify">
            {activeDialog.message}
          </p>
        </div>

        {/* Action / Dismiss Button */}
        <div className="flex flex-col gap-2">
          {activeDialog.action && (
            <button
              onClick={() => {
                if (onStartArcade) {
                  onStartArcade(activeDialog.action!);
                }
                dismissDialog();
              }}
              className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
            >
              {activeDialog.action === 'knifehit' ? 'الذهاب للاحتطاب (لعبة السكاكين) 🪓' : activeDialog.action === 'zombie' ? 'مواجهة الوحوش (لعبة الزومبي) 🧟' : 'استعادة الحروف المفقودة 🔠'}
            </button>
          )}
          <button
            onClick={dismissDialog}
            className="w-full py-2.5 px-4 bg-[#C4603A] hover:bg-[#d16f49] text-white font-bold rounded-xl text-sm transition-all"
          >
            {activeDialog.action ? 'ليس الآن، لاحقاً' : 'فهمت.. سأواصل التعلم والبناء ⚔️'}
          </button>
        </div>
      </div>
    </div>
  );
}
