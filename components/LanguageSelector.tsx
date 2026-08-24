import React from 'react';
import { Language } from '../types';
import { TARGET_LANGUAGES } from '../constants';

interface LanguageSelectorProps {
    onSelectLanguage: (lang: Language) => void;
    onBack?: () => void;
}

const LANGUAGE_DATA: Record<string, { arabicName: string, mascot: string, color: string, code: string }> = {
    'de': { arabicName: 'الألمانية', mascot: '🐻', color: 'bg-[#fef9c3] border-[#fde68a] text-[#854d0e]', code: 'DE' },
    'en': { arabicName: 'الإنجليزية', mascot: '🐮', color: 'bg-[#e0f2fe] border-[#bae6fd] text-[#0369a1]', code: 'GB' },
    'fr': { arabicName: 'الفرنسية', mascot: '🐓', color: 'bg-[#f5f3ff] border-[#ddd6fe] text-[#5b21b6]', code: 'FR' },
    'ja': { arabicName: 'اليابانية', mascot: '🐱', color: 'bg-[#fdf2f8] border-[#fbcfe8] text-[#9d174d]', code: 'JP' },
    'zh': { arabicName: 'الصينية', mascot: '🐲', color: 'bg-[#fef2f2] border-[#fecaca] text-[#991b1b]', code: 'CN' },
    'it': { arabicName: 'الإيطالية', mascot: '🦊', color: 'bg-[#f0fdfa] border-[#ccfbf1] text-[#0f766e]', code: 'IT' },
    'es': { arabicName: 'الإسبانية', mascot: '🐐', color: 'bg-[#fdfce8] border-[#fef08a] text-[#a16207]', code: 'ES' },
};

export default function LanguageSelector({ onSelectLanguage, onBack }: LanguageSelectorProps) {
    return (
        <div className="h-full w-full bg-[#fdf9e9] font-cafe overflow-y-auto overflow-x-hidden" dir="rtl">
            <div className="min-h-full flex flex-col items-center">
            {/* Header Section - Sticky to stay visible */}
            <div className="w-full max-w-md px-5 pt-8 pb-4 sticky top-0 z-50 bg-[#fdf9e9]/80 backdrop-blur-md">
                <div className="bg-white/90 backdrop-blur-xl rounded-[44px] p-6 shadow-2xl shadow-blue-200/40 relative overflow-hidden text-center border border-white">
                    {/* Header Decorative Glow */}
                    <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
                    
                    {/* Compact Button Group at the Right */}
                    <div className="absolute top-4 left-4 flex flex-col gap-1.5 pt-1">
                        <button className="p-1.5 bg-white shadow-sm rounded-lg border border-purple-50 hover:bg-white transition-all flex items-center justify-center">
                            <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                        {onBack && (
                            <button onClick={onBack} className="p-1.5 bg-white shadow-sm rounded-lg border border-purple-50 hover:bg-white transition-all flex items-center justify-center">
                                 <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M15 18l-6-6 6-6" />
                                </svg>
                            </button>
                        )}
                    </div>
                    
                    <h2 className="text-2xl font-black text-[#1e293b] mt-4 leading-tight">
                        ماذا تريد أن تتعلم؟
                    </h2>
                    <p className="text-blue-500 font-bold text-lg mt-0.5">اختر لغتك</p>
                </div>
            </div>

            {/* Grid Section - Full height scroll */}
            <div className="w-full max-w-md p-6 pb-32">
                <div className="grid grid-cols-2 gap-x-5 gap-y-6">
                    {TARGET_LANGUAGES.map((lang, index) => {
                        const data = LANGUAGE_DATA[lang.code] || { arabicName: lang.name, mascot: '🌍', color: 'bg-white border-purple-100 text-purple-900', code: lang.code.toUpperCase() };
                        return (
                            <button
                                key={lang.code}
                                onClick={() => onSelectLanguage(lang)}
                                className={`group relative flex flex-col items-center justify-center pt-9 pb-7 px-4 rounded-[36px] border-b-[8px] border-x-2 border-t-2 transition-all hover:scale-[1.03] active:scale-95 active:border-b-2 active:translate-y-1 ${data.color} shadow-lg shadow-black/5 ring-1 ring-white/20`}
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                {/* Mascot and Code Badge */}
                                <div className="relative mb-4">
                                    <div className="text-6xl filter drop-shadow-lg transform group-hover:scale-110 transition-transform">
                                        {data.mascot}
                                    </div>
                                    <span className="absolute -top-1 -right-4 bg-white/40 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[10px] font-black tracking-tighter shadow-sm">
                                        {data.code}
                                    </span>
                                </div>
                                
                                <h3 className="font-black text-[22px] mb-0.5 tracking-tight leading-tight">{data.arabicName}</h3>
                                <p className="text-[15px] font-bold opacity-60 font-nunito">{lang.name}</p>
                            </button>
                        );
                    })}
                </div>
            </div>
            
            {/* Background Decorations */}
            <div className="fixed -bottom-6 -left-6 w-24 h-24 bg-blue-200/20 rounded-full blur-2xl pointer-events-none" />
            <div className="fixed top-1/3 -right-12 w-32 h-32 border-8 border-dotted border-blue-200/30 rounded-full animate-[spin_60s_linear_infinite] pointer-events-none" />
            
            </div>
        </div>
    );
}