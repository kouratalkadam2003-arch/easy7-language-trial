import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Play, Pause, SkipForward, SkipBack, RotateCcw,
    Volume2, VolumeX, Sparkles, Smile, MessageSquare, ListMusic, Music, Radio, CheckCircle, Flame, AlertCircle, RefreshCw, Mic, Power, HelpCircle, Download, X, Languages
} from 'lucide-react';
import { RadioContentType, RadioTurn, Language } from '../types/remix_types';
import { generateSpeechFromText } from '../../services/ai';
import { playAudioFromBase64, speakTextBrowser } from '../../utils/audio';
import Spinner from './Spinner';
import { Teleprompter } from './lesson/Teleprompter';
import { useLiveRadio, LiveSpeaker } from '../hooks/useLiveRadio';
import { useUserStore } from '@/store/userStore';
import { GoogleGenAI, Modality } from '@google/genai';

interface RadioStageProps {
    content: RadioContentType | null;
    isLoading: boolean;
    error: boolean;
    onRetry: () => void;
    onRegenerate: () => void;
    language: Language;
    nativeLanguage: Language;
    topic: { id: string; title: string };
    dayNumber: number;
    level: string;
    onBack: () => void;
    onNextStage: () => void;
}

import { getApiKey } from '../utils/apiKeyPool';

const RadioStage: React.FC<RadioStageProps> = ({
    content, isLoading, error, onRetry, onRegenerate,
    language, nativeLanguage, topic, dayNumber, level, onBack, onNextStage,
}) => {
    const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showTranslation, setShowTranslation] = useState<boolean>(true);
    const [audioStatus, setAudioStatus] = useState<'idle' | 'loading' | 'speaking' | 'paused'>('idle');
    const [isMuted, setIsMuted] = useState(false);
    const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
    const [completedTurns, setCompletedTurns] = useState<Set<number>>(new Set());
    const [showNativeScript, setShowNativeScript] = useState(false);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    
    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        return () => {
            if (audioContextRef.current?.state !== 'closed') {
                audioContextRef.current?.close().catch(() => {});
            }
        };
    }, []);


    const [activeLiveSpeaker, setActiveLiveSpeaker] = useState<'sarah' | 'khalid' | null>(null);
    const liveAudioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const liveNextAudioTimeRef = useRef<number>(0);

    const playAudioChunk = useCallback(async (base64: string, speaker: LiveSpeaker) => {
        if (!audioContextRef.current || audioContextRef.current?.state === 'closed') return;
        if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
        try {
            if (speaker === 'sarah') setActiveLiveSpeaker('sarah');
            else if (speaker === 'khalid') setActiveLiveSpeaker('khalid');
            const bin = atob(base64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            const int16 = new Int16Array(bytes.buffer);
            const f32 = new Float32Array(int16.length);
            for (let i = 0; i < int16.length; i++) f32[i] = int16[i] / 32768;
            const buf = audioContextRef.current.createBuffer(1, f32.length, 24000);
            buf.getChannelData(0).set(f32);
            const src = audioContextRef.current.createBufferSource();
            src.buffer = buf;
            src.connect(audioContextRef.current.destination);
            liveAudioSourcesRef.current.add(src);
            setAudioStatus('speaking');
            src.addEventListener('ended', () => {
                liveAudioSourcesRef.current.delete(src);
                if (liveAudioSourcesRef.current.size === 0) {
                    setAudioStatus('idle');
                    setActiveLiveSpeaker(null);
                }
            });
            const now = audioContextRef.current.currentTime;
            const startAt = (liveNextAudioTimeRef.current < now) ? (now + 0.10) : liveNextAudioTimeRef.current;
            src.start(startAt);
            liveNextAudioTimeRef.current = startAt + buf.duration;
        } catch (e) { console.error('[radio:live] chunk decode failed', e); }
    }, []);

    const currentStoreLevel = useUserStore((s) => s.currentLevel);
    const effectiveLevel = currentStoreLevel || level || 'A1';

    const lessonPhrases = useMemo(() => (content?.turns || []).map(t => ({
        text: t.text || t.nativeScript || '',
        translation: t.translation || '',
        phonetic: (t as any).phonetic || ''
    })).filter(t => t.text && t.text.trim().length > 0), [content?.turns]);

    const {
        isLiveMode,
        setIsLiveMode,
        connectionStatus,
        liveConversation,
        liveErrorMessage,
        connectToLiveSession,
        disconnectLiveSession
    } = useLiveRadio(language, topic, effectiveLevel, playAudioChunk, lessonPhrases);

    const transcriptionEndRef = useRef<HTMLDivElement>(null);

    const handlePlayPause = () => setIsPlaying(!isPlaying);
    const handlePrevTurn = () => { if (currentTurnIndex > 0) setCurrentTurnIndex(prev => prev - 1); setIsPlaying(true); };
    const handleNextTurn = () => { if (content && currentTurnIndex < content.turns.length - 1) setCurrentTurnIndex(prev => prev + 1); setIsPlaying(true); };
    const handleReset = () => { setCurrentTurnIndex(0); setCompletedTurns(new Set()); setIsPlaying(true); };

    const handleExportConversation = () => {
        const text = isLiveMode ? liveConversation.map(t => t.text).join('\\n') : turns.map(t => `${t.speaker}: ${t.text}`).join('\\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'radio_transcript.txt';
        a.click();
    };

    if (isLoading) {
        return (
            <div id="radio_stage_loading" className="flex flex-col items-center justify-center p-8 sm:p-12 min-h-[400px] sm:min-h-[500px] bg-slate-950 text-white rounded-2xl border border-slate-900 shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-pink-500 to-indigo-500 animate-pulse" />
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="flex flex-col items-center max-w-md text-center">
                    <div className="relative mb-6 sm:mb-8">
                        <div className="absolute -inset-4 rounded-full bg-pink-500/20 blur-xl animate-pulse" />
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-dashed border-pink-500 border-t-transparent animate-spin flex items-center justify-center">
                            <Radio className="w-8 h-8 sm:w-10 sm:h-10 text-pink-400" />
                        </div>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">راديو القرية الـ AI قيد التحضير... 📻</h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4 sm:mb-6 px-2">سارة وخالد يقومان بضبط الميكروفونات ومراجعة الدرس.</p>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-pink-500 h-1.5 rounded-full animate-marquee" style={{ width: '40%' }} />
                    </div>
                </motion.div>
            </div>
        );
    }

    if (error || !content) {
        return (
            <div id="radio_stage_error" className="flex flex-col items-center justify-center p-8 sm:p-12 min-h-[400px] sm:min-h-[500px] bg-slate-950 text-white rounded-2xl border border-red-900 shadow-2xl">
                <AlertCircle className="w-16 h-16 sm:w-20 sm:h-20 text-red-500 mb-4 sm:mb-6 animate-pulse" />
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">حدث خطأ أثناء الاتصال بالراديو!</h3>
                <p className="text-xs sm:text-sm text-slate-400 mb-6 sm:mb-8 max-w-sm text-center leading-relaxed px-4">لم نتمكن من توليد نقاش الراديو بين سارة وخالد. يرجى إعادة المحاولة.</p>
                <div className="flex flex-wrap gap-3 sm:gap-4 justify-center">
                    <button onClick={onRetry} className="px-5 sm:px-6 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 transition-all text-white font-semibold rounded-lg text-xs sm:text-sm flex items-center gap-2 shadow-lg"><RefreshCw className="w-4 h-4" />إعادة المحاولة</button>
                    <button onClick={onBack} className="px-5 sm:px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs sm:text-sm">رجوع للدرس</button>
                </div>
            </div>
        );
    }

    const turns = content.turns;
    const currentTurn = turns[currentTurnIndex];
    const isSaraActive = isLiveMode ? activeLiveSpeaker === 'sarah' : (audioStatus === 'speaking' && currentTurn?.speaker === 'Sara');
    const isKhalidActive = isLiveMode ? activeLiveSpeaker === 'khalid' : (audioStatus === 'speaking' && currentTurn?.speaker === 'Khalid');

    return (
        <div id="radio_stage_container" dir="rtl" className="fixed inset-0 z-40 flex flex-col lg:flex-row w-full h-[100dvh] overflow-hidden bg-white" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
            
            {fallbackMessage && (
                <div className="absolute top-4 left-4 right-4 z-[100] bg-amber-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between text-sm sm:text-base animate-pulse pointer-events-auto">
                    <span>{fallbackMessage}</span>
                    <button onClick={() => setFallbackMessage(null)} className="opacity-80 hover:opacity-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Error toast for Live mode */}
            {isLiveMode && liveErrorMessage && (
                <div className="absolute top-12 sm:top-16 left-1/2 -translate-x-1/2 bg-red-600 text-white px-3 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold flex items-center gap-2 z-[70] shadow-lg max-w-[92vw] text-center leading-snug">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" /> {liveErrorMessage}
                </div>
            )}

            {/* Top toolbar */}
            <header className="absolute top-0 left-0 w-full flex items-center justify-between p-3 sm:p-4 z-[60] pointer-events-none">
                <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
                    <div className="p-1.5 sm:p-2 bg-white/70 backdrop-blur-md rounded-lg sm:rounded-xl shadow-sm border border-white/60">
                        <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 animate-pulse" />
                    </div>
                    {(language?.code === 'ja' || language?.code === 'zh') && (
                        <button 
                            onClick={() => setShowNativeScript(prev => !prev)}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/80 backdrop-blur-md text-slate-800 font-bold rounded-lg sm:rounded-xl text-[10px] sm:text-xs flex items-center gap-1.5 shadow-sm border border-slate-200 hover:bg-white active:scale-95 transition-all"
                            title={language.code === 'ja' ? 'التبديل بين الروماجي والكانجي' : 'التبديل بين البينيين والهانزي'}
                        >
                            <Languages className="w-3.5 h-3.5 text-blue-600" />
                            <span>{language.code === 'ja' ? (showNativeScript ? '🔤 عرض الروماجي' : '🇯🇵 عرض الكانجي/هيراغانا') : (showNativeScript ? '🔤 عرض البينيين' : '🇨🇳 عرض الرموز (هانزي)')}</span>
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2 pointer-events-auto">
                    <button onClick={() => setPlaybackSpeed(s => s >= 1.5 ? 0.75 : s + 0.25)} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/70 backdrop-blur-md text-slate-800 font-bold rounded-lg sm:rounded-xl text-[10px] sm:text-xs flex items-center gap-1 sm:gap-2 shadow-sm border border-slate-200 hover:bg-white transition-all">
                        {playbackSpeed}x
                    </button>
                    <button onClick={handleExportConversation} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/70 backdrop-blur-md text-slate-800 font-bold rounded-lg sm:rounded-xl text-[10px] sm:text-xs flex items-center gap-1 sm:gap-2 shadow-sm border border-slate-200 hover:bg-white transition-all">
                        <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" /> تصدير
                    </button>
                    <button onClick={onNextStage} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/70 backdrop-blur-md text-slate-800 font-bold rounded-lg sm:rounded-xl text-[10px] sm:text-xs flex items-center gap-1 sm:gap-2 shadow-sm border border-slate-200 hover:bg-white transition-all">
                        خروج وتالي
                    </button>
                </div>
            </header>

            {/* Sara (top on mobile, right on desktop) */}
            <div className="flex-1 relative w-full min-h-0 overflow-hidden">
                <Teleprompter 
                    speaker="Sara" 
                    turns={turns} 
                    globalActiveTurnIndex={currentTurnIndex} 
                    isLiveMode={isLiveMode} 
                    audioStatus={audioStatus} 
                    activeLiveSpeaker={activeLiveSpeaker}
                    liveConversation={liveConversation}
                    language={language}
                    showNativeScript={showNativeScript}
                    onToggleNativeScript={() => setShowNativeScript(prev => !prev)}
                />
            </div>

            {/* Center controls */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-[60] pointer-events-auto">
                <div className="flex items-center justify-center scale-90 sm:scale-100">
                    <AnimatePresence mode="wait">
                        {!isLiveMode ? (
                            <motion.button key="live-start" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.25 }}
                                onClick={() => { 
                                    if (audioContextRef.current?.state === 'suspended') {
                                        audioContextRef.current.resume();
                                    }
                                    setIsLiveMode(true); 
                                    connectToLiveSession(); 
                                }}
                                className="px-5 sm:px-7 py-2.5 sm:py-3 rounded-full bg-[#D63E63]/90 text-white text-[10px] sm:text-xs font-black tracking-widest hover:bg-[#D63E63] shadow-2xl flex items-center gap-2 sm:gap-3 transition-all active:scale-95"
                                title="تشغيل البث المباشر بالـ AI">
                                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" /> LIVE
                            </motion.button>
                        ) : (
                            <motion.button key="live-active" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.25 }}
                                onClick={() => { disconnectLiveSession(); setIsLiveMode(false); }}
                                className={`px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-[10px] sm:text-xs font-black tracking-widest transition-all flex items-center gap-2 sm:gap-3 shadow-2xl ${
                                    connectionStatus === 'connected' ? 'bg-red-600 text-white shadow-red-600/40 animate-pulse' :
                                    connectionStatus === 'connecting' ? 'bg-amber-500 text-white animate-pulse' :
                                    connectionStatus === 'error' ? 'bg-red-800 text-white' : 'bg-[#D63E63] text-white hover:bg-[#D63E63]/90'
                                }`}>
                                <Radio className="w-3 h-3 sm:w-4 sm:h-4" />
                                {connectionStatus === 'connected' ? 'بث مباشر • إيقاف' :
                                 connectionStatus === 'connecting' ? 'جاري الاتصال…' :
                                 connectionStatus === 'error' ? 'فشل - إعادة' : 'LIVE'}
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Live transcript overlay */}
            {isLiveMode && (
                <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-[55] w-[92vw] max-w-md pointer-events-none">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 p-2 sm:p-3 max-h-32 sm:max-h-40 overflow-y-auto pointer-events-auto" ref={transcriptionEndRef as any}>
                        {liveConversation.length === 0 && connectionStatus === 'connecting' && <div className="text-center text-[10px] sm:text-xs text-slate-500 py-2">جاري الاتصال بسارة وخالد…</div>}
                        {liveConversation.length === 0 && connectionStatus === 'connected' && <div className="text-center text-[10px] sm:text-xs text-slate-500 py-2">بدأ البث…</div>}
                        {liveConversation.slice(-6).map(item => (
                            <div key={item.id} className={`text-[10px] sm:text-xs leading-relaxed ${item.speaker === 'user' ? 'text-slate-500 italic' : (item.speakerTag === 'sarah' ? 'text-pink-700' : 'text-blue-700')}`}>
                                {item.text}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Khalid (bottom on mobile, left on desktop) */}
            <div className="flex-1 relative w-full min-h-0 overflow-hidden">
                <Teleprompter 
                    speaker="Khalid" 
                    turns={turns} 
                    globalActiveTurnIndex={currentTurnIndex} 
                    isLiveMode={isLiveMode} 
                    audioStatus={audioStatus} 
                    activeLiveSpeaker={activeLiveSpeaker}
                    liveConversation={liveConversation}
                    language={language}
                    showNativeScript={showNativeScript}
                    onToggleNativeScript={() => setShowNativeScript(prev => !prev)}
                />
            </div>

            {/* Mobile bottom progress (Standard mode) */}
            {!isLiveMode && (
                <div className="absolute bottom-0 left-0 right-0 z-[50] p-2 sm:p-3 bg-gradient-to-t from-white via-white/80 to-transparent md:hidden" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
                    <div className="flex items-center justify-center gap-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-slate-200 p-1 mx-auto max-w-xs">
                        <button onClick={handlePrevTurn} disabled={currentTurnIndex === 0} className="w-9 h-9 rounded-full bg-slate-100 disabled:opacity-30 flex items-center justify-center hover:bg-slate-200 transition-all"><SkipBack className="w-4 h-4" /></button>
                        <button onClick={handleReset} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-all"><RotateCcw className="w-4 h-4" /></button>
                        <button onClick={handleNextTurn} disabled={currentTurnIndex >= turns.length - 1} className="w-9 h-9 rounded-full bg-slate-100 disabled:opacity-30 flex items-center justify-center hover:bg-slate-200 transition-all"><SkipForward className="w-4 h-4" /></button>
                    </div>
                </div>
            )}

            <style>{`
                #radio_stage_container { overflow: hidden !important; }
                #radio_stage_container > div.flex-1 { min-height: 0; }
            `}</style>
        </div>
    );
};
export default RadioStage;
