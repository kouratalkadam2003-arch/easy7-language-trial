import React from 'react';

const ModeSelector = ({ onSelect }: { onSelect: (mode: 'single' | 'multi') => void }) => {
    return (
        <div className="h-full w-full bg-gradient-to-br from-[#FFB6C1] via-[#E0C3FC] to-[#B8D4F8] overflow-y-auto overflow-x-hidden" dir="rtl">
            <div className="min-h-full w-full flex flex-col items-center justify-center p-6">
            <div className="mb-10 text-center animate-[slide-up_0.4s_ease] shrink-0 mt-8">
                <div className="text-6xl mb-3">🌐</div>
                <h2 className="font-cafe text-3xl font-black text-purple-800" data-yuki-target="true">اختر وضع التعلم</h2>
                <p className="font-cafe text-purple-600 text-sm mt-2 max-w-[300px] mx-auto">
                    اختر "لغة واحدة" للتركيز.
                </p>
            </div>
            
            <div className="w-full max-w-[380px] mb-4 animate-[slide-up_0.4s_ease_0.1s_both]">
                <button 
                    className="juicy-btn btn-pink w-full text-right" 
                    onClick={() => onSelect('single')}
                    data-yuki-target="true"
                >
                    <div className="text-xl">وضع اللغة الواحدة 🚀</div>
                    <div className="text-xs opacity-85 font-cafe mt-1 font-normal">الرحلة المركزة لتعلم لغة واحدة بإتقان.</div>
                </button>
            </div>
            </div>
        </div>
    );
};

export default ModeSelector;
