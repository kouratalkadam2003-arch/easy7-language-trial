
import React, { useState } from 'react';
import { LessonViewProps } from './LessonView';
import { ReviewContentType } from '../types';
import { LoadingDisplay, ErrorDisplay } from './Spinner';
import AIAudioPlayer from './AIAudioPlayer';
import { Mic, Square } from 'lucide-react';

const UI_TEXTS_AR = {
    error: "حدث خطأ أثناء تحميل اليوميات. حاول مرة أخرى.",
    retry: "حاول مرة أخرى",
    generating: "إيلي يكتب يومياته الآن...",
    startReview: "حفظ ومتابعة",
};

interface ReviewStageProps extends LessonViewProps {
    content: ReviewContentType | null;
    isLoading: boolean;
    error: boolean;
    onRetry: () => void;
    onStartReview: () => void;
    onSkip?: () => void;
}

const ReviewStage: React.FC<ReviewStageProps> = ({ content, isLoading, error, onRetry, onStartReview, onSkip, language }) => {
    const [recordingIndex, setRecordingIndex] = useState<number | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);

    if (isLoading) return <LoadingDisplay text={UI_TEXTS_AR.generating} />;
    if (error) return <ErrorDisplay errorText={UI_TEXTS_AR.error} retryText={UI_TEXTS_AR.retry} onRetry={onRetry} />;
    if (!content) return <div className="p-4 text-center">الصفحة فارغة...</div>;

    const toggleRecording = (idx: number) => {
        if (recordingIndex === idx) {
            setRecordingIndex(null); // Stop
        } else {
            setRecordingIndex(idx); // Start
            // Auto stop after 3s for demo purposes
            setTimeout(() => {
                setRecordingIndex(current => current === idx ? null : current);
            }, 3000);
        }
    };

    return (
        <div className="p-4 sm:p-8 h-full flex flex-col items-center overflow-y-auto animate-[slide-up_0.3s_ease] pb-24" dir="rtl">
            <div className="max-w-2xl w-full relative">
                
                {onSkip && (
                    <button onClick={onSkip} className="absolute top-0 right-0 p-2 text-amber-900/40 hover:text-amber-900 bg-amber-100/50 hover:bg-amber-200 rounded-full transition-all z-10" title="تخطي اليوميات">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}

                <div className="text-center mb-6 mt-2">
                    <h2 className="text-3xl font-black text-amber-900 mb-2 font-serif" style={{ fontFamily: 'Georgia, serif' }}>يوميات إيلي 📓</h2>
                    <p className="text-amber-800/70 text-sm font-medium">اقرأ ما دونه إيلي وسجله بصوتك لتتدرب على النطق.</p>
                </div>
                
                {/* Notebook Container */}
                <div className="relative bg-[#fcf9f2] rounded-r-2xl rounded-l-md mb-8 shadow-xl border border-amber-900/10 overflow-hidden pb-8">
                    {/* Notebook binding / spine */}
                    <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-amber-900/20 to-transparent border-r-4 border-amber-900/40"></div>
                    
                    {/* Notebook lines background */}
                    <div className="absolute inset-0 z-0" style={{ backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '100% 3rem', backgroundPosition: '0 3.5rem' }}></div>

                    {/* Red margin line */}
                    <div className="absolute top-0 bottom-0 right-16 w-[1px] bg-red-400/50 z-0"></div>

                    <div className="relative z-10 pt-16 px-6 sm:px-12 pr-20 pb-20">
                        <ul className="flex flex-col gap-6">
                            {content.flashcards.map((card, idx) => {
                                const words = card.original.split(' ');
                                const renderWords = words.map((w, i) => {
                                    const isGold = (i + idx) % 4 === 1;
                                    return <span key={i} className={isGold ? "text-amber-600 font-bold" : "text-slate-800"}>{w} </span>;
                                });

                                const isSelected = selectedIndex === idx;

                                return (
                                    <li 
                                        key={idx} 
                                        onClick={() => setSelectedIndex(idx)}
                                        className={`flex flex-col gap-2 relative p-4 rounded-xl cursor-pointer transition-all animate-[slide-up_0.5s_ease_both] ${isSelected ? 'bg-amber-100/40 ring-2 ring-amber-500/30 shadow-sm scale-[1.02]' : 'hover:bg-amber-50/50'}`} 
                                        style={{ animationDelay: `${idx * 0.1}s` }}
                                    >
                                        <div className="text-left" dir="ltr">
                                            <p className="font-serif text-xl sm:text-2xl leading-relaxed mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                                                {renderWords}
                                            </p>
                                            <p className={`text-sm font-medium transition-colors ${isSelected ? 'text-amber-800' : 'text-slate-500'}`} dir="rtl">{card.translation}</p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    
                    {/* Unified Bottom Player Bar */}
                    {content.flashcards[selectedIndex] && (
                        <div className="absolute bottom-0 left-0 right-0 bg-[#fdf6e3] border-t border-amber-900/10 p-3 sm:px-8 flex items-center justify-between z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]" dir="ltr">
                            <AIAudioPlayer 
                                text={content.flashcards[selectedIndex].original} 
                                speechText={content.flashcards[selectedIndex].native}
                                language={language} 
                            />
                            <button 
                                onClick={() => toggleRecording(selectedIndex)}
                                className={`h-12 px-6 rounded-2xl flex items-center gap-2 font-bold transition-all shadow-md ${recordingIndex === selectedIndex ? 'bg-red-500 text-white animate-pulse shadow-red-500/30' : 'bg-[#e8e1d4] text-[#5c3d2e] hover:bg-[#cfc6b5]'}`}
                            >
                                {recordingIndex === selectedIndex ? (
                                    <><Square className="w-5 h-5 fill-current" /> Stop</>
                                ) : (
                                    <><Mic className="w-5 h-5" /> Practice</>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-8 flex justify-center pb-12">
                    <button onClick={onStartReview} className="btn-emerald w-full max-w-[240px] !text-lg shadow-xl">
                        {UI_TEXTS_AR.startReview}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewStage;
