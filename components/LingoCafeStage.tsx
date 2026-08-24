
import React, { useState, useEffect, useRef } from 'react';
import { Language, Topic, Flashcard } from '../types';
import { generateCafeTopic, processCafeInput, CafeTopic, CafeTranslationResult } from '../services/lingoCafeService';
import { fetchContextualTranslation, convertTextForTTS } from '../services/ai';
import { speak } from '../utils/audio';
import { MicrophoneIcon, SpeakerIcon, HistoryIcon, TrashIcon, DownloadIcon } from './icons';
import { LiveServerMessage, Modality } from '@google/genai';
import { ai, generateContentWithRetry } from '../services/ai';
import { LIVE_API_MODEL } from '../constants';
import { createBlob, decode, decodeAudioData } from '../utils/audio';
import AIAudioPlayer from './AIAudioPlayer'; 
import { Type } from '@google/genai';
import { cleanAndParseJson } from '../utils/json';

// --- ICONS ---
const CoffeeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>
);

// --- TYPES ---
interface VocabularyItem extends CafeTranslationResult {
    id: string;
    timestamp: number;
}

interface LiveConversationItem {
    id: string;
    original: string; // The text shown to user (Pinyin/Romaji/Arabic)
    translation: string; // The text shown to user (Arabic/Pinyin/Romaji)
    originalScript?: string; // The actual script (Hanzi/Kanji) for TTS
    translationScript?: string; // The actual script (Hanzi/Kanji) for TTS
    speaker: 'user' | 'ai';
}

interface LingoCafeStageProps {
    language: Language;
    nativeLanguage: Language;
    topic: Topic;
    onAddFlashcard: (card: Omit<Flashcard, 'id'>) => void;
}

// --- CONSTANTS ---
declare const saveAs: any;
declare const JSZip: any;

const LingoCafeStage: React.FC<LingoCafeStageProps> = ({ language, nativeLanguage, topic, onAddFlashcard }) => {
    // --- STATE ---
    const [cafeTopic, setCafeTopic] = useState<CafeTopic | null>(null);
    const [history, setHistory] = useState<VocabularyItem[]>([]);
    const [showVault, setShowVault] = useState(false);
    
    // Live Mode State
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
    const [liveConversation, setLiveConversation] = useState<LiveConversationItem[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Standard Mode State
    const [isListeningStandard, setIsListeningStandard] = useState(false);
    const [isProcessingStandard, setIsProcessingStandard] = useState(false);
    const [standardResult, setStandardResult] = useState<CafeTranslationResult | null>(null);

    // --- REFS (Live API) ---
    const sessionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextAudioTimeRef = useRef<number>(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    
    // Keep Alive & Stability Refs
    const keepAliveIntervalRef = useRef<any>(null);
    const userIntendedLiveRef = useRef(false); 
    const wakeLockRef = useRef<any>(null);
    const retryTimeoutRef = useRef<any>(null);
    
    // Transcription Buffers
    const currentInputRef = useRef<string>("");
    const currentOutputRef = useRef<string>("");

    // Standard Mode Refs
    const recognitionRef = useRef<any>(null);

    // --- INIT ---
    useEffect(() => {
        const saved = localStorage.getItem('lingoCafeHistory');
        if (saved) {
            try { setHistory(JSON.parse(saved)); } catch(e) {}
        }

        const loadTopic = async () => {
            const t = await generateCafeTopic(topic, language, nativeLanguage);
            setCafeTopic(t);
        };
        loadTopic();

        return () => {
            disconnectLiveSession(true);
        };
    }, [topic, language, nativeLanguage]);

    useEffect(() => {
        localStorage.setItem('lingoCafeHistory', JSON.stringify(history));
    }, [history]);

    // --- WAKE LOCK (Prevent Phone Sleep) ---
    const requestWakeLock = async () => {
        if ('wakeLock' in navigator) {
            try {
                wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
            } catch (err) {
                console.warn('Wake Lock failed:', err);
            }
        }
    };

    const releaseWakeLock = () => {
        if (wakeLockRef.current) {
            wakeLockRef.current.release().then(() => { wakeLockRef.current = null; });
        }
    };

    // -------------------------------------------------------------------------
    // --- LIVE API LOGIC (ROBUST) ---
    // -------------------------------------------------------------------------

    const disconnectLiveSession = (intended = true) => {
        if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = null;
        
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;

        if (sessionRef.current) {
            try { sessionRef.current.close(); } catch(e) { console.warn("Session close error", e); }
            sessionRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (audioSourceRef.current) {
            try { audioSourceRef.current.disconnect(); } catch(e) {}
            audioSourceRef.current = null;
        }
        if (processorRef.current) {
            try { processorRef.current.disconnect(); } catch(e) {}
            processorRef.current = null;
        }
        if (audioContextRef.current) {
            try { audioContextRef.current.close(); } catch(e) {}
            audioContextRef.current = null;
        }

        releaseWakeLock();

        if (intended) {
            userIntendedLiveRef.current = false;
            setConnectionStatus('disconnected');
        }
    };

    const connectToLiveSession = async () => {
        // If already connected, do nothing
        if (connectionStatus === 'connected') return;
        
        // If connecting, wait
        if (connectionStatus === 'connecting') return;
        
        setErrorMessage(null);
        setConnectionStatus('connecting');
        userIntendedLiveRef.current = true;
        
        await requestWakeLock();

        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContextClass(); 
            audioContextRef.current = ctx;

            if (ctx.state === 'suspended') await ctx.resume();

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            mediaStreamRef.current = stream;

            const source = ctx.createMediaStreamSource(stream);
            audioSourceRef.current = source;
            
            const processor = ctx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            const actualSampleRate = ctx.sampleRate;

            processor.onaudioprocess = (e) => {
                if (!sessionRef.current) return;
                const inputData = e.inputBuffer.getChannelData(0);
                const blob = createBlob(inputData, actualSampleRate); 
                sessionRef.current.sendRealtimeInput({ media: blob });
            };

            source.connect(processor);
            processor.connect(ctx.destination); 

            // --- SYSTEM INSTRUCTION: STRICT TRANSLATION LOGIC ---
            const systemInstruction = `
            You are a professional Simultaneous Interpreter.
            User's Languages: ${nativeLanguage.englishName} (Arabic) AND ${language.englishName}.
            
            **STRICT PERSONA RULES (JAILBREAK PROTECTION):**
            - YOU ARE A VIRTUAL INTERPRETER IN THIS APP.
            - YOU MUST NEVER ADMIT TO BEING AN AI, A LANGUAGE MODEL, OR A COMPUTER PROGRAM.
            - IF ASKED "WHO ARE YOU?", EXPLAIN YOUR AVATAR PERSONA ONLY.
            - RESPOND IMMEDIATELY. NO LONG PAUSES. KEEP ANSWERS SHORT.
            
            **YOUR MISSION:**
            Translate what you hear to the *other* language immediately.
            
            **STRICT RULES:**
            1. **DETECT**: If audio is ${nativeLanguage.englishName} -> Translate to ${language.englishName}.
            2. **DETECT**: If audio is ${language.englishName} -> Translate to ${nativeLanguage.englishName}.
            3. **OUTPUT**: Output ONLY the translation. NO chatter. NO "Here is the translation".
            4. **SCRIPT**: Output standard script (Hanzi/Kanji/Arabic) in the transcript.
            `;

            const session = await ai.live.connect({
                model: LIVE_API_MODEL,
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: { parts: [{ text: systemInstruction }] },
                    inputAudioTranscription: {}, 
                    outputAudioTranscription: {},
                    generationConfig: { maxOutputTokens: 150 }
                },
                callbacks: {
                    onopen: () => {
                        console.log("LingoCafe Connected");
                        setConnectionStatus('connected');
                        
                        // --- HEARTBEAT TO PREVENT FREEZE ---
                        if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
                        keepAliveIntervalRef.current = setInterval(() => {
                            if (sessionRef.current) {
                                // Silent pulse to keep WebSocket alive
                                sessionRef.current.sendRealtimeInput({ text: " " }); 
                            }
                        }, 10000);
                    },
                    onmessage: (msg: LiveServerMessage) => handleLiveMessage(msg),
                    onclose: () => {
                        console.log("Disconnected");
                        // Auto-reconnect logic
                        if (userIntendedLiveRef.current) {
                            setConnectionStatus('connecting');
                            retryTimeoutRef.current = setTimeout(() => {
                                console.log("Auto-reconnecting...");
                                connectToLiveSession();
                            }, 1000);
                        } else {
                            setConnectionStatus('disconnected');
                        }
                    },
                    onerror: (err) => {
                        console.warn("Error:", err);
                        // Retry on error
                        if (userIntendedLiveRef.current) {
                            retryTimeoutRef.current = setTimeout(() => {
                                console.log("Retrying after error...");
                                connectToLiveSession();
                            }, 2000);
                        } else {
                            setErrorMessage("انقطع الاتصال.");
                            setConnectionStatus('error');
                            disconnectLiveSession(true);
                        }
                    }
                }
            });

            sessionRef.current = session;

        } catch (error: any) {
            console.warn("Connection Failed:", error);
            const isDenied = error.name === 'NotAllowedError' || error.message?.toLowerCase().includes("denied");
            if (isDenied || error.name === 'NotFoundError') {
                setErrorMessage(isDenied ? "⚠ تم حظر الميكروفون! يرجى السماح به من شريط العنوان (رمز 🔒)" : "لم يتم العثور على ميكروفون.");
                userIntendedLiveRef.current = false;
                setConnectionStatus('error');
            } else {
                setErrorMessage("فشل الاتصال. تحقق من الشبكة.");
                setConnectionStatus('error');
                
                // Retry if intent is live
                if (userIntendedLiveRef.current) {
                     retryTimeoutRef.current = window.setTimeout(() => connectToLiveSession(), 3000);
                } else {
                    disconnectLiveSession(true);
                }
            }
        }
    };

    const handleLiveMessage = async (msg: LiveServerMessage) => {
        if (msg.serverContent?.interrupted) {
            for (const src of audioSourcesRef.current.values()) {
                try { src.stop(); } catch (e) {}
            }
            audioSourcesRef.current.clear();
            nextAudioTimeRef.current = 0;
        }

        // Audio Output
        const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (base64Audio && audioContextRef.current) {
            try {
                const raw = decode(base64Audio);
                const buffer = await decodeAudioData(raw, audioContextRef.current, 24000, 1);
                
                const src = audioContextRef.current.createBufferSource();
                src.buffer = buffer;
                src.connect(audioContextRef.current.destination);
                
                const now = audioContextRef.current.currentTime;
                if (nextAudioTimeRef.current < now) nextAudioTimeRef.current = now;
                
                src.addEventListener('ended', () => audioSourcesRef.current.delete(src));
                audioSourcesRef.current.add(src);
                
                src.start(nextAudioTimeRef.current);
                nextAudioTimeRef.current += buffer.duration;
            } catch (e) {
                console.error("Audio error", e);
            }
        }

        // Text Transcriptions
        const inputTx = msg.serverContent?.inputTranscription?.text;
        const outputTx = msg.serverContent?.outputTranscription?.text;

        if (inputTx) currentInputRef.current += inputTx;
        if (outputTx) currentOutputRef.current += outputTx;

        // Turn Complete
        if (msg.serverContent?.turnComplete) {
            const original = currentInputRef.current.trim();
            const translation = currentOutputRef.current.trim();

            if (original && translation) {
                // Post-process to handle Pinyin/Romaji display
                const processedItem = await processTurnText(original, translation);
                
                setLiveConversation(prev => [...prev, processedItem]);
                
                // Save to history with details
                const historyItem: VocabularyItem = {
                    id: processedItem.id,
                    timestamp: Date.now(),
                    detectedLanguage: 'auto',
                    correctedOriginal: processedItem.original,
                    translation: processedItem.translation,
                    transliteration: processedItem.originalScript || "", 
                };
                setHistory(prev => [historyItem, ...prev]);
            }
            currentInputRef.current = "";
            currentOutputRef.current = "";
        }
    };

    // --- PINYIN/ROMAJI CONVERTER ---
    const processTurnText = async (original: string, translation: string): Promise<LiveConversationItem> => {
        const isZhOrJa = language.code === 'zh' || language.code === 'ja';
        
        let finalOriginal = original;
        let finalTranslation = translation;
        let originalScript = undefined;
        let translationScript = undefined;

        // Helper: Check if string contains CJK characters
        const containsCJK = (text: string) => /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(text);

        // Helper: Check if string is likely Romanized (Pinyin/Romaji)
        // If it's Chinese/Japanese but has NO CJK, it's likely romanized.
        const isRomanized = (text: string) => !containsCJK(text) && /[a-zA-Z]/.test(text);

        try {
            // Check Input Side (Did user speak target language?)
            if (isZhOrJa) {
                if (containsCJK(original)) {
                    // It IS native script. We might want Pinyin for display.
                    originalScript = original;
                } else if (isRomanized(original)) {
                    // It IS Pinyin/Romaji. We MUST get Native Script for TTS.
                    const converted = await convertTextForTTS(original, language.code);
                    if (converted) {
                        originalScript = converted.tts_text; // Hanzi/Kana (Native for TTS)
                        finalOriginal = converted.display_text; // Clean Pinyin (Display)
                    }
                }
            }

            // Check Output Side (Translation)
            if (isZhOrJa) {
                if (containsCJK(translation)) {
                    translationScript = translation;
                } else if (isRomanized(translation)) {
                    // Model translated to Romanized Chinese/Japanese -> Convert Output
                    const converted = await convertTextForTTS(translation, language.code);
                    if (converted) {
                        translationScript = converted.tts_text;
                        finalTranslation = converted.display_text;
                    }
                }
            }
        } catch (e) {
            console.warn("Conversion failed, using original text", e);
        }

        return {
            id: Date.now().toString(),
            original: finalOriginal,
            translation: finalTranslation,
            originalScript,
            translationScript,
            speaker: 'user'
        };
    };

    // --- STANDARD MODE UI Logic ---
    const toggleListeningStandard = () => {
        alert("يرجى استخدام الوضع المباشر (Live) للحصول على أفضل تجربة.");
    };

    const handleExportAnki = async () => {
        if (history.length === 0) return;
        const zip = new JSZip();
        let csvContent = "#separator:tab\n#html:true\n#tags:lingo-cafe\n";
        for (const item of history) {
            const front = `<div><h2>${item.translation}</h2></div>`;
            const back = `<div><h1>${item.correctedOriginal}</h1><hr><p>${item.translation}</p></div>`;
            csvContent += `${front}\t${back}\n`;
        }
        zip.file("cafe_deck.txt", csvContent);
        try {
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `LingoCafe_${language.englishName}.apkg`); 
        } catch (e) {
            alert("فشل التصدير.");
        }
    };

    const clearHistory = () => {
        if (window.confirm("هل أنت متأكد من مسح السجل؟")) {
            setHistory([]);
            localStorage.removeItem('lingoCafeHistory');
        }
    };

    // --- UI RENDER ---
    return (
        <div className="h-full w-full flex flex-col font-cafe relative bg-[#faf7f2] text-[#463122]">
            
            {/* Top Bar */}
            <div className="flex justify-between items-center p-4 bg-white/80 backdrop-blur-sm border-b border-[#e5e0d8] shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#6f4e37] text-white rounded-xl shadow-md">
                        <CoffeeIcon />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg leading-tight">LingoCafe</h2>
                        <p className="text-xs text-[#8c7b70]">{isLiveMode ? 'المترجم الفوري (Live)' : 'الوضع العادي'}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => {
                            if (isLiveMode) disconnectLiveSession(true);
                            else connectToLiveSession();
                            setIsLiveMode(!isLiveMode);
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-2 ${isLiveMode ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-purple-600 border-slate-300'}`}
                    >
                        <div className={`w-2 h-2 rounded-full ${isLiveMode ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`}></div>
                        {isLiveMode ? 'إيقاف المباشر' : 'تفعيل المباشر'}
                    </button>
                    
                    <button onClick={() => setShowVault(true)} className="p-2 bg-[#a67c52] text-white rounded-full hover:scale-105 transition-transform shadow-md">
                        <HistoryIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center gap-4">
                
                {errorMessage && (
                    <div className="w-full max-w-lg bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-center text-sm font-bold flex items-center justify-center gap-2">
                        <span>⚠️</span> {errorMessage}
                    </div>
                )}

                {!isLiveMode && cafeTopic && (
                    <div className="w-full max-w-xl bg-white p-6 rounded-3xl shadow-lg border-2 border-[#e5e0d8] text-center mb-4">
                        <h3 className="text-[#a67c52] text-xs font-bold tracking-widest uppercase mb-2">سيناريو اليوم</h3>
                        <h1 className="text-lg font-black mb-4">{cafeTopic.title}</h1>
                        <div className="space-y-3 text-right">
                            {cafeTopic.dialogue.slice(0, 2).map((line, i) => (
                                <div key={i} className={`p-3 rounded-xl text-sm ${line.speaker === 'A' ? 'bg-[#f8f1e9] text-[#5a3e2b]' : 'bg-[#6f4e37] text-white'}`}>
                                    <span className="font-bold opacity-50 block text-[10px] mb-1">{line.speaker}</span>
                                    {line.text}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* LIVE MODE UI */}
                {isLiveMode && (
                    <div className="w-full max-w-xl flex-1 flex flex-col">
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
                                connectionStatus === 'connected' ? 'border-green-400 shadow-[0_0_30px_rgba(74,222,128,0.3)]' : 
                                (connectionStatus === 'connecting' ? 'border-yellow-400 animate-spin' : 'border-purple-100')
                            }`}>
                                {connectionStatus === 'connected' ? (
                                    <div className="text-4xl animate-pulse">🎙️</div>
                                ) : (
                                    <div className="text-4xl grayscale opacity-50">☕</div>
                                )}
                            </div>
                            <p className="mt-4 font-bold text-purple-500 animate-pulse">
                                {connectionStatus === 'connected' ? "تحدث... سيقوم بالترجمة تلقائياً" : 
                                (connectionStatus === 'connecting' ? "جاري الاتصال بالسيرفر..." : "غير متصل")}
                            </p>
                            {connectionStatus === 'connected' && (
                                <p className="text-xs text-green-600 mt-2 font-mono">● اتصال مباشر (Live API)</p>
                            )}
                        </div>

                        <div className="flex-1 bg-white rounded-t-3xl shadow-inner border-x border-t border-[#e5e0d8] p-4 overflow-y-auto min-h-[200px]">
                            {liveConversation.length === 0 && (
                                <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                                    سجل المحادثة سيظهر هنا...
                                </div>
                            )}
                            {liveConversation.map((item) => (
                                <div key={item.id} className="mb-4 animate-slideUp">
                                    <div className="bg-[#f8f1e9] p-3 rounded-2xl rounded-tr-none text-right border border-[#eaddcf]">
                                        <p className="font-bold text-[#6f4e37]">{item.original}</p>
                                        {/* Show script if Pinyin is displayed */}
                                        {item.originalScript && <p className="text-xs text-slate-400 mt-1">{item.originalScript}</p>}
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 text-left justify-end">
                                        <div className="text-right">
                                            <p className="text-green-600 font-bold dir-ltr">{item.translation}</p>
                                            {item.translationScript && <p className="text-xs text-slate-400 font-mono">{item.translationScript}</p>}
                                        </div>
                                        
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <AIAudioPlayer 
                                                text={item.translation}
                                                // If we have a script (Hanzi), pass it to TTS for better quality
                                                speechText={item.translationScript || item.translation}
                                                language={language}
                                                className="scale-75"
                                                useBrowserTTS={false} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STANDARD MODE UI (Hidden in Live) */}
                {!isLiveMode && (
                    <div className="w-full max-w-xl text-center pb-8 opacity-60">
                        <button 
                            onClick={toggleListeningStandard}
                            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all mx-auto bg-gray-300`}
                        >
                            <MicrophoneIcon className="w-8 h-8 text-white" />
                        </button>
                    </div>
                )}
            </div>

            {/* Vault Drawer */}
            {showVault && (
                <div className="absolute inset-0 z-50 bg-purple-900/50 backdrop-blur-sm flex justify-end" onClick={() => setShowVault(false)}>
                    <div className="w-full max-w-sm bg-white h-full shadow-2xl p-4 flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4 pb-4 border-b">
                            <h2 className="font-bold text-xl flex items-center gap-2"><HistoryIcon className="w-6 h-6 text-[#a67c52]"/> سجل الكلمات</h2>
                            <button onClick={() => setShowVault(false)} className="text-slate-400 hover:text-purple-600 text-2xl">&times;</button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3">
                            {history.length === 0 ? <p className="text-center text-slate-400 py-10">السجل فارغ</p> : 
                                history.map((item, idx) => (
                                    <div key={idx} className="p-3 bg-[#faf7f2] rounded-xl border border-[#e5e0d8]">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-bold text-[#6f4e37]">{item.correctedOriginal}</span>
                                            <div onClick={e => e.stopPropagation()}>
                                                <AIAudioPlayer 
                                                    text={item.translation}
                                                    speechText={item.transliteration ? item.translation : undefined} 
                                                    language={language}
                                                    className="scale-75 origin-right"
                                                    useBrowserTTS={false}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-lg font-bold text-purple-800" dir="ltr">{item.translation}</p>
                                    </div>
                                ))
                            }
                        </div>
                        <div className="pt-4 mt-auto border-t flex gap-2">
                            <button onClick={handleExportAnki} className="flex-1 bg-[#a67c52] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"><DownloadIcon className="w-5 h-5"/> تصدير</button>
                            <button onClick={clearHistory} className="px-4 bg-red-100 text-red-600 rounded-xl"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LingoCafeStage;
