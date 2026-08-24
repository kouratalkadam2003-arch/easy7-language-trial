import React, { useState } from 'react';
import { CEFRLevel, Language } from '../types';

interface LevelSelectorProps {
    language: Language;
    currentLevel: CEFRLevel;
    onSelectLevel: (level: CEFRLevel) => void;
    onBack: () => void;
}

const LEVELS: { id: CEFRLevel; title: string; color: string; icon: string }[] = [
    { id: 'A1', title: 'مبتدئ', color: 'bg-yellow-100 border-yellow-400 text-yellow-900', icon: '🧱' },
    { id: 'A2', title: 'مبتدئ متقدم', color: 'bg-green-100 border-green-400 text-green-900', icon: '🎒' },
    { id: 'B1', title: 'متوسط', color: 'bg-orange-100 border-orange-400 text-orange-900', icon: '🎧' },
    { id: 'B2', title: 'متوسط متقدم', color: 'bg-red-100 border-red-400 text-red-900', icon: '☕' },
    { id: 'C1', title: 'متقدم', color: 'bg-purple-100 border-purple-400 text-purple-900', icon: '📈' },
    { id: 'C2', title: 'خبير', color: 'bg-purple-100 border-purple-400 text-purple-900', icon: '🎓' },
];

const MASCOTS: Record<string, string> = {
    'de': '🐻', 'en': '🐮', 'fr': '🐓', 'ja': '🐱', 'zh': '🐲', 'it': '🦊', 'es': '🐐'
};

export default function LevelSelector({ language, currentLevel, onSelectLevel, onBack }: LevelSelectorProps) {
    const [selected, setSelected] = useState<CEFRLevel>(currentLevel);
    const mascot = MASCOTS[language.code] || '🌍';

    const handleConfirm = () => {
        onSelectLevel(selected);
    };

    return (
        <div className="h-full w-full bg-gradient-to-b from-blue-50 to-white overflow-y-auto overflow-x-hidden" dir="rtl">
            <div className="min-h-full flex flex-col items-center p-6">
            <div className="w-full max-w-2xl flex items-center justify-between mb-8 mt-4 shrink-0">
                <button onClick={onBack} className="text-purple-500 hover:text-purple-800 transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
                <div className="flex-1 text-center relative">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-full h-12 bg-blue-100 rounded-full opacity-50 transform -skew-x-12"></div>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-purple-800 relative z-10 font-cafe">
                        اختر مستواك الحالي
                        <span className="block text-lg md:text-xl text-blue-600 mt-1">في اللغة {language.name}</span>
                    </h2>
                </div>
                <div className="w-8"></div> {/* Spacer for centering */}
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-2xl animate-[fade-in_0.5s_ease-out] mb-8">
                {LEVELS.map((level, index) => {
                    const isSelected = selected === level.id;
                    return (
                        <button
                            key={level.id}
                            onClick={() => setSelected(level.id)}
                            className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-b-4 transition-all ${level.color} ${isSelected ? 'ring-4 ring-blue-400 scale-105 shadow-xl' : 'hover:-translate-y-1 hover:shadow-lg opacity-80 hover:opacity-100'}`}
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <div className="absolute top-3 left-3 text-2xl font-black opacity-50">{level.id}</div>
                            {isSelected && (
                                <div className="absolute top-3 right-3 text-blue-500 bg-white rounded-full p-1 shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                            <div className="text-6xl mb-4 mt-4 relative">
                                {mascot}
                                <span className="absolute -bottom-2 -right-4 text-3xl">{level.icon}</span>
                            </div>
                            <h3 className="font-bold text-lg md:text-xl font-cafe mt-2">{level.title}</h3>
                        </button>
                    );
                })}
            </div>

            <div className="w-full max-w-2xl mt-auto pb-8">
                <button 
                    onClick={handleConfirm}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-400 to-blue-500 text-white font-black text-2xl shadow-[0_6px_0_#0f766e] hover:shadow-[0_4px_0_#0f766e] hover:translate-y-[2px] active:shadow-none active:translate-y-[6px] transition-all font-cafe"
                >
                    تأكيد المستوى والانتقال
                </button>
            </div>
            
            </div>
        </div>
    );
}
