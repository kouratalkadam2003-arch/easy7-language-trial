import React, { useState } from 'react';

export type ChatModeOptions = { type: 'text' } | { type: 'voice', gender: 'male' | 'female' };

interface ChatModeModalProps {
  onStart: (options: ChatModeOptions) => void;
  onCancel: () => void;
  mode: 'chat' | 'practice';
}

const UI_TEXTS_AR = {
    selectMode: "اختر وضع الممارسة",
    textChat: "قراءة محادثة",
    textChatDesc: "اقرأ محادثة نصية بين شخصيتين لفهم الحوار.",
    voiceChat: "ممارسة حية",
    voiceChatDesc: "تحدث مباشرة مع الدليل الصوتي لممارسة النطق.",
    selectVoice: "اختر صوت الدليل",
    maleVoice: "صوت رجل (ليث)",
    femaleVoice: "صوت امرأة (إيلي)",
    start: "ابدأ الممارسة 🚀",
    back: "رجوع",
};

const ChatModeModal: React.FC<ChatModeModalProps> = ({ onStart, onCancel, mode }) => {
  const [step, setStep] = useState<'mode' | 'voice'>(mode === 'practice' ? 'voice' : 'mode');
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male');
  
  const handleStartVoiceChat = () => {
    onStart({ type: 'voice', gender: selectedGender });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex justify-center items-center z-[100] p-4" onClick={onCancel}>
      <div className="bg-slate-900/90 backdrop-blur-xl border-2 border-blue-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-md text-center shadow-cyan-500/10" onClick={e => e.stopPropagation()}>
        {step === 'mode' && (
          <>
            <h3 className="text-2xl font-black text-white mb-6">{UI_TEXTS_AR.selectMode}</h3>
            <div className="space-y-4">
              {mode === 'chat' && (
                <button 
                  onClick={() => onStart({ type: 'text' })}
                  className="w-full text-right p-4 rounded-2xl bg-slate-950/50 border border-blue-500/20 hover:border-pink-500/50 hover:bg-slate-800/50 transition-all group cursor-pointer"
                >
                    <h4 className="text-lg font-black text-pink-400">{UI_TEXTS_AR.textChat}</h4>
                    <p className="text-xs text-blue-200/70 mt-1 leading-relaxed">{UI_TEXTS_AR.textChatDesc}</p>
                </button>
              )}
               <button 
                onClick={() => setStep('voice')}
                className="w-full text-right p-4 rounded-2xl bg-slate-950/50 border border-blue-500/20 hover:border-[#1CB0F6]/50 hover:bg-slate-800/50 transition-all group cursor-pointer"
              >
                  <h4 className="text-lg font-black text-[#1CB0F6]">{UI_TEXTS_AR.voiceChat}</h4>
                  <p className="text-xs text-blue-200/70 mt-1 leading-relaxed">{UI_TEXTS_AR.voiceChatDesc}</p>
              </button>
            </div>
          </>
        )}

        {step === 'voice' && (
           <>
            <h3 className="text-2xl font-black text-white mb-6">{UI_TEXTS_AR.selectVoice}</h3>
            <div className="flex justify-center gap-4 mb-8">
              <button 
                onClick={() => setSelectedGender('male')}
                className={`
                  flex-1 py-4 rounded-2xl font-extrabold text-sm transition-all border-2 cursor-pointer
                  ${selectedGender === 'male' 
                    ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.4)] scale-105' 
                    : 'bg-slate-950/60 text-blue-200 border-blue-500/20 hover:bg-slate-800/60'
                  }
                `}
              >
                {UI_TEXTS_AR.maleVoice}
              </button>
              <button 
                onClick={() => setSelectedGender('female')}
                className={`
                  flex-1 py-4 rounded-2xl font-extrabold text-sm transition-all border-2 cursor-pointer
                  ${selectedGender === 'female' 
                    ? 'bg-pink-600 text-white border-pink-400 shadow-[0_0_15px_rgba(219,39,119,0.4)] scale-105' 
                    : 'bg-slate-950/60 text-pink-200 border-blue-500/20 hover:bg-slate-800/60'
                  }
                `}
              >
                {UI_TEXTS_AR.femaleVoice}
              </button>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
                {mode === 'chat' && (
                    <button 
                      onClick={() => setStep('mode')} 
                      className="py-3 px-6 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 font-extrabold text-base border border-blue-500/20 transition-all active:scale-95 cursor-pointer"
                    >
                        {UI_TEXTS_AR.back}
                    </button>
                )}
                <button 
                  onClick={handleStartVoiceChat} 
                  className="w-full py-3.5 bg-lingo-green hover:bg-lingo-green/90 text-white rounded-xl text-base font-black shadow-[0_4px_0_#58cc02] active:translate-y-1 active:shadow-none transition-all cursor-pointer border-none outline-none"
                >
                    {UI_TEXTS_AR.start}
                </button>
            </div>
           </>
        )}
      </div>
    </div>
  );
};

export default ChatModeModal;