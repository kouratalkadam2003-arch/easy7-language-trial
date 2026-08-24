
import React, { useState, useEffect } from 'react';
import { Language, Flashcard } from '../types';
import { SpeakerIcon, PlusIcon, CopyIcon, XIcon } from './icons';
import Spinner from './Spinner';
import { generateSpeechFromText } from '../services/ai';
import { playAudioFromBase64, speakTextBrowser } from '../utils/audio';

interface TranslationTooltipProps {
    text: string;
    translation: string | null;
    position: { top: number; left: number };
    language: Language;
    nativeText: string | null;
    isTranslating: boolean;
    onAddFlashcard: (card: Omit<Flashcard, 'id'>) => void;
    forwardedRef: React.RefObject<HTMLDivElement>;
    containerRef: React.RefObject<HTMLElement>;
}

const SPEECH_RATES = [2, 1.5, 1, 0.5, 0.15];

const TranslationTooltip: React.FC<TranslationTooltipProps> =
    ({ text, translation, language, nativeText, isTranslating, onAddFlashcard, forwardedRef }) => {
    const [speechRate, setSpeechRate] = useState(1);
    const [isSaved, setIsSaved] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);

    useEffect(() => {
        setIsSaved(false);
        setIsCopied(false);
    }, [text, translation, isTranslating]);

    useEffect(() => {
        return () => {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        };
    }, []);

    const handleSpeak = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isPlayingAudio) return;

        const textToRead = nativeText || text;
        setIsPlayingAudio(true);

        try {
            if (speechRate === 1.0) {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const base64 = await generateSpeechFromText(textToRead, language.code, 1.0);
                await playAudioFromBase64(base64, ctx, () => setIsPlayingAudio(false));
            } else {
                speakTextBrowser(textToRead, language, speechRate, null, () => setIsPlayingAudio(false));
            }
        } catch (e) {
            console.error("AI Audio failed, falling back", e);
            speakTextBrowser(textToRead, language, speechRate, null, () => setIsPlayingAudio(false));
        }
    };

    const handleAddClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (translation && !isSaved) {
            onAddFlashcard({
                originalText: text,
                translation: translation,
                nativeText: nativeText,
                speechRate: speechRate,
                nextReviewTimestamp: Date.now(), 
                status: 'new',
            });
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000); 
        }
    };

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };
    
    return (
        <div
            ref={forwardedRef}
            className="fixed z-[110] bottom-36 sm:bottom-40 left-1/2 -translate-x-1/2 w-[95%] max-w-[400px] bg-purple-900 border border-purple-700 text-white rounded-[24px] shadow-2xl p-4 sm:p-5 animate-in slide-in-from-bottom-10 fade-in duration-300"
            onClick={(e) => e.stopPropagation()}
            style={{ 
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5), 0 0 20px rgba(236,72,153,0.1)'
            }}
        >
            <div className="flex flex-col gap-4">
                 {isTranslating ? (
                    <div className="flex flex-col items-center justify-center py-6 gap-3">
                        <Spinner size="h-8 w-8 text-pink-500" />
                        <span className="text-slate-300 font-medium text-sm animate-pulse">جاري الترجمة...</span>
                    </div>
                 ) : translation ? (
                    <>
                        <div className="flex flex-col items-center text-center max-h-[35vh] overflow-y-auto no-scrollbar px-1 py-1">
                            <p className={`font-cafe font-black text-white mb-1 leading-tight ${translation.length > 100 ? 'text-base font-bold' : translation.length > 50 ? 'text-xl' : 'text-2xl'}`}>
                                {translation}
                            </p>
                            {(nativeText && nativeText.trim() !== text.trim()) && <p className={`text-slate-400 font-medium ${nativeText.length > 100 ? 'text-xs' : 'text-sm'} mt-1`} dir="ltr">{nativeText}</p>}
                        </div>
                        
                        <div className="flex flex-col gap-3 mt-1 pt-2 border-t border-purple-700/50">
                            {/* Actions Row */}
                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={handleSpeak}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-pink-600 hover:bg-pink-500 rounded-full font-bold transition-all w-full shadow-[0_4px_14px_0_rgba(236,72,153,0.39)]"
                                >
                                    {isPlayingAudio ? <Spinner size="h-5 w-5" /> : <SpeakerIcon className="w-5 h-5" />}
                                    <span>استماع</span>
                                </button>
                                
                                <button
                                    onClick={handleAddClick}
                                    disabled={isSaved}
                                    className={`p-3 rounded-full flex-shrink-0 transition-all ${isSaved ? 'bg-green-500 text-white' : 'bg-purple-800 text-white hover:bg-purple-700 border border-purple-700'}`}
                                    aria-label="Add to flashcards"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                </button>
                                
                                <button
                                    onClick={handleCopy}
                                    className="p-3 bg-purple-800 hover:bg-purple-700 border border-purple-700 text-white rounded-full flex-shrink-0 transition-colors"
                                    aria-label="Copy text"
                                >
                                    {isCopied ? <span className="text-[10px] font-bold text-green-400">نسخ!</span> : <CopyIcon className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* Speed Row */}
                            <div className="flex items-center justify-between bg-purple-800/50 rounded-full p-1.5 px-3 border border-purple-700/50">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2">سرعة</span>
                                <div className="flex gap-1">
                                    {SPEECH_RATES.map((rate) => (
                                        <button
                                            key={rate}
                                            onClick={() => setSpeechRate(rate)}
                                            className={`px-2.5 py-1 text-xs font-bold transition-colors rounded-full ${speechRate === rate ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-purple-700'}`}
                                        >
                                            {rate}x
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default TranslationTooltip;
