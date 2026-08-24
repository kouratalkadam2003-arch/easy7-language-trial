import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2 } from 'lucide-react';
import { Language, Topic, TranscriptEntry, WordData, Flashcard } from '../types/remix_types';
import { speakTextBrowser } from '../../utils/audio';
import { generateSpeechFromText } from '../../services/ai';
import { GoogleGenAI, Modality, type LiveServerMessage } from '@google/genai';
import { TEXT_MODEL, LIVE_API_MODEL } from '../constants';
import { buildVoiceCoachPrompt, voiceCoachVoice } from '../lib/voiceCoachPrompt';
import { useUserStore } from '@/store/userStore';

const UI_TEXTS_AR = {
    connecting: 'جاري الاتصال بالدليل الذكي...',
    listening: 'الدليل يستمع إليك الآن... تحدث بالميكروفون',
    speaking: 'الدليل يتحدث إليك...',
    error: 'حدث خطأ في الاتصال. جاري إعادة المحاولة...',
    storyError: 'لا يمكن بدء المحادثة بدون موضوع محدد.',
    sessionEnded: 'انتهت الجلسة. يمكنك بدء مكالمة جديدة أو المتابعة.',
    micError: 'يرجى السماح بالوصول للميكروفون لبدء المحادثة الصوتية.',
    network: 'تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت.',
    noKey: 'مفتاح Gemini API غير مضبوط.',
    noApiSupport: 'المتصفح لا يدعم التسجيل الصوتي المباشر.',
    micDenied: 'تم رفض إذن الميكروفون. يرجى تفعيله من إعدادات المتصفح.',
};

import { getKeyForVoiceChat, markKeyExhausted } from '../utils/apiKeyPool';

interface VoiceChatStageProps {
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
    voiceGender: 'male' | 'female';
    flashcards?: Flashcard[];
    onToggleVoiceGender?: () => void;
}

function downsampleBuffer(buffer: Float32Array, inputSampleRate: number, outputSampleRate: number = 16000): Float32Array {
    if (inputSampleRate === outputSampleRate) return buffer;
    const sampleRateRatio = inputSampleRate / outputSampleRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
        const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
        let accum = 0, count = 0;
        for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
            accum += buffer[i];
            count++;
        }
        result[offsetResult] = count > 0 ? accum / count : 0;
        offsetResult++;
        offsetBuffer = nextOffsetBuffer;
    }
    return result;
}

// Synchronous 16-bit PCM (24kHz Mono) decoder for instant audio playback with zero gap
function decodePcm24k(base64: string, ctx: AudioContext): AudioBuffer {
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const int16 = new Int16Array(bytes.buffer);
    const f32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) f32[i] = int16[i] / 32768.0;
    const buf = ctx.createBuffer(1, f32.length, 24000);
    buf.getChannelData(0).set(f32);
    return buf;
}

// Encode Float32 audio to 16-bit Little-Endian PCM Base64
function float32ToPcmBase64(data: Float32Array): string {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) {
        const s = Math.max(-1, Math.min(1, data[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    const bytes = new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

const VoiceChatStage: React.FC<VoiceChatStageProps> = ({
    nativeLanguage,
    language,
    topic,
    level,
    storyContent,
    voiceGender,
}) => {
    const texts = UI_TEXTS_AR;
    const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'error' | 'ended'>('idle');
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [micOn, setMicOn] = useState<boolean>(true);
    const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
    const [userAudioLevel, setUserAudioLevel] = useState<number>(0);

    // Live session opened straight against the Gemini Live API. Previously this
    // was a WebSocket to our own /ws-voice relay, which static hosting can't run.
    const sessionRef = useRef<any>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const micOnRef = useRef<boolean>(true);
    const statusRef = useRef<'idle' | 'connecting' | 'listening' | 'speaking' | 'error' | 'ended'>('idle');

    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef(new Set<AudioBufferSourceNode>());
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const currentEntryIdRef = useRef<string>('');

    useEffect(() => {
        micOnRef.current = micOn;
    }, [micOn]);

    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    const cleanup = useCallback(() => {
        console.log('[VoiceChat] Cleaning up session resources...');
        try { sessionRef.current?.close(); } catch (e) {}
        sessionRef.current = null;

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        try { scriptProcessorRef.current?.disconnect(); } catch (e) {}
        try { mediaStreamSourceRef.current?.disconnect(); } catch (e) {}
        scriptProcessorRef.current = null;
        mediaStreamSourceRef.current = null;

        try { inputAudioContextRef.current?.close(); } catch (e) {}
        inputAudioContextRef.current = null;
        try { outputAudioContextRef.current?.close(); } catch (e) {}
        outputAudioContextRef.current = null;

        for (const src of audioSourcesRef.current.values()) {
            try { src.stop(); } catch (e) {}
        }
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        setUserAudioLevel(0);
    }, []);

    // Smooth seamless audio scheduling
    const playAudioChunk = useCallback((base64: string) => {
        const ctx = outputAudioContextRef.current;
        if (!ctx || ctx.state === 'closed') return;

        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }

        try {
            const audioBuffer = decodePcm24k(base64, ctx);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            audioSourcesRef.current.add(source);

            setStatus('speaking');
            statusRef.current = 'speaking';

            const now = ctx.currentTime;
            // 100ms jitter buffer on speech burst start to eliminate network packet stuttering
            const startAt = (nextStartTimeRef.current < now) ? (now + 0.10) : nextStartTimeRef.current;
            source.start(startAt);
            nextStartTimeRef.current = startAt + audioBuffer.duration;

            source.addEventListener('ended', () => {
                audioSourcesRef.current.delete(source);
                if (audioSourcesRef.current.size === 0) {
                    setStatus('listening');
                    statusRef.current = 'listening';
                }
            });
        } catch (err) {
            console.error('[VoiceChat] Audio decode error:', err);
        }
    }, []);

    const translateSpeechAsync = async (text: string, entryId: string) => {
        if (!text || text.trim().length === 0) return;
        try {
            const apiKey = getApiKey();
            if (!apiKey) return;
            const genAI = new GoogleGenAI({ apiKey });
            const res = await genAI.models.generateContent({
                model: TEXT_MODEL,
                contents: `Translate this spoken sentence into clear, natural Arabic. Output only the Arabic translation:\n"${text}"`
            });
            const arabic = res.text?.trim();
            if (arabic) {
                setTranscript(prev => prev.map(m => m.id === entryId ? { ...m, translation: arabic } : m));
            }
        } catch (e) {
            console.warn('[VoiceChat] Translation error:', e);
        }
    };

    const replayPhrase = async (text: string, entryId: string) => {
        if (playingMsgId) return;
        setPlayingMsgId(entryId);
        const voice = voiceGender === 'male' ? 'Puck' : 'Aoede';
        try {
            if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') {
                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                outputAudioContextRef.current = new AudioCtx({ sampleRate: 24000 });
            }
            if (outputAudioContextRef.current.state === 'suspended') {
                await outputAudioContextRef.current.resume();
            }
            const cleanText = text.replace(/^(ليث|إيلي|أنت):\s*/, '');
            const base64 = await generateSpeechFromText(cleanText, 'en', 1.0, voice);
            playAudioChunk(base64);
        } catch (e) {
            speakTextBrowser(text, { code: 'en', englishName: 'English', nativeName: 'English' }, 1.0, voiceGender);
        } finally {
            setTimeout(() => setPlayingMsgId(null), 1000);
        }
    };

    const setupSession = useCallback(async () => {
        cleanup();
        setStatus('connecting');
        statusRef.current = 'connecting';
        setErrorMsg('');
        setTranscript([]);

        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error('no-getusermedia');
            }

            // 1. Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { 
                    channelCount: 1, 
                    echoCancellation: true, 
                    noiseSuppression: true, 
                    autoGainControl: true 
                }
            });
            mediaStreamRef.current = stream;

            // 2. Setup Audio Contexts
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            
            // Prefer 16kHz for input to eliminate resampling artifacts
            try {
                inputAudioContextRef.current = new AudioCtx({ sampleRate: 16000 });
            } catch {
                inputAudioContextRef.current = new AudioCtx();
            }

            try {
                outputAudioContextRef.current = new AudioCtx({ sampleRate: 24000 });
            } catch {
                outputAudioContextRef.current = new AudioCtx();
            }

            if (inputAudioContextRef.current.state === 'suspended') {
                await inputAudioContextRef.current.resume();
            }
            if (outputAudioContextRef.current.state === 'suspended') {
                await outputAudioContextRef.current.resume();
            }

            const langName = language?.englishName || language?.name || 'English';
            const natLangName = nativeLanguage?.englishName || 'Arabic';
            const topicTitle = topic?.title || 'Lesson Dialogue';

            // 3. Talk to the Gemini Live API directly from the browser.
            // The relay used to translate Live API events into these flat `msg`
            // objects; that translation now happens locally in the callbacks
            // below, so this handler body is unchanged from the relay version.
            const handleEvent = (msg: any) => {
                switch (msg.type) {
                    case 'voice-connected':
                        console.log('[VoiceChat] Connected to AI coach.');
                        setStatus('listening');
                        statusRef.current = 'listening';
                        startMicStreaming();
                        break;
                    case 'interrupted':
                        if (statusRef.current === 'listening') {
                            console.log('[VoiceChat] Speech interrupted by user');
                            for (const src of audioSourcesRef.current.values()) {
                                try { src.stop(); } catch (e) {}
                            }
                            audioSourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }
                        break;
                    case 'audio':
                        if (msg.audioBase64) {
                            playAudioChunk(msg.audioBase64);
                        }
                        break;
                    case 'transcript': {
                        const chunk: string = msg.text || '';
                        if (!chunk) break;
                        setTranscript(prev => {
                            const newTr = [...prev];
                            const last = newTr[newTr.length - 1];
                            if (last && last.speaker === 'bot' && !last.isFinal) {
                                last.text += ' ' + chunk;
                            } else {
                                const newId = `${Date.now()}-${Math.random()}`;
                                currentEntryIdRef.current = newId;
                                newTr.push({ id: newId, speaker: 'bot', text: chunk, isFinal: false });
                            }
                            return newTr;
                        });
                        break;
                    }
                    case 'user-transcript': {
                        const chunk: string = msg.text || '';
                        if (!chunk) break;
                        setTranscript(prev => {
                            const newTr = [...prev];
                            const last = newTr[newTr.length - 1];
                            if (last && last.speaker === 'user' && !last.isFinal) {
                                last.text += ' ' + chunk;
                            } else {
                                newTr.push({ id: `u-${Date.now()}-${Math.random()}`, speaker: 'user', text: chunk, isFinal: false });
                            }
                            return newTr;
                        });
                        break;
                    }
                    case 'turnComplete':
                        setTranscript(prev => {
                            const last = prev[prev.length - 1];
                            if (last && last.speaker === 'bot' && last.text && currentEntryIdRef.current) {
                                translateSpeechAsync(last.text, currentEntryIdRef.current);
                            }
                            return prev.map(t => ({ ...t, isFinal: true }));
                        });
                        if (audioSourcesRef.current.size === 0) {
                            setStatus('listening');
                            statusRef.current = 'listening';
                        }
                        break;
                    case 'error':
                        console.error('[VoiceChat] Relay error:', msg.message);
                        setStatus('error');
                        statusRef.current = 'error';
                        setErrorMsg(msg.message || texts.error);
                        setTranscript(prev => [...prev, { id: `err-${Date.now()}`, speaker: 'bot', text: `⚠ ${msg.message || texts.error}`, isFinal: true }]);
                        break;
                }
            };

            const apiKey = getKeyForVoiceChat();
            if (!apiKey) {
                throw new Error(texts.noKey);
            }

            const liveClient = new GoogleGenAI({ apiKey });

            const effectiveLevel = useUserStore.getState().currentLevel || level || 'A1';
            const systemInstruction = buildVoiceCoachPrompt({
                voiceGender,
                language: langName,
                nativeLanguage: natLangName,
                storyContent: storyContent || topicTitle,
                level: effectiveLevel,
            });

            const session = await liveClient.live.connect({
                model: LIVE_API_MODEL,
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceCoachVoice(voiceGender) } }
                    },
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction
                },
                callbacks: {
                    onmessage: (sm: LiveServerMessage) => {
                        if (sm.serverContent?.interrupted) {
                            handleEvent({ type: 'interrupted' });
                        }

                        for (const part of sm.serverContent?.modelTurn?.parts || []) {
                            if (part.inlineData?.data) {
                                handleEvent({ type: 'audio', audioBase64: part.inlineData.data });
                            }
                        }

                        const textChunk = (sm.serverContent as any)?.outputTranscription?.text
                            || sm.serverContent?.modelTurn?.parts?.find((p: any) => p.text && !p.thought)?.text;
                        // The model sometimes emits its own reasoning preamble;
                        // the relay filtered these out and so do we.
                        if (textChunk && !textChunk.startsWith('**Initiating') && !textChunk.startsWith('**Crafting')) {
                            handleEvent({ type: 'transcript', text: textChunk });
                        }

                        const userTxt = sm.serverContent?.interrupted
                            ? null
                            : (sm.serverContent as any)?.inputAudioTranscription?.text;
                        if (userTxt) {
                            handleEvent({ type: 'user-transcript', text: userTxt });
                        }

                        if (sm.serverContent?.turnComplete) {
                            handleEvent({ type: 'turnComplete' });
                        }
                    },
                    onerror: (err: any) => {
                        console.error('[VoiceChat] Live session error:', err);
                        handleEvent({ type: 'error', message: err?.message || texts.error });
                    },
                    onclose: () => {
                        console.log('[VoiceChat] Live session closed');
                        setStatus(prev => (prev === 'error' ? prev : 'ended'));
                        statusRef.current = 'ended';
                    }
                }
            });

            sessionRef.current = session;

            // The relay signalled readiness with a 'voice-connected' message;
            // reaching this point is the equivalent.
            handleEvent({ type: 'voice-connected' });

            session.sendClientContent({
                turns: [{
                    role: 'user',
                    parts: [{ text: `Please greet the user in ${langName} and introduce yourself.` }]
                }],
                turnComplete: true
            });

        } catch (err: any) {
            console.error('[VoiceChat] Setup failed:', err);
            cleanup();
            if (err?.name === 'NotAllowedError') {
                setErrorMsg(texts.micDenied);
            } else if (/no-getusermedia|no-audiocontext/i.test(err?.message)) {
                setErrorMsg(texts.noApiSupport);
            } else {
                setErrorMsg(err?.message || texts.error);
            }
            setStatus('error');
            statusRef.current = 'error';
        }

        async function startMicStreaming() {
            if (!inputAudioContextRef.current || !mediaStreamRef.current || scriptProcessorRef.current) return;

            if (inputAudioContextRef.current.state === 'suspended') {
                try { await inputAudioContextRef.current.resume(); } catch (e) {}
            }

            try {
                mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);

                scriptProcessorRef.current.onaudioprocess = (evt) => {
                    if (!micOnRef.current) return;

                    // Mute sending during bot speech to eliminate acoustic echo
                    if (statusRef.current === 'speaking' || audioSourcesRef.current.size > 0) {
                        setUserAudioLevel(0);
                        return;
                    }

                    const inputData = evt.inputBuffer.getChannelData(0);

                    // Compute audio volume level for live visual feedback
                    let sum = 0;
                    for (let i = 0; i < inputData.length; i++) {
                        sum += inputData[i] * inputData[i];
                    }
                    const rms = Math.sqrt(sum / inputData.length);
                    setUserAudioLevel(Math.min(1, rms * 5));

                    const actualSampleRate = inputAudioContextRef.current?.sampleRate || 16000;
                    const downsampled = actualSampleRate === 16000 ? inputData : downsampleBuffer(inputData, actualSampleRate, 16000);
                    const pcmBase64 = float32ToPcmBase64(downsampled);

                    if (sessionRef.current && pcmBase64) {
                        try {
                            sessionRef.current.sendRealtimeInput({
                                audio: { data: pcmBase64, mimeType: 'audio/pcm;rate=16000' }
                            });
                        } catch (e) {
                            // ignore streaming buffer flush errors during shutdown
                        }
                    }
                };

                const muteGain = inputAudioContextRef.current.createGain();
                muteGain.gain.value = 0;
                mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                scriptProcessorRef.current.connect(muteGain);
                muteGain.connect(inputAudioContextRef.current.destination);
                console.log('[VoiceChat] Microphone audio streaming started (16kHz PCM with Live Gating)');
            } catch (err) {
                console.error('[VoiceChat] Failed to start microphone streaming:', err);
            }
        }
    }, [storyContent, language, nativeLanguage, topic?.title, cleanup, voiceGender, level, playAudioChunk, texts.micDenied, texts.noApiSupport, texts.noKey, texts.error, texts.network]);

    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    const statusText = (() => {
        if (status === 'error') return errorMsg || texts.error;
        if (status === 'connecting') return texts.connecting;
        if (status === 'listening') return texts.listening;
        if (status === 'speaking') return texts.speaking;
        if (status === 'ended') return texts.sessionEnded;
        return '';
    })();

    return (
        <div className="flex flex-col h-full w-full overflow-hidden relative bg-slate-950 text-white select-none" dir="rtl">
            <div className="flex-grow flex flex-col items-center justify-center relative p-3 sm:p-6">

                {/* Video Avatar */}
                <div
                    className="relative flex items-center justify-center w-full max-w-[240px] xs:max-w-[260px] sm:max-w-[290px] aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl cursor-pointer ring-4 ring-blue-500/30 transition-all duration-300 bg-slate-900"
                    onClick={() => {
                        if (status === 'idle' || status === 'error' || status === 'ended') setupSession();
                    }}
                >
                    <video
                        src={voiceGender === 'male' ? '/male_teacher.mp4' : '/female_teacher.mp4'}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${status === 'speaking' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                        loop muted playsInline autoPlay
                    />
                    <video
                        src={voiceGender === 'male' ? '/male_teacher_idle.mp4' : '/female_teacher_idle.mp4'}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${status !== 'speaking' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                        loop muted playsInline autoPlay
                    />

                    {(status === 'idle' || status === 'ended') && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white p-4 cursor-pointer text-center">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500 rounded-full flex items-center justify-center mb-3 shadow-xl animate-pulse">
                                <Phone className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />
                            </div>
                            <span className="font-black text-lg sm:text-xl mb-1">انقر لبدء المحادثة المباشرة</span>
                            <span className="text-xs text-white/80 font-bold">تحدث بصوتك مباشرة مع ({voiceGender === 'male' ? 'ليث' : 'إيلي'})</span>
                        </div>
                    )}

                    {status === 'connecting' && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white p-4 text-center">
                            <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-3"></div>
                            <span className="font-black text-sm">جاري الاتصال بالمعلم الذكي...</span>
                        </div>
                    )}
                </div>

                {/* Status Indicator & Live Voice Wave */}
                <div className="mt-3 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md text-xs sm:text-sm font-black text-center flex items-center gap-2 shadow-md border border-white/10">
                    {status === 'speaking' && <Volume2 className="w-4 h-4 text-pink-400 animate-pulse" />}
                    {status === 'listening' && (
                        <div className="flex items-center gap-1.5">
                            <Mic className={`w-4 h-4 ${userAudioLevel > 0.1 ? 'text-green-400 scale-110' : 'text-emerald-400'} transition-all`} />
                            {userAudioLevel > 0.05 && (
                                <span className="flex gap-0.5 items-center">
                                    <span className="w-1 h-2 bg-green-400 rounded-full animate-ping" />
                                    <span className="w-1 h-3 bg-emerald-300 rounded-full animate-pulse" />
                                </span>
                            )}
                        </div>
                    )}
                    {status === 'connecting' && <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
                    <span>{statusText}</span>
                </div>

                {/* Live Transcript Box */}
                {transcript.length > 0 && (
                    <div className="w-full max-w-lg mt-3 p-3 sm:p-4 bg-slate-900/90 backdrop-blur-2xl border border-slate-700/80 rounded-3xl max-h-36 sm:max-h-44 overflow-y-auto shadow-2xl">
                        {transcript.slice(-4).map((entry) => (
                            <div key={entry.id} className="py-2 border-b border-slate-800 last:border-0 flex items-start justify-between gap-3">
                                <div className="flex-1">
                                    <div className={`text-sm sm:text-base font-black leading-relaxed tracking-wide ${entry.speaker === 'bot' ? 'text-blue-300' : 'text-emerald-300'}`}>
                                        <span className="font-extrabold ml-1">{entry.speaker === 'bot' ? (voiceGender === 'male' ? 'ليث: ' : 'إيلي: ') : 'أنت: '}</span>
                                        {entry.text}
                                    </div>
                                    {entry.translation && (
                                        <div className="text-xs sm:text-sm font-bold text-amber-300 mt-1 leading-normal">
                                            {entry.translation}
                                        </div>
                                    )}
                                </div>

                                {entry.speaker === 'bot' && (
                                    <button
                                        onClick={() => replayPhrase(entry.text, entry.id)}
                                        disabled={playingMsgId === entry.id}
                                        className={`p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 shadow-md transition-all active:scale-90 flex-shrink-0 ${playingMsgId === entry.id ? 'animate-pulse bg-blue-600 text-white' : ''}`}
                                        title="استماع مرة أخرى (TTS)">
                                        <Volume2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        <div ref={transcriptEndRef} />
                    </div>
                )}

                {/* Controls */}
                <div className="flex gap-4 sm:gap-6 mt-4 p-2.5 sm:p-3 bg-white/10 backdrop-blur-md rounded-full shadow-2xl items-center justify-center z-20 border border-white/10">
                    <button
                        onClick={() => { if (status === 'idle' || status === 'error' || status === 'ended') setupSession(); }}
                        disabled={status === 'connecting' || status === 'listening' || status === 'speaking'}
                        className="w-12 h-12 sm:w-14 sm:h-14 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95"
                        title="بدء الاتصال">
                        <Phone className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-0.5" />
                    </button>

                    <button
                        onClick={() => setMicOn(!micOn)}
                        disabled={status !== 'listening' && status !== 'speaking'}
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${micOn ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'}`}
                        title={micOn ? 'كتم الميكروفون' : 'تشغيل الميكروفون'}>
                        {micOn ? <Mic className="w-6 h-6 sm:w-7 sm:h-7" /> : <MicOff className="w-6 h-6 sm:w-7 sm:h-7" />}
                    </button>

                    <button
                        onClick={() => { cleanup(); setStatus('ended'); statusRef.current = 'ended'; }}
                        disabled={status === 'idle' || status === 'ended' || status === 'error'}
                        className="w-12 h-12 sm:w-14 sm:h-14 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95"
                        title="إنهاء المكالمة">
                        <PhoneOff className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VoiceChatStage;
