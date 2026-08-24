import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { LessonViewProps } from './LessonView';
import { MemoryContentType, MemoryDrillItem, Language } from '../types';
import { LoadingDisplay, ErrorDisplay } from './Spinner';
import { useGlobalAudio } from './GlobalAudioContext';
import { TEACHER_PERSONAS } from '../constants';
import { XIcon, CheckIcon } from './icons';
import { speakText } from '../utils/audio';
import ZombieFightGame from '../src/screens/ZombieFightGame';

import KnifeHitGame from '../src/screens/KnifeHitGame';
interface MemoryStageProps extends Omit<LessonViewProps, 'mode'> {
    content: MemoryContentType | null;
    isLoading: boolean;
    error: boolean;
    onRetry: () => void;
    onRegenerate: () => void;
    drillIndex: number;
    step: 0 | 1 | 2;
    onStateChange: (index: number, step: 0 | 1 | 2) => void;
    onNextStage?: () => void;
}

const UI_TEXTS = {
    error: "حدث خطأ أثناء إنشاء التدريبات.",
    retry: "حاول مرة أخرى",
    generating: "جاري إعداد لعبة التكرار...",
};

const isMatch = (spoken: string, target: string) => {
    const normalize = (s: string) => s.toLowerCase().replace(/[^\w\s\u0600-\u06FF]/g, '').trim();
    const sWords = normalize(spoken).split(/\s+/);
    const tWords = normalize(target).split(/\s+/);
    
    let matchCount = 0;
    for (const tw of tWords) {
        if (sWords.includes(tw)) matchCount++;
    }
    return matchCount / tWords.length >= 0.6; // 60% match is enough for game feel
};

// --- CONTEXT CHANGE GAME (Step 2) -> SUBSTITUTION DRILL ---
const ContextChangeGame: React.FC<{
    drill: MemoryDrillItem;
    language: Language;
    allDrills?: MemoryDrillItem[];
    onComplete: () => void;
}> = ({ drill, language, allDrills, onComplete }) => {
    // Determine how many substitution levels we can test (max 2)
    const maxSubLevels = Math.min(2, drill.substitutions?.length || 0);

    const [subLevelIndex, setSubLevelIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<any>(null);
    const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');

    // If no substitutions are available, skip this game entirely
    useEffect(() => {
        if (!drill.substitutions || drill.substitutions.length === 0) {
            onComplete();
        }
    }, [drill, onComplete]);

    // Options for the current substitution drill
    const currentOptions = useMemo(() => {
        if (!drill.substitutions || drill.substitutions.length === 0) return { correct: null, options: [] };
        
        const currentSub = drill.substitutions[subLevelIndex % drill.substitutions.length];
        
        // Find distractors that are not the exact same full sentence
        let distractors = drill.substitutions.filter(s => s.fullSentence !== currentSub.fullSentence);
        
        if (distractors.length < 2) {
            // Borrow from other drills if possible
            if (allDrills) {
                for (const d of allDrills) {
                    if (d.substitutions) {
                        for (const s of d.substitutions) {
                            if (s.fullSentence !== currentSub.fullSentence && !distractors.some(x => x.fullSentence === s.fullSentence)) {
                                distractors.push(s);
                            }
                        }
                    }
                }
            }
            // Fallback options
            while (distractors.length < 2) {
                distractors.push({ fullSentence: `Fake Option ${distractors.length}`, changedWord: 'fake', translation: 'Fake Translation' });
            }
        }
        
        const finalOptions = [currentSub, ...distractors.slice(0, 2)].sort(() => Math.random() - 0.5);
        return { correct: currentSub, options: finalOptions };
    }, [drill, subLevelIndex, allDrills]);

    useEffect(() => {
        setStatus('idle');
        setSelectedOption(null);
    }, [subLevelIndex, drill]);

    const playCorrectSound = () => {
        try {
            const ctxC = new (window.AudioContext || (window as any).webkitAudioContext)();
            const o = ctxC.createOscillator();
            const g = ctxC.createGain();
            o.type = 'sine'; o.frequency.setValueAtTime(500, ctxC.currentTime); o.frequency.exponentialRampToValueAtTime(1000, ctxC.currentTime + 0.1);
            o.connect(g); g.connect(ctxC.destination);
            g.gain.setValueAtTime(0.3, ctxC.currentTime); g.gain.exponentialRampToValueAtTime(0.01, ctxC.currentTime + 0.3);
            o.start(); o.stop(ctxC.currentTime + 0.3);
        } catch(e) {}
    };

    const playIncorrectSound = () => {
        try {
            const ctxI = new (window.AudioContext || (window as any).webkitAudioContext)();
            const o = ctxI.createOscillator();
            const g = ctxI.createGain();
            o.type = 'sawtooth'; o.frequency.setValueAtTime(300, ctxI.currentTime); o.frequency.exponentialRampToValueAtTime(150, ctxI.currentTime + 0.3);
            o.connect(g); g.connect(ctxI.destination);
            g.gain.setValueAtTime(0.3, ctxI.currentTime); g.gain.exponentialRampToValueAtTime(0.01, ctxI.currentTime + 0.3);
            o.start(); o.stop(ctxI.currentTime + 0.3);
        } catch(e) {}
    };

    const handleSelectOption = (opt: any) => {
        if (status !== 'idle') return;
        setSelectedOption(opt);
        if (opt.fullSentence === currentOptions.correct?.fullSentence) {
            setStatus('correct');
            playCorrectSound();
        } else {
            setStatus('incorrect');
            playIncorrectSound();
        }
    };

    const handleContinue = () => {
        if (status === 'correct') {
            if (subLevelIndex + 1 < maxSubLevels) {
                setSubLevelIndex(prev => prev + 1);
            } else {
                onComplete();
            }
        } else {
            // Incorrect, reset and try again
            setStatus('idle');
            setSelectedOption(null);
        }
    };

    if (!drill.substitutions || drill.substitutions.length === 0) return null;

    const progressPercent = ((subLevelIndex + 1) / Math.max(1, maxSubLevels)) * 100;

    return (
        <div className="absolute inset-0 bg-white flex flex-col font-sans select-none z-[100]" dir="rtl">
            {/* Top Bar */}
            <div className="flex items-center px-4 py-6 gap-4 w-full max-w-2xl mx-auto">
                <div className="flex-1 bg-slate-200 rounded-full h-4 overflow-hidden relative">
                    <div className="bg-emerald-400 absolute top-0 right-0 h-full rounded-full transition-all duration-300" 
                         style={{ width: `${progressPercent}%` }}>
                         <div className="absolute top-1 left-2 right-2 h-1 bg-white/30 rounded-full rounded-t-none opacity-50"></div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-32">
                <div className="max-w-2xl mx-auto w-full flex flex-col pb-4 h-full">
                    <h2 className="text-2xl font-black text-slate-800 mb-6 font-cafe px-4">
                        اختر الترجمة الصحيحة:
                    </h2>
                    
                    <div className="flex items-start gap-4 mb-8 px-4">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 bg-[#E0F7FA] rounded-full flex items-center justify-center -ml-2">
                            <div className="flex flex-col items-center">
                                <span className="text-5xl drop-shadow-md animate-bounce-slow mt-2">🗣️</span>
                            </div>
                        </div>
                        <div className="flex-1 bg-white border-2 border-slate-200 rounded-2xl p-6 relative shadow-sm mt-4">
                            <div className="absolute top-6 -right-2.5 w-4 h-4 bg-white border-t-2 border-r-2 border-slate-200 rotate-45"></div>
                            <p className="text-xl sm:text-2xl font-black text-slate-800 leading-relaxed text-center">
                                {currentOptions.correct?.translation}
                            </p>
                        </div>
                    </div>
                    
                    {/* Grid of Options */}
                    <div className="grid grid-cols-1 gap-3 mt-auto px-2">
                        {currentOptions.options.map((opt, i) => {
                            const isSelected = selectedOption === opt;
                            const isCorrect = isSelected && status === 'correct';
                            const isWrong = isSelected && status === 'incorrect';
                            return (
                                <button
                                    key={i}
                                    disabled={status !== 'idle'}
                                    onClick={() => handleSelectOption(opt)}
                                    className={`
                                        relative w-full text-center px-4 py-6 rounded-2xl border flex flex-col items-center justify-center transition-all bg-white
                                        ${status === 'idle' ? 'hover:bg-slate-50 border-b-4 active:border-b active:translate-y-1' : ''}
                                        ${isCorrect ? 'border-[#58CC02] bg-[#D7FFB8] text-[#58CC02] border-b' : ''}
                                        ${isWrong ? 'border-[#FF4B4B] bg-[#FFDFE0] text-[#FF4B4B] border-b' : ''}
                                        ${status !== 'idle' && !isSelected ? 'border-slate-200 bg-slate-50 opacity-50' : ''}
                                        ${status === 'idle' ? 'border-slate-300 shadow-[0_4px_0_0_#CBD5E1]' : ''}
                                        ${isCorrect ? 'shadow-[0_4px_0_0_#58CC02]' : ''}
                                        ${isWrong ? 'shadow-[0_4px_0_0_#FF4B4B]' : ''}
                                    `}
                                >
                                    <span className={`text-xl sm:text-2xl font-black mb-1 font-brand ${isCorrect||isWrong ? '' : 'text-slate-700'}`} dir="ltr">
                                        {opt.fullSentence}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Bottom Sheet Transition / Action Area */}
            <div className={`
                fixed bottom-0 left-0 right-0 z-[110] transition-all duration-300 px-6 py-6 border-t-2
                ${status === 'idle' ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}
                ${status === 'correct' ? 'bg-[#D7FFB8] border-[#58CC02]' : 'bg-[#FFDFE0] border-[#FF4B4B]'}
            `}>
                <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${status === 'correct' ? 'bg-white text-[#58CC02]' : 'bg-white text-[#FF4B4B]'}`}>
                            {status === 'correct' ? (
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" /></svg>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <h3 className={`text-2xl font-black ${status === 'correct' ? 'text-[#58CC02]' : 'text-[#FF4B4B]'}`}>
                                {status === 'correct' ? 'عمل رائع!' : 'إجابة خاطئة'}
                            </h3>
                            {status === 'incorrect' && (
                                <p className="text-[#FF4B4B]/80 font-bold mt-1 text-sm font-brand" dir="ltr">
                                    {currentOptions.correct?.fullSentence}
                                </p>
                            )}
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleContinue}
                        className={`
                            w-full sm:w-48 py-4 px-6 rounded-2xl font-black text-xl text-center active:translate-y-1 transition-all
                            ${status === 'correct' 
                                ? 'bg-[#58CC02] text-white hover:bg-[#46A302] border-b-4 border-[#46A302] active:border-b-0' 
                                : 'bg-[#FF4B4B] text-white hover:bg-[#E03A3A] border-b-4 border-[#E03A3A] active:border-b-0'
                            }
                        `}
                    >
                        المتابعة
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN MEMORY STAGE ---
const MemoryStage: React.FC<MemoryStageProps> = ({ 
    content, isLoading, error, onRetry, language, nativeLanguage,
    topic, level,
    drillIndex, step, onStateChange, onBack, onNextStage
}) => {
    const { setMainAudio } = useGlobalAudio();

    const drill = content?.drills?.[drillIndex];
    const totalDrills = content?.drills?.length || 0;

    const handleNextStep = () => {
        if (step === 0) {
            if (drillIndex < totalDrills - 1) {
                onStateChange(drillIndex + 1, 0);
            } else {
                onStateChange(0, 1); // Move to Zombie
            }
        } else if (step === 1) {
            if (onNextStage) onNextStage(); // Skip context change to keep it exactly 7 tasks
        } else if (step === 2) {
            if (drillIndex < totalDrills - 1) {
                onStateChange(drillIndex + 1, 2);
            } else {
                if (onNextStage) onNextStage();
            }
        }
    };

    const handleSkipToNextGame = () => {
        if (step === 0) {
            onStateChange(0, 1); // Jump to Zombie
        } else if (step === 1) {
            if (onNextStage) onNextStage(); // Skip context change
        } else if (step === 2) {
            if (onNextStage) onNextStage(); // Final exit to next lesson stage
        }
    };

    const handleBackStep = () => {
        if (step === 0) {
            if (drillIndex > 0) {
                onStateChange(drillIndex - 1, 0);
            } else {
                onBack();
            }
        } else if (step === 1) {
            onStateChange(totalDrills - 1, 0);
        } else if (step === 2) {
            if (drillIndex > 0) {
                onStateChange(drillIndex - 1, 2);
            } else {
                onStateChange(0, 1);
            }
        }
    };

    // Play audio when drill changes (only for step 0)
    useEffect(() => {
        if (drill && step === 0) {
            const teacher = TEACHER_PERSONAS[language.code] || TEACHER_PERSONAS['en'];
            speakText(drill.originalSentence, language, 1, drill.originalSentence, undefined, 'hq', teacher.voiceName as any);
        }
    }, [drill, language, step]);

    if (isLoading) return <LoadingDisplay text={UI_TEXTS.generating} />;
    if (error) return <ErrorDisplay errorText={UI_TEXTS.error} retryText={UI_TEXTS.retry} onRetry={onRetry} />;

    return (
        <div className="fixed inset-0 z-[60] bg-[#0f2027] flex flex-col overflow-hidden font-sans select-none" dir="rtl">
            {/* Outer Back (Exit) */}
            <button onClick={onBack} className="absolute top-6 right-6 z-[80] btn-wood !p-3 !rounded-full opacity-80 hover:opacity-100">
                <XIcon className="w-6 h-6" />
            </button>
            
            {/* Outer Next (Next Game / Next Stage) */}
            <button onClick={handleSkipToNextGame} className="absolute top-6 left-6 z-[80] btn-wood !p-3 !rounded-full opacity-80 hover:opacity-100 shadow-xl" title="تخطي اللعبة">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 19l-7-7 7-7M18 19l-7-7 7-7" /></svg>
            </button>

            {(!content || !content.drills || content.drills.length === 0 || !drill) ? (
                 <div className="flex flex-col items-center justify-center flex-1">
                     <p className="text-white/40 font-bold mb-4">ليس هناك بيانات كافية لهذه اللعبة في هذا الدرس.</p>
                     <button onClick={() => onNextStage?.()} className="px-6 py-3 bg-white/10 text-white rounded-full font-bold hover:bg-white/20 transition-colors">الانتقال للمرحلة القادمة</button>
                 </div>
            ) : (
                <>
                    {/* Inner Back (Previous Drill/Game) */}
                    <button 
                        onClick={handleBackStep}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-[70] group flex flex-col items-center gap-2"
                    >
                        <div className="w-16 h-16 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/10 group-hover:scale-110 group-active:scale-90 shadow-xl">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                        </div>
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter">السابق</span>
                    </button>

                    {/* Inner Next (Next Drill/Game) */}
                    <button 
                        onClick={handleNextStep}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-[70] group flex flex-col items-center gap-2"
                    >
                        <div className="w-16 h-16 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/10 group-hover:scale-110 group-active:scale-90 shadow-xl">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                        </div>
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter">التالي</span>
                    </button>
                    
                    {step === 0 ? (
                        <KnifeHitGame drill={drill} language={language} onComplete={handleNextStep} />
                    ) : step === 1 ? (
                        <div className="flex-1 relative w-full h-full">
                            <ZombieFightGame 
                                flashcards={(content.drills || []).map(d => ({ 
                                    originalText: d.originalSentence, 
                                    translation: d.translation, 
                                    id: Math.random().toString(),
                                    nativeText: d.translation,
                                    speechRate: 1,
                                    nextReviewTimestamp: 0,
                                    status: 'new'
                                }))}
                                onClose={handleNextStep} 
                            />
                        </div>
                    ) : (
                        <ContextChangeGame drill={drill} language={language} onComplete={handleNextStep} allDrills={content.drills} />
                    )}
                </>
            )}

            <style>{`
                @keyframes fly-left {
                    0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
                    100% { transform: translate(-200px, 200px) rotate(-90deg); opacity: 0; }
                }
                @keyframes fly-right {
                    0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
                    100% { transform: translate(200px, 200px) rotate(90deg); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default MemoryStage;
