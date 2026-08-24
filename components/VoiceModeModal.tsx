import React, { useState } from 'react';
import { DownloadIcon } from './icons';

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
    maleVoice: "صوت رجل",
    femaleVoice: "صوت امرأة",
    start: "ابدأ",
    back: "رجوع",
};

const ChatModeModal: React.FC<ChatModeModalProps> = ({ onStart, onCancel, mode }) => {
  const [step, setStep] = useState<'mode' | 'voice'>(mode === 'practice' ? 'voice' : 'mode');
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male');
  
  const handleStartVoiceChat = () => {
    onStart({ type: 'voice', gender: selectedGender });
  };

  return (
    <div className="fixed inset-0 bg-purple-900 bg-opacity-60 flex justify-center items-center z-[100]" onClick={onCancel}>
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl w-full max-w-md text-center" onClick={e => e.stopPropagation()}>
        {step === 'mode' && (
          <>
            <h3 className="text-2xl font-bold text-purple-800 mb-6">{UI_TEXTS_AR.selectMode}</h3>
            <div className="space-y-4">
              {mode === 'chat' && (
                <button 
                  onClick={() => onStart({ type: 'text' })}
                  className="w-full text-left p-4 rounded-lg border-2 border-transparent hover:border-pink-500 hover:bg-pink-50 transition-all group"
                >
                    <h4 className="text-lg font-bold text-pink-700">{UI_TEXTS_AR.textChat}</h4>
                    <p className="text-sm text-purple-600">{UI_TEXTS_AR.textChatDesc}</p>
                </button>
              )}
               <button 
                onClick={() => setStep('voice')}
                className="w-full text-left p-4 rounded-lg border-2 border-transparent hover:border-sky-500 hover:bg-sky-50 transition-all group"
              >
                  <h4 className="text-lg font-bold text-sky-700">{UI_TEXTS_AR.voiceChat}</h4>
                  <p className="text-sm text-purple-600">{UI_TEXTS_AR.voiceChatDesc}</p>
              </button>
            </div>
          </>
        )}

        {step === 'voice' && (
           <>
            <h3 className="text-2xl font-bold text-purple-800 mb-6">{UI_TEXTS_AR.selectVoice}</h3>
            <div className="flex justify-center gap-4 mb-8">
              <button 
                onClick={() => setSelectedGender('male')}
                className={`flex-1 juicy-button from-blue-500 to-sky-600 border-4 ${selectedGender === 'male' ? 'border-yellow-300' : 'border-transparent'}`}
              >
                {UI_TEXTS_AR.maleVoice}
              </button>
              <button 
                onClick={() => setSelectedGender('female')}
                className={`flex-1 juicy-button from-pink-500 to-red-500 border-4 ${selectedGender === 'female' ? 'border-yellow-300' : 'border-transparent'}`}
              >
                {UI_TEXTS_AR.femaleVoice}
              </button>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                {mode === 'chat' && (
                    <button onClick={() => setStep('mode')} className="juicy-button from-gray-400 to-gray-500 w-full">
                        {UI_TEXTS_AR.back}
                    </button>
                )}
                <button onClick={handleStartVoiceChat} className="juicy-button from-green-500 to-emerald-600 w-full">
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