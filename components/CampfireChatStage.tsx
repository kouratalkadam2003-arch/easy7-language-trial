import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modality, LiveServerMessage } from '@google/genai';
import { ai } from '../services/ai';
import { Language, Topic, TranscriptEntry, WordData, Flashcard } from '../types';
import { LIVE_API_MODEL, FIXED_CHARACTERS, TEXT_MODEL } from '../constants';

const UI_TEXTS_AR = {
    connecting: "جاري إشعال النار والاتصال...",
    listening: "إيلي تستمع لك...",
    speaking: "إيلي تتحدث...",
    error: "حدث خطأ. حاول مرة أخرى.",
    storyError: "لا يمكن بدء المحادثة بدون قصة.",
    placeholder: "اكتب شيئاً لإيلي، أو تحدث مباشرة...",
};

interface CampfireChatStageProps {
    nativeLanguage: Language;
    language: Language;
    topic: Topic;
    level: string;
    storyContent: string | null;
    isPractice: boolean;
    dayNumber: number;
    wordDataCache: Record<string, WordData>;
    onCacheWordData: (key: string, data: WordData) => void;
    onAddFlashcard: (card: Omit<Flashcard, 'id'>) => void;
    flashcards?: Flashcard[];
    onNextStage?: () => void;
}

const RobotAvatar = ({ gender }: { gender: 'female' | 'male' }) => (
    <div className="w-10 h-10 relative flex-shrink-0">
        <div className="absolute inset-0 bg-white rounded-full shadow-md border border-amber-50 flex items-center justify-center overflow-hidden">
            <div className="text-2xl">{gender === 'female' ? '👩' : '👨'}</div>
        </div>
    </div>
);

const UserAvatar = () => (
    <div className="w-10 h-10 relative flex-shrink-0">
        <div className="absolute inset-0 bg-white rounded-full shadow-md border border-blue-50 flex items-center justify-center overflow-hidden">
            <div className="text-2xl">👨</div>
        </div>
    </div>
);

export default function CampfireChatStage({
    nativeLanguage,
    language,
    topic,
    level,
    storyContent,
    isPractice,
    flashcards,
    onNextStage,
}: CampfireChatStageProps) {
    const texts = UI_TEXTS_AR;
    const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [textInputValue, setTextInputValue] = useState('');
    const [videoCharacter, setVideoCharacter] = useState<'female' | 'male'>('female');
    
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');
    const nextPlayTimeRef = useRef(0);
    const activeAudioNodesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const isSpeakingRef = useRef(false);

    const [chatMode, setChatMode] = useState<'text' | 'voice'>('text');
    const [isTextTyping, setIsTextTyping] = useState(false);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    useEffect(() => {
        isSpeakingRef.current = status === 'speaking';
    }, [status]);

    useEffect(() => {
        if (chatMode === 'text' && transcript.length === 0 && !isTextTyping) {
            setTranscript([
                { id: 'welcome', speaker: 'bot', text: videoCharacter === 'female' ? "مرحباً! اجلس بجوار النار، كيف كان يومك في القرية؟" : "أهلاً يا صديقي! تفضل بالجلوس، هل كان يوماً متعباً؟", isFinal: true }
            ]);
        }
    }, [chatMode, transcript.length, videoCharacter, isTextTyping]);

    const cleanup = useCallback(() => {
        sessionPromiseRef.current?.then(session => session.close()).catch(console.error);
        sessionPromiseRef.current = null;
        
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;

        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        
        inputAudioContextRef.current?.close().catch(console.error);
        outputAudioContextRef.current?.close().catch(console.error);

        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;
        scriptProcessorRef.current = null;
        mediaStreamSourceRef.current = null;
    }, []);

    const setupSession = useCallback(async () => {
        if (!storyContent && !isPractice) {
            setStatus('error');
            setErrorMessage("لم يتم العثور على محتوى القصة لبدء المحادثة.");
            return;
        }
        
        cleanup();
        setStatus('connecting');
        setErrorMessage(null);
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            if (inputAudioContextRef.current.state === 'suspended') {
                await inputAudioContextRef.current.resume();
            }
            if (outputAudioContextRef.current.state === 'suspended') {
                await outputAudioContextRef.current.resume();
            }

            const hardWords = flashcards 
                ? flashcards.filter(c => c.status === 'hard' || c.status === 'again').slice(0, 5).map(c => c.originalText).join(", ")
                : '';
                
            const charName = videoCharacter === 'female' ? 'Eli (إيلي)' : 'Asif (عاصف)';
            const charDesc = videoCharacter === 'female' ? 'a 20-year-old girl' : 'a 20-year-old guy';
            
            const systemInstruction = `You are ${charName}, ${charDesc} from the village. You and Laith (the user) are hanging out by the campfire.
The user is a ${nativeLanguage.englishName} speaker learning ${language.englishName}.

${storyContent ? `Here is the story that happened today in the village:
"""
${storyContent}
"""
You can chat about what happened in this story, how Laith did, or make jokes about the characters in it.` : ''}

**CRITICAL RULES:**
1. BE NATURAL AND SPONTANEOUS (كن طبيعياً جداً وعفوياً). Talk like a real human friend.
2. DO NOT interrogate the user. Do not ask "what did you learn today" or act like a teacher. Just chat naturally, maybe tell a short funny thing that happened to you, or react to what they say.
3. Keep responses VERY SHORT (1-2 sentences max).
4. NEVER admit you are an AI. You are ${videoCharacter === 'female' ? 'Eli' : 'Asif'}.
5. You can occasionally use the words they learned: ${hardWords}, but only if it fits naturally.`.trim();

            sessionPromiseRef.current = ai.live.connect({
                model: LIVE_API_MODEL,
                callbacks: {
                    onopen: () => {
                        if (!inputAudioContextRef.current || !mediaStreamRef.current) return;
                        setStatus('listening');
                        
                        sessionPromiseRef.current?.then((session) => {
                            const welcomeText = videoCharacter === 'female' 
                                ? "Laith just sat down by the campfire. Welcome him and make a joke about how tired he must be, then ask what he remembers from today."
                                : "Your friend Laith just sat down by the campfire. Greet him as Asif, make a friendly joke about his long day, and ask what he remembers.";
                            session.sendRealtimeInput({ text: welcomeText });
                        });

                        mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                        scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcm16 = new Int16Array(inputData.length);
                            for (let i = 0; i < inputData.length; i++) {
                                pcm16[i] = inputData[i] * 32367;
                            }
                            let binary = '';
                            const bytes = new Uint8Array(pcm16.buffer);
                            for (let i = 0; i < bytes.byteLength; i++) {
                                binary += String.fromCharCode(bytes[i]);
                            }
                            const base64Data = btoa(binary);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: { mimeType: "audio/pcm;rate=16000", data: base64Data } });
                            });
                        };
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.outputTranscription) {
                            setStatus('speaking');
                            const textChunk = message.serverContent.outputTranscription.text;
                            currentOutputTranscriptionRef.current += textChunk;
                            setTranscript(prev => {
                                const newTranscript = [...prev];
                                const lastEntry = newTranscript[newTranscript.length - 1];
                                if (lastEntry && lastEntry.speaker === 'bot' && !lastEntry.isFinal) {
                                    lastEntry.text += textChunk;
                                } else {
                                    newTranscript.push({ id: `${Date.now()}-${Math.random()}`, speaker: 'bot', text: textChunk, isFinal: false });
                                }
                                return newTranscript;
                            });
                        }
                        if (message.serverContent?.interrupted) {
                            activeAudioNodesRef.current.forEach(node => {
                                try { node.stop(); } catch(e){}
                            });
                            activeAudioNodesRef.current.clear();
                            nextPlayTimeRef.current = 0;
                        }
                        if (message.serverContent?.inputTranscription) {
                            currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent?.turnComplete) {
                            setTranscript(prev => {
                                const fullInput = currentInputTranscriptionRef.current.trim();
                                currentInputTranscriptionRef.current = '';

                                const fullOutput = currentOutputTranscriptionRef.current.trim();
                                currentOutputTranscriptionRef.current = '';

                                const newTranscript = [...prev];
                                const botIndex = newTranscript.findIndex(e => e.speaker === 'bot' && !e.isFinal);
                                
                                if (botIndex !== -1) {
                                    newTranscript[botIndex].isFinal = true;
                                    newTranscript[botIndex].text = fullOutput;
                                    
                                    if (fullInput) {
                                        newTranscript.splice(botIndex, 0, { id: `${Date.now()}-user`, speaker: 'user', text: fullInput, isFinal: true });
                                    }
                                } else if (fullInput) {
                                    newTranscript.push({ id: `${Date.now()}-user`, speaker: 'user', text: fullInput, isFinal: true });
                                }
                                setStatus('listening');
                                return newTranscript.filter(entry => entry.text.trim() !== '');
                            });
                        }
                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            try {
                                const audioData = atob(base64Audio);
                                const arrayBuffer = new ArrayBuffer(audioData.length);
                                const view = new Uint8Array(arrayBuffer);
                                for (let i = 0; i < audioData.length; i++) {
                                    view[i] = audioData.charCodeAt(i);
                                }
                                
                                const pcm16 = new Int16Array(arrayBuffer);
                                const audioBuffer = outputAudioContextRef.current.createBuffer(1, pcm16.length, 24000);
                                const channelData = audioBuffer.getChannelData(0);
                                for (let i = 0; i < pcm16.length; i++) {
                                    channelData[i] = pcm16[i] / 32768.0;
                                }
                                
                                const source = outputAudioContextRef.current.createBufferSource();
                                source.buffer = audioBuffer;
                                source.connect(outputAudioContextRef.current.destination);
                                
                                const currentTime = outputAudioContextRef.current.currentTime;
                                if (nextPlayTimeRef.current < currentTime) {
                                    nextPlayTimeRef.current = currentTime + 0.15;
                                }
                                source.start(nextPlayTimeRef.current);
                                nextPlayTimeRef.current += audioBuffer.duration;
                                
                                activeAudioNodesRef.current.add(source);
                                source.onended = () => {
                                    activeAudioNodesRef.current.delete(source);
                                };
                            } catch (err) {
                                console.error('Audio decode error', err);
                            }
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.warn('Session error:', e);
                        setStatus('error');
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: { parts: [{ text: systemInstruction }] },
                    generationConfig: { maxOutputTokens: 150 },
                },
            });

        } catch (err: any) {
            console.error("Failed to start voice session:", err);
            setStatus('error');
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setErrorMessage("يرجى السماح بالوصول إلى الميكروفون من إعدادات المتصفح للبدء.");
            } else {
                setErrorMessage("حدث خطأ أثناء تشغيل الميكروفون. يرجى التحقق من التوصيل والمحاولة مجدداً.");
            }
        }
    }, [storyContent, isPractice, language, nativeLanguage, flashcards, videoCharacter, cleanup]);

    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    const handleSendMessage = async () => {
        if (!textInputValue.trim()) return;
        
        const userInput = textInputValue.trim();
        setTextInputValue('');

        if (chatMode === 'text') {
            setTranscript(prev => [
                ...prev, 
                { id: `${Date.now()}-user-text`, speaker: 'user', text: userInput, isFinal: true }
            ]);
            setIsTextTyping(true);
            
            try {
                const { generateContentWithRetry } = await import('../services/ai');
                
                const contents = transcript.filter(t => t.id !== 'welcome').map(t => ({
                    role: t.speaker === 'user' ? 'user' : 'model',
                    parts: [{ text: t.text }]
                }));
                contents.push({ role: 'user', parts: [{ text: userInput }] });
                
                const charName = videoCharacter === 'female' ? 'Eli' : 'Asif';
                const systemInstruction = `You are ${charName} from the village. You and Laith (the user) are hanging out by the campfire. The user is a ${nativeLanguage.englishName} speaker learning ${language.englishName}. ${storyContent ? `Story context: ${storyContent}` : ''} CRITICAL RULES: 1. BE NATURAL AND SPONTANEOUS. 2. DO NOT interrogate. 3. Keep responses VERY SHORT (1-2 sentences max). 4. NEVER admit you are an AI.`;
                
                const response = await generateContentWithRetry({
                    model: TEXT_MODEL,
                    contents: contents as any,
                    config: { systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] } }
                });
                
                const replyText = response.text || '...';
                setTranscript(prev => [
                    ...prev, 
                    { id: `${Date.now()}-bot-text`, speaker: 'bot', text: replyText, isFinal: true }
                ]);
            } catch (err) {
                console.error(err);
                setErrorMessage("فشل في إرسال الرسالة.");
            } finally {
                setIsTextTyping(false);
            }
            return;
        }

        // Voice mode send message
        if (!sessionPromiseRef.current) return;
        
        // Interrupt current audio
        activeAudioNodesRef.current.forEach(node => {
            try { node.stop(); } catch(e){}
        });
        activeAudioNodesRef.current.clear();
        nextPlayTimeRef.current = 0;

        sessionPromiseRef.current.then(session => {
            session.sendRealtimeInput({ text: userInput });
            setTranscript(prev => [
                ...prev, 
                { id: `${Date.now()}-user-text`, speaker: 'user', text: userInput, isFinal: true }
            ]);
            setStatus('speaking');
        });
    };

    return (
        <div className="flex flex-col h-full relative overflow-hidden bg-slate-900" dir="rtl">
            {/* Campfire Background */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-t from-orange-900/40 to-slate-900 opacity-80" />
                <div className="absolute bottom-10 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] animate-pulse" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-6 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
                <h2 className="text-2xl font-black text-amber-500 flex items-center gap-2">
                    🏕️ جلسة المساء
                </h2>
                
                <div className="flex items-center gap-3">
                    {chatMode === 'text' && (
                        <button 
                            onClick={() => setChatMode('voice')}
                            className="bg-purple-600 hover:bg-purple-500 transition-colors border border-purple-500/50 rounded-full px-4 py-1.5 text-sm font-bold text-white shadow-lg flex items-center gap-1 animate-pulse"
                        >
                            <span>🎙️ تخطي للممارسة الصوتية</span>
                        </button>
                    )}

                    {onNextStage && (
                        <button 
                            onClick={onNextStage}
                            className="bg-green-600 hover:bg-green-500 transition-colors border border-green-500/50 rounded-full px-4 py-1.5 text-sm font-bold text-white shadow-lg flex items-center gap-1"
                        >
                            <span>المرحلة التالية</span>
                            <span>←</span>
                        </button>
                    )}

                    <button 
                        onClick={() => {
                            const nextChar = videoCharacter === 'female' ? 'male' : 'female';
                            setVideoCharacter(nextChar);
                            if (chatMode === 'voice' && status !== 'idle' && status !== 'error') {
                                setTimeout(() => {
                                    setupSession();
                                }, 100);
                            }
                        }}
                        className="flex items-center gap-1 bg-white/10 hover:bg-white/20 transition-colors border border-white/20 rounded-full px-3 py-1.5 text-sm font-bold text-white shadow-lg"
                    >
                        <span>👤</span>
                        <span>{videoCharacter === 'female' ? 'تغيير للرجل' : 'تغيير للمرأة'}</span>
                    </button>
                    
                    {chatMode === 'voice' && (
                        <div className={`px-4 py-2 rounded-full font-bold text-sm ${
                            status === 'listening' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 
                            status === 'speaking' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 
                            status === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                            'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                            {status === 'listening' ? texts.listening : 
                             status === 'speaking' ? texts.speaking : 
                             status === 'error' ? (errorMessage || texts.error) :
                             texts.connecting}
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative z-10 flex flex-col md:flex-row max-w-6xl mx-auto w-full pb-20 md:pb-24">
                
                {chatMode === 'voice' && status === 'idle' && (
                    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md">
                        <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 text-center max-w-sm mx-4 animate-in fade-in zoom-in duration-300">
                            <div className="text-6xl mb-6 animate-bounce">🎙️</div>
                            <h3 className="text-2xl font-black text-amber-400 mb-2">مستعد للتحدث؟</h3>
                            <p className="text-slate-300 mb-8 font-bold">انقر للبدء لكي تسمح للمتصفح باستخدام الميكروفون والصوت صوتاً لصوت مع الذكاء الاصطناعي.</p>
                            <button 
                                onClick={setupSession}
                                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xl py-4 rounded-xl shadow-lg transition-transform active:scale-95 border border-amber-400/50"
                            >
                                بدء المحادثة الصوتية
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Left Side (Desktop) / Top Side (Mobile): Fixed Video Avatar */}
                <div className="w-full md:w-1/2 flex-shrink-0 flex items-center justify-center p-2 md:p-8 pt-0 z-20 h-[35vh] md:h-auto">
                    <div className="relative flex items-center justify-center h-full aspect-[9/16] max-h-[80vh] rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(217,119,6,0.15)] ring-4 ring-amber-500/30 bg-slate-800 transition-all duration-500 hover:shadow-[0_0_60px_rgba(217,119,6,0.3)]">
                        <video src={`/${videoCharacter}_teacher.mp4`} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${status === 'speaking' || isTextTyping ? 'opacity-100 z-10' : 'opacity-0 z-0'}`} loop muted playsInline autoPlay />
                        <video src={`/${videoCharacter}_teacher_idle.mp4`} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${status !== 'speaking' && !isTextTyping ? 'opacity-100 z-10' : 'opacity-0 z-0'}`} loop muted playsInline autoPlay />
                    </div>
                </div>

                {/* Right Side (Desktop) / Bottom Side (Mobile): Scrollable Chat */}
                <div className="w-full md:w-1/2 flex-1 flex flex-col overflow-hidden relative border-t md:border-t-0 md:border-r border-white/5">
                    <div className="flex-1 overflow-y-auto px-4 pb-12 pt-4 space-y-4 md:space-y-6 no-scrollbar">
                        {transcript.map((entry, idx) => (
                            <div key={entry.id} className={`flex gap-3 w-full ${entry.speaker === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                {entry.speaker === 'bot' ? <RobotAvatar gender={videoCharacter} /> : <UserAvatar />}
                                <div className={`px-4 md:px-5 py-3 max-w-[85%] rounded-3xl text-sm md:text-lg font-medium shadow-lg backdrop-blur-md ${
                                    entry.speaker === 'bot' 
                                    ? 'bg-amber-900/40 text-amber-50 rounded-tr-none border border-amber-500/30' 
                                    : 'bg-blue-900/40 text-blue-50 rounded-tl-none border border-blue-500/30'
                                }`}>
                                    <p dir="ltr" className="leading-relaxed whitespace-pre-wrap">{entry.text}</p>
                                    {!entry.isFinal && <span className="inline-block w-2 h-2 bg-amber-400 rounded-full ml-2 animate-ping" />}
                                </div>
                            </div>
                        ))}
                        {isTextTyping && (
                            <div className="flex gap-3 w-full flex-row animate-in fade-in duration-300">
                                <RobotAvatar gender={videoCharacter} />
                                <div className="px-5 py-3 max-w-[85%] rounded-3xl bg-amber-900/40 border border-amber-500/30 rounded-tr-none flex items-center gap-1">
                                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                                </div>
                            </div>
                        )}
                        <div ref={transcriptEndRef} className="h-4" />
                    </div>
                </div>
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 w-full bg-black/40 backdrop-blur-xl border-t border-white/10 p-4 z-20">
                <div className="max-w-2xl mx-auto flex gap-3 items-center">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={textInputValue}
                            onChange={(e) => setTextInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder={chatMode === 'text' ? "اكتب رسالتك هنا..." : texts.placeholder}
                            disabled={(chatMode === 'voice' && (status === 'connecting' || status === 'error' || status === 'idle')) || isTextTyping}
                            className="w-full bg-white/10 border border-white/20 rounded-full px-6 py-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white/20 transition-all disabled:opacity-50"
                        />
                    </div>
                    
                    <button 
                        onClick={handleSendMessage}
                        disabled={!textInputValue.trim() || (chatMode === 'voice' && status === 'connecting') || isTextTyping}
                        className="bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-full w-14 h-14 flex items-center justify-center transition-all shadow-lg shadow-amber-900/50 shrink-0"
                    >
                        <span className="text-xl rotate-180">➤</span>
                    </button>
                </div>
                
                {transcript.length >= 2 && (
                    <div className="mt-4 flex justify-center pb-2">
                        <button 
                            onClick={() => {
                                cleanup();
                                const evt = new CustomEvent('yuki-next-stage');
                                window.dispatchEvent(evt);
                            }} 
                            className="text-sm font-bold text-slate-400 hover:text-white underline transition-colors"
                        >
                            النوم وإنهاء اليوم (التالي)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
