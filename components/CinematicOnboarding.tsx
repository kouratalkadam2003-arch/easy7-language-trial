import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Language, CEFRLevel } from '../types';
import { TARGET_LANGUAGES } from '../constants';

interface CinematicOnboardingProps {
    onComplete: (languageCode: string, level: CEFRLevel) => void;
}

const LANGUAGE_DATA: Record<string, { mascot: string }> = {
    'de': { mascot: '🐻' },
    'en': { mascot: '🐮' },
    'fr': { mascot: '🐓' },
    'ja': { mascot: '🐱' },
    'zh': { mascot: '🐲' },
    'it': { mascot: '🦊' },
    'es': { mascot: '🐐' },
};

export default function CinematicOnboarding({ onComplete }: CinematicOnboardingProps) {
    const [currentScene, setCurrentScene] = useState(1);
    const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
    const [selectedLevel, setSelectedLevel] = useState<CEFRLevel | null>(null);

    const nextScene = () => {
        if (currentScene < 8) {
            setCurrentScene(prev => prev + 1);
        } else if (selectedLanguage && selectedLevel) {
            onComplete(selectedLanguage.code, selectedLevel);
        }
    };

    const handleLanguageSelect = (lang: Language) => {
        setSelectedLanguage(lang);
        setTimeout(nextScene, 1000); // Auto advance after a brief glow
    };

    const handleLevelSelect = (level: CEFRLevel) => {
        setSelectedLevel(level);
        setTimeout(nextScene, 800); // Auto advance
    };

    const renderScene = () => {
        switch (currentScene) {
            case 1:
                return (
                    <motion.div 
                        key="scene1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 1 }}
                        className="flex flex-col items-center justify-center text-center max-w-2xl px-6"
                    >
                        <motion.h1 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5, duration: 2 }}
                            className="text-4xl md:text-5xl font-bold text-amber-500 font-serif leading-tight drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] mb-8"
                        >
                            القصة تبدأ...
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2, duration: 1.5 }}
                            className="text-2xl md:text-3xl font-medium text-amber-100 leading-relaxed font-serif"
                        >
                            "في بلاد الشرق البعيدة، حيث الرمال تعانق السحاب..."
                        </motion.p>
                    </motion.div>
                );
            case 2:
                return (
                    <motion.div 
                        key="scene2"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 1 }}
                        className="flex flex-col items-center justify-center text-center max-w-2xl px-6"
                    >
                        <h2 className="text-3xl font-bold text-amber-400 mb-6 font-serif">الصداقة</h2>
                        <p className="text-xl md:text-2xl text-amber-50 leading-relaxed mb-6">
                            "نشأ ليث وعاصف كأخوين في قصر المُلك... يتدربان بالسيف، يضحكان معاً، ويحلمان بالمجد. تبنّى الملك عاصفَ اليتيم، فأصبح كابنه."
                        </p>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2 }}
                            className="text-lg md:text-xl text-red-400/90 font-medium italic"
                        >
                            "لكن في قلب عاصف... كان الحسد ينمو كالأفعى في الظلام."
                        </motion.p>
                    </motion.div>
                );
            case 3:
                return (
                    <motion.div 
                        key="scene3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col items-center justify-center text-center max-w-2xl px-6"
                    >
                        <motion.h2 
                            initial={{ scale: 1 }}
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ delay: 1, duration: 0.3 }}
                            className="text-4xl font-bold text-red-500 mb-6 font-serif drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]"
                        >
                            الخيانة
                        </motion.h2>
                        <p className="text-2xl text-red-100 leading-relaxed mb-6 font-bold">
                            "في ليلة تتويج ليث ملكاً... كشّر عاصف عن أنيابه."
                        </p>
                        <motion.p 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.5 }}
                            className="text-lg md:text-xl text-red-200/80 leading-relaxed"
                        >
                            "أزاح صديقه عن العرش، قيّده أمام الحراس الذين كانوا بالأمس يحمونه. ثم أمر بنفيه... في البحر الهائج."
                        </motion.p>
                    </motion.div>
                );
            case 4:
                return (
                    <motion.div 
                        key="scene4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="flex flex-col items-center justify-center text-center max-w-2xl px-6 z-10"
                    >
                        <h2 className="text-3xl font-bold text-blue-300 mb-6 font-serif">المنفى</h2>
                        <p className="text-2xl text-blue-100 leading-relaxed mb-6">
                            "وحيداً في البحر الهائج، بلا سيف، بلا تاج، بلا لغة يفهمها أحد..."
                        </p>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.5 }}
                            className="text-lg md:text-xl text-blue-200/70 leading-relaxed italic"
                        >
                            "جرفته الأمواج لأيام... حتى لفظه البحر على شاطئ غريب."
                        </motion.p>
                    </motion.div>
                );
            case 5:
                return (
                    <motion.div 
                        key="scene5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col items-center w-full max-w-4xl px-4 z-10"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-amber-400 mb-2 font-serif text-center drop-shadow-md">
                            إلى أين جرفته الأمواج؟
                        </h2>
                        <p className="text-blue-200 mb-8 text-center text-lg">اختر الشاطئ الذي سيستيقظ عليه ليث</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                            {TARGET_LANGUAGES.map((lang, idx) => {
                                const isSelected = selectedLanguage?.code === lang.code;
                                const mascot = LANGUAGE_DATA[lang.code]?.mascot || '🌍';
                                return (
                                    <motion.button
                                        key={lang.code}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        onClick={() => handleLanguageSelect(lang)}
                                        className={`relative overflow-hidden group flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                                            isSelected 
                                                ? 'bg-amber-500/30 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.4)] scale-105' 
                                                : 'bg-blue-900/40 border-blue-700/50 hover:bg-blue-800/60 hover:border-blue-400'
                                        }`}
                                    >
                                        <div className="text-4xl mb-3 filter drop-shadow-lg group-hover:scale-110 transition-transform">
                                            {mascot}
                                        </div>
                                        <div className="font-bold text-lg text-white mb-1">{lang.name}</div>
                                        <div className="text-xs text-blue-300 font-mono tracking-widest">{lang.code.toUpperCase()}</div>
                                        
                                        {/* Animated waves on hover/select */}
                                        <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500 transform origin-left transition-transform duration-500 ${isSelected ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                );
            case 6:
                return (
                    <motion.div 
                        key="scene6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                        className="flex flex-col items-center justify-center text-center max-w-2xl px-6"
                    >
                        <motion.h2 
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-4xl font-bold text-amber-300 mb-6 font-serif drop-shadow-lg"
                        >
                            الفجر
                        </motion.h2>
                        <p className="text-2xl text-amber-50 leading-relaxed mb-6">
                            "يفتح عينيه ببطء... رمال دافئة تحت جسده المنهك."
                        </p>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.5 }}
                            className="text-xl text-emerald-200/90 leading-relaxed italic mb-8"
                        >
                            "صوت أمواج هادئة... وصوت فتاة تنادي."
                        </motion.p>
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 3 }}
                            className="bg-black/30 backdrop-blur-sm border border-amber-500/30 rounded-full px-6 py-3"
                        >
                            <span className="text-amber-400 font-bold">وجد نفسه على شواطئ {selectedLanguage?.name}</span>
                        </motion.div>
                    </motion.div>
                );
            case 7:
                return (
                    <motion.div 
                        key="scene7"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col items-center justify-center text-center max-w-2xl px-4 w-full"
                    >
                        <div className="flex flex-col items-center mb-8">
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", bounce: 0.5 }}
                                className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full border-4 border-white shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center justify-center text-4xl mb-6 relative z-10"
                            >
                                👩‍🦰
                            </motion.div>
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-white text-amber-900 p-5 rounded-2xl rounded-tr-none shadow-xl relative max-w-sm"
                            >
                                <div className="absolute top-0 right-[-10px] w-0 h-0 border-t-[15px] border-t-white border-r-[15px] border-r-transparent"></div>
                                <p className="font-bold text-lg mb-2">يا إلهي! هل أنت بخير؟ أنت لا تبدو من هنا...</p>
                                <p className="text-amber-700 font-medium">هل تفهم شيئاً من كلامنا؟</p>
                            </motion.div>
                        </div>

                        <div className="flex flex-col gap-3 w-full max-w-sm">
                            {[
                                { id: 'A1', label: 'لا أفهم شيئاً أبداً', emoji: '😶' },
                                { id: 'A2', label: 'أفهم بعض الكلمات البسيطة', emoji: '🤔' },
                                { id: 'B1', label: 'أستطيع التحدث قليلاً', emoji: '💬' },
                                { id: 'B2', label: 'أفهم معظم ما يُقال', emoji: '🗣️' },
                            ].map((level, idx) => (
                                <motion.button
                                    key={level.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1 + (idx * 0.1) }}
                                    onClick={() => handleLevelSelect(level.id as CEFRLevel)}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                                        selectedLevel === level.id 
                                            ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                                            : 'bg-black/40 text-amber-50 border-amber-500/30 hover:bg-black/60 hover:border-amber-400'
                                    }`}
                                >
                                    <span className="font-bold">{level.label}</span>
                                    <span className="text-2xl">{level.emoji}</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                );
            case 8:
                return (
                    <motion.div 
                        key="scene8"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="flex flex-col items-center justify-center text-center max-w-2xl px-6"
                    >
                        <h2 className="text-4xl font-bold text-emerald-400 mb-8 font-serif drop-shadow-lg">البداية</h2>
                        <p className="text-2xl text-emerald-50 leading-relaxed mb-6">
                            "أخذته إيلي إلى كوخها الصغير... ضمّدت جراحه، وأطعمته."
                        </p>
                        <p className="text-xl text-emerald-200/90 leading-relaxed mb-12 italic">
                            "قالت له بابتسامة: 'سأعلمك كل شيء. لكن أولاً... عليك أن تتعرف على قريتنا.'"
                        </p>
                        
                        <motion.button
                            onClick={nextScene}
                            animate={{ 
                                boxShadow: ['0 0 0px rgba(16,185,129,0)', '0 0 30px rgba(16,185,129,0.6)', '0 0 0px rgba(16,185,129,0)']
                            }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white px-10 py-4 rounded-full font-bold text-2xl shadow-xl border border-emerald-400 flex items-center gap-3 transform hover:scale-105 transition-transform"
                        >
                            <span>ابدأ رحلة ليث</span>
                            <svg className="w-6 h-6 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </motion.button>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    // Background themes based on scene
    const getBgClass = () => {
        switch(currentScene) {
            case 1: return 'from-amber-950 via-[#2a1300] to-black'; // Story begins
            case 2: return 'from-[#3e2700] via-[#2a1300] to-black'; // Friendship
            case 3: return 'from-red-950 via-rose-950 to-black'; // Betrayal
            case 4: return 'from-blue-950 via-cyan-950 to-[#000510]'; // Exile
            case 5: return 'from-[#001830] via-blue-950 to-black'; // Language Map
            case 6: return 'from-[#3a2000] via-amber-900 to-[#1a2e1a]'; // Dawn
            case 7: return 'from-[#1a3a2a] via-[#0a2010] to-black'; // Meeting
            case 8: return 'from-emerald-950 via-green-900 to-black'; // Beginning
            default: return 'from-black to-black';
        }
    };

    return (
        <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${getBgClass()} transition-colors duration-1000 relative overflow-hidden font-cafe`} dir="rtl">
            
            {/* Ocean Waves effect for scenes 4, 5, 6 */}
            <AnimatePresence>
                {[4, 5, 6].includes(currentScene) && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="absolute bottom-0 left-0 w-full h-32 opacity-20 pointer-events-none"
                    >
                        <div className="absolute inset-0 bg-repeat-x w-[200%] h-full animate-[slide_10s_linear_infinite]" style={{ backgroundImage: 'radial-gradient(circle at 20px 20px, rgba(255,255,255,0.4) 20px, transparent 21px)', backgroundSize: '40px 40px' }}></div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Skip Button */}
            {currentScene < 5 && (
                <button 
                    onClick={() => setCurrentScene(5)} 
                    className="absolute top-6 left-6 text-white/90 text-sm bg-black/40 backdrop-blur-sm hover:bg-black/60 border border-white/20 hover:border-white/40 rounded-full px-5 py-2 transition-all z-50 flex items-center gap-1.5 font-bold shadow-lg active:scale-95"
                >
                    <span>⏭</span> تخطي القصة
                </button>
            )}

            {/* Content Area */}
            <AnimatePresence mode="wait">
                {renderScene()}
            </AnimatePresence>

            {/* Tap to continue indicator (only for text-heavy scenes) */}
            {[1, 2, 3, 4, 6].includes(currentScene) && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3 }}
                    onClick={nextScene}
                    className="absolute bottom-8 text-white/50 animate-pulse text-sm flex flex-col items-center gap-1 z-50"
                >
                    <span>انقر للمتابعة</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </motion.button>
            )}

            {/* Progress Dots */}
            <div className="absolute bottom-4 flex gap-2 z-50 pointer-events-none">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(dot => (
                    <div 
                        key={dot} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                            dot === currentScene ? 'w-6 bg-white' : dot < currentScene ? 'w-1.5 bg-white/50' : 'w-1.5 bg-white/20'
                        }`}
                    />
                ))}
            </div>

            {/* Invisible full-screen click area for easy advancing */}
            {[1, 2, 3, 4, 6].includes(currentScene) && (
                <div onClick={nextScene} className="absolute inset-0 z-40 cursor-pointer"></div>
            )}
        </div>
    );
}
