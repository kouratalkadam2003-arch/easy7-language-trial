import React, { useState, useEffect, useRef } from 'react';
import { 
    Play, Pause, SkipForward, SkipBack, RotateCcw, 
    Volume2, VolumeX, Sparkles, Smile, MessageSquare, ListMusic, Music, Radio, CheckCircle, Flame, AlertCircle, RefreshCw, Mic, Power, HelpCircle, Download
} from 'lucide-react';
import { RadioContentType, RadioTurn, Language } from '../types';
import { generateSpeechFromText } from '../services/ai';
import { playAudioFromBase64, speakTextBrowser } from '../utils/audio';
import Spinner from './Spinner';

// Live API imports
import { GoogleGenAI, Modality, type LiveServerMessage } from '@google/genai';

function getApiKey(): string {
    return (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
}

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

const RadioStage: React.FC<RadioStageProps> = ({
    content,
    isLoading,
    error,
    onRetry,
    onRegenerate,
    language,
    nativeLanguage,
    topic,
    dayNumber,
    level,
    onBack,
    onNextStage
}) => {
    const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
    const [showTranslation, setShowTranslation] = useState<boolean>(true);
    const [audioStatus, setAudioStatus] = useState<'idle' | 'loading' | 'speaking'>('idle');
    const [completedTurns, setCompletedTurns] = useState<Set<number>>(new Set());
    const [isMuted, setIsMuted] = useState(false);

    // Live API states
    const [isLiveMode, setIsLiveMode] = useState<boolean>(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error' | 'disconnected'>('idle');
    const [liveConversation, setLiveConversation] = useState<{ id: string; speaker: 'user' | 'ai'; text: string; translation?: string }[]>([]);
    const [liveErrorMessage, setLiveErrorMessage] = useState<string | null>(null);
    const [activeLiveSpeaker, setActiveLiveSpeaker] = useState<'sarah' | 'khalid' | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const soundSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const playbackTimeoutRef = useRef<number | null>(null);

    // Live API refs
    const userIntendedLiveRef = useRef<boolean>(false);
    const sarahSessionRef = useRef<any>(null);
    const khalidSessionRef = useRef<any>(null);
    const activeSpeakerRef = useRef<'sarah' | 'khalid' | null>(null);
    const sarahTranscriptRef = useRef<string>('');
    const khalidTranscriptRef = useRef<string>('');
    const lastAudioTimeRef = useRef<number>(0);
    const nudgeIntervalRef = useRef<any>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const liveKeepAliveIntervalRef = useRef<any>(null);
    const liveRetryTimeoutRef = useRef<any>(null);
    const activeLiveSpeakerTimeoutRef = useRef<any>(null);

    const liveAudioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const liveNextAudioTimeRef = useRef<number>(0);

    const liveInputRef = useRef<string>("");
    const liveOutputRef = useRef<string>("");

    const transcriptionEndRef = useRef<HTMLDivElement>(null);

    // Speakers voice mappings for standard mode
    const speakerVoices = {
        Sara: 'Aoede',
        Khalid: 'Puck'
    };

    // Clean up audio and live sessions on unmount
    useEffect(() => {
        return () => {
            stopCurrentAudio();
            disconnectLiveSession(true);
        };
    }, []);

    const stopCurrentAudio = () => {
        if (soundSourceRef.current) {
            try {
                soundSourceRef.current.stop();
            } catch (e) {}
            soundSourceRef.current = null;
        }
        if (playbackTimeoutRef.current) {
            clearTimeout(playbackTimeoutRef.current);
            playbackTimeoutRef.current = null;
        }
        setAudioStatus('idle');
    };

    // When turn or speed changes, or isPlaying changes (Standard mode)
    useEffect(() => {
        if (!isLiveMode) {
            if (isPlaying && content && content.turns[currentTurnIndex]) {
                speakTurn(currentTurnIndex);
            } else {
                stopCurrentAudio();
            }
        }
    }, [currentTurnIndex, isPlaying, playbackSpeed, isLiveMode]);

    // Set up auto-scroll for live conversations
    useEffect(() => {
        if (isLiveMode && transcriptionEndRef.current) {
            transcriptionEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [liveConversation, isLiveMode]);

    const speakTurn = async (index: number) => {
        if (!content) return;
        const turn = content.turns[index];
        if (!turn) return;

        stopCurrentAudio();
        setAudioStatus('loading');

        const voice = speakerVoices[turn.speaker] || 'Aoede';
        const textToSpeak = turn.nativeScript || turn.text;

        try {
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            if (isMuted) {
                setAudioStatus('speaking');
                const estimatedDuration = Math.max(3000, textToSpeak.length * 90 / playbackSpeed);
                playbackTimeoutRef.current = window.setTimeout(() => {
                    handleTurnEnded(index);
                }, estimatedDuration);
                return;
            }

            const base64 = await generateSpeechFromText(textToSpeak, language.code, playbackSpeed, voice);
            
            setAudioStatus('speaking');
            soundSourceRef.current = await playAudioFromBase64(base64, audioContextRef.current, () => {
                handleTurnEnded(index);
            });

        } catch (err) {
            console.error("AI Radio Audio generation failed, falling back to browser speak:", err);
            
            const nativeVoiceGender = turn.speaker === 'Sara' ? 'female' : 'male';
            try {
                speakTextBrowser(
                    textToSpeak,
                    language,
                    playbackSpeed,
                    nativeVoiceGender,
                    () => handleTurnEnded(index)
                );
                setAudioStatus('speaking');
            } catch (fallbackErr) {
                console.error("Browser fallback speech failed:", fallbackErr);
                setAudioStatus('idle');
                setIsPlaying(false);
            }
        }
    };

    const handleTurnEnded = (endedIndex: number) => {
        setCompletedTurns(prev => {
            const nextSet = new Set(prev);
            nextSet.add(endedIndex);
            return nextSet;
        });
        setAudioStatus('idle');

        if (content && endedIndex < content.turns.length - 1) {
            setCurrentTurnIndex(endedIndex + 1);
        } else {
            setIsPlaying(false);
        }
    };

    // --- LIVE API LOGIC - DIRECT GEMINI CONNECTION ---
    const requestWakeLock = async () => {
        if ('wakeLock' in navigator) {
            try {
                await (navigator as any).wakeLock.request('screen');
            } catch (err) {
                console.warn('Wake Lock failed:', err);
            }
        }
    };

    const connectToLiveSession = async () => {
        if (connectionStatus === 'connected' || connectionStatus === 'connecting') return;

        stopCurrentAudio();
        setIsPlaying(false);
        setLiveErrorMessage(null);
        setConnectionStatus('connecting');
        userIntendedLiveRef.current = true;

        await requestWakeLock();

        try {
            const apiKey = getApiKey();
            if (!apiKey) {
                setLiveErrorMessage('مفتاح API غير متوفر. تأكد من إعداد GEMINI_API_KEY.');
                setConnectionStatus('error');
                return;
            }

            const genAI = new GoogleGenAI({ apiKey });

            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContextClass({ sampleRate: 24000 });
            audioContextRef.current = ctx;

            if (ctx.state === 'suspended') {
                await ctx.resume();
            }

            const playAudioChunk = (base64: string) => {
                const audioCtx = audioContextRef.current;
                if (!audioCtx) return;
                const binaryString = atob(base64);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const int16 = new Int16Array(bytes.buffer);
                const float32 = new Float32Array(int16.length);
                for (let i = 0; i < int16.length; i++) {
                    float32[i] = int16[i] / 32768.0;
                }
                const buffer = audioCtx.createBuffer(1, float32.length, 24000);
                buffer.getChannelData(0).set(float32);
                const source = audioCtx.createBufferSource();
                source.buffer = buffer;
                source.connect(audioCtx.destination);

                liveAudioSourcesRef.current.add(source);
                source.addEventListener('ended', () => {
                    liveAudioSourcesRef.current.delete(source);
                    if (liveAudioSourcesRef.current.size === 0) {
                        setAudioStatus('idle');
                    }
                });

                if (liveNextAudioTimeRef.current < audioCtx.currentTime) {
                    liveNextAudioTimeRef.current = audioCtx.currentTime + 0.35;
                }
                source.start(liveNextAudioTimeRef.current);
                liveNextAudioTimeRef.current += buffer.duration;
                setAudioStatus('speaking');
            };

            // Store playAudioChunk in a ref so handleLiveMessage can access it
            const playAudioRef = playAudioChunk;

            const customPromptForSaraAndKhalid = `أنتما سارة وخالد، مقدما بودكاست "راديو القرية 📻".
هدفكما الآن هو استضافة بث مباشر منظم وممتع يراجع يوم "ليث" (المتعلم) مع "إيلي" (معلمته)، كتمهيد لانتقال المستمع لمرحلة التطبيق.
موضوع حلقة اليوم هو: "${topic.title}".

يجب أن يكون الحوار مرتباً، منطقياً، ومتسلسلاً حسب مجريات يوم المتعلم في القرية، وفق الخطة التالية (تحدثا عنها بالترتيب):
1. **المقدمة (الترحيب):** ترحيب حماسي بالمستمعين في نهاية اليوم الحافل.
2. **فترة الصباح (الاستماع والقراءة والحفظ):** كيف بدأ ليث يومه مع إيلي في تعلم مفردات "${topic.title}". تعليق سارة على اجتهاده، وتعليق خالد الساخر على صعوبة بعض الكلمات وكيف نطقها ليث بشكل مضحك.
3. **فترة الظهيرة (العمل والاحتطاب):** خروج ليث لجمع الخشب وبناء السور. خالد يقارن بين التعب الذهني في الحفظ والتعب الجسدي في الاحتطاب بنكتة طريفة.
4. **فترة العصر (الدفاع عن القرية ومحاربة الوحوش):** كيف استخدم ليث ما حفظه من كلمات لصد هجوم الوحوش عن القرية. وصف درامي كوميدي من خالد للمواجهة.
5. **فترة المساء (الاستعداد للبراكتس - التطبيق):** سارة تشجع ليث (المستمع) لأنه اقترب من مرحلة التطبيق العملي للغة وتذكره بأن كل هذا التعب سيثمر.
6. **قصة خالد (اختياري ضمن السياق):** خالد يشارك موقفاً محرجاً حدث معه قديماً يشبه ما حدث مع ليث اليوم.

الشخصيات:
- سارة: منظمة، حيوية، ذكية، سريعة البديهة، ومرحة جداً (بصوت Aoede). تدير الحوار وتربط بين الفقرات.
- خالد: كوميدي ساخر، درامي، يحب التعليق بشكل مضحك ويضحك بهستيرية (بصوت Charon). يضيف البهارات والنكات للحوار.

مستوى المتعلم الذي يستمع إليكما (حسب المعيار الأوروبي CEFR) هو: ${level}.
يجب تكييف مستوى الحوار في اللغة ${language.name} ليطابق هذا المستوى تماماً:
- إذا كان A1/A2: تحدثا بوضوح وبجمّل قصيرة جداً وبسيطة.
- إذا كان B1/B2: استخدما لغة متوسطة وتعبيرات يومية.
- إذا كان C1/C2: تحدثا بطلاقة تامة ومصطلحات معقدة.
تحدثا باللغة ${language.name} بشكل أساسي، وقوما بترجمة النكات أو الكلمات المعقدة إلى العربية (${nativeLanguage.name}) لضمان فهم المستمع للسياق والضحك معكم (استخدما عبارات مثل هههههه).
حافظا على تسلسل منطقي للحوار دون القفز بين المواضيع بعشوائية!`;

            const baseSarahPrompt = `أنتِ سارة، المذيعة الرئيسية لبودكاست "راديو القرية 📻". أنتِ منظمة، حيوية، ذكية، سريعة البديهة، ومرحة جداً. تديرين الحوار وتربطين بين الفقرات.\n\n` + customPromptForSaraAndKhalid;
            const baseKhalidPrompt = `أنت خالد، المضيف الكوميدي لبودكاست "راديو القرية 📻". أنت كوميدي ساخر، درامي، تحب التعليق بشكل مضحك وتضحك بهستيرية. تضيف البهارات والنكات للحوار.\n\n` + customPromptForSaraAndKhalid;

            const promptSarah = baseSarahPrompt + '\nدائماً ردي على ما قاله خالد ولا تتوقفي أبدا.';
            const promptKhalid = baseKhalidPrompt + '\nدائماً رد على ما قالته سارة ولا تتوقف أبدا.';

            // Handle messages from both sessions
            const handleLiveMessage = (speaker: 'sarah' | 'khalid', message: LiveServerMessage) => {
                // Only accept from active speaker
                if (speaker !== activeSpeakerRef.current) return;

                const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (audioData) {
                    playAudioRef(audioData);
                    lastAudioTimeRef.current = Date.now();
                }

                // Get transcript
                let textFound = false;
                const outText = (message.serverContent as any)?.outputTranscription?.text;
                if (outText) {
                    const speakerName = speaker === 'sarah' ? 'سارة' : 'خالد';
                    setLiveConversation(prev => {
                        const newEntries = [...prev];
                        if (newEntries.length > 0 && newEntries[newEntries.length - 1].speaker === 'ai' && newEntries[newEntries.length - 1].translation === speaker) {
                            newEntries[newEntries.length - 1].text += outText;
                        } else {
                            newEntries.push({ id: Date.now().toString() + Math.random(), speaker: 'ai', text: speakerName + ': ' + outText, translation: speaker });
                        }
                        return newEntries;
                    });
                    if (speaker === 'sarah') sarahTranscriptRef.current += outText;
                    else khalidTranscriptRef.current += outText;
                    textFound = true;
                } else if (message.serverContent?.modelTurn?.parts) {
                    for (const part of message.serverContent.modelTurn.parts) {
                        if (part.text) {
                            const speakerName = speaker === 'sarah' ? 'سارة' : 'خالد';
                            setLiveConversation(prev => {
                                const newEntries = [...prev];
                                if (newEntries.length > 0 && newEntries[newEntries.length - 1].speaker === 'ai' && newEntries[newEntries.length - 1].translation === speaker) {
                                    newEntries[newEntries.length - 1].text += part.text;
                                } else {
                                    newEntries.push({ id: Date.now().toString() + Math.random(), speaker: 'ai', text: speakerName + ': ' + part.text, translation: speaker });
                                }
                                return newEntries;
                            });
                            if (speaker === 'sarah') sarahTranscriptRef.current += part.text;
                            else khalidTranscriptRef.current += part.text;
                            textFound = true;
                        }
                    }
                }

                // Turn complete - switch speakers
                if (message.serverContent?.turnComplete) {
                    if (speaker === 'sarah') {
                        if (!sarahTranscriptRef.current.trim()) {
                            sarahSessionRef.current?.sendClientContent({ turns: [{ role: 'user', parts: [{ text: 'حدث خطأ ولم نتمكن من سماعك، أرجو أن تعيدي محاولتك.' }] }], turnComplete: true });
                            lastAudioTimeRef.current = Date.now();
                            return;
                        }
                        activeSpeakerRef.current = 'khalid';
                        lastAudioTimeRef.current = Date.now();
                        const promptToKhalid = 'قالت سارة: "' + sarahTranscriptRef.current.trim() + '". رد عليها الآن!';
                        khalidSessionRef.current?.sendClientContent({ turns: [{ role: 'user', parts: [{ text: promptToKhalid }] }], turnComplete: true });
                        sarahTranscriptRef.current = '';
                    } else {
                        if (!khalidTranscriptRef.current.trim()) {
                            khalidSessionRef.current?.sendClientContent({ turns: [{ role: 'user', parts: [{ text: 'حدث خطأ ولم نتمكن من سماعك، أرجو أن تعيد محاولتك.' }] }], turnComplete: true });
                            lastAudioTimeRef.current = Date.now();
                            return;
                        }
                        activeSpeakerRef.current = 'sarah';
                        lastAudioTimeRef.current = Date.now();
                        const promptToSarah = 'قال خالد: "' + khalidTranscriptRef.current.trim() + '". ردي عليه الآن!';
                        sarahSessionRef.current?.sendClientContent({ turns: [{ role: 'user', parts: [{ text: promptToSarah }] }], turnComplete: true });
                        khalidTranscriptRef.current = '';
                    }
                }
            };

            // Create Sarah session
            const sarahSession = await genAI.live.connect({
                model: 'gemini-2.0-flash-live-preview',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Sulafat' } } },
                    systemInstruction: promptSarah,
                    outputAudioTranscription: {}
                },
                callbacks: {
                    onmessage: (sm) => handleLiveMessage('sarah', sm),
                    onerror: (err: any) => {
                        console.error('[radio] Sarah session error:', err);
                        const errMsg = err?.message || err?.toString?.() || 'خطأ';
                        setLiveErrorMessage('خطأ في سارة: ' + errMsg);
                    },
                    onclose: () => console.log('[radio] Sarah session closed'),
                }
            });
            sarahSessionRef.current = sarahSession;

            // Create Khalid session
            const khalidSession = await genAI.live.connect({
                model: 'gemini-2.0-flash-live-preview',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Algenib' } } },
                    systemInstruction: promptKhalid,
                    outputAudioTranscription: {}
                },
                callbacks: {
                    onmessage: (sm) => handleLiveMessage('khalid', sm),
                    onerror: (err: any) => {
                        console.error('[radio] Khalid session error:', err);
                        const errMsg = err?.message || err?.toString?.() || 'خطأ';
                        setLiveErrorMessage('خطأ في خالد: ' + errMsg);
                    },
                    onclose: () => console.log('[radio] Khalid session closed'),
                }
            });
            khalidSessionRef.current = khalidSession;

            activeSpeakerRef.current = 'sarah';
            setConnectionStatus('connected');

            setLiveConversation(prev => [...prev, { id: Date.now().toString(), speaker: 'user', text: '📡 بدأ النقاش بين سارة وخالد...' }]);

            // Start Sarah with the topic
            const startMsg = 'ابدأ النقاش الان حول موضوع ' + topic.title + ' باللغة ' + language.name;
            sarahSession.sendClientContent({ turns: [{ role: 'user', parts: [{ text: startMsg }] }], turnComplete: true });

            lastAudioTimeRef.current = Date.now();

            // Nudge interval to keep conversation going
            nudgeIntervalRef.current = setInterval(() => {
                if (activeSpeakerRef.current && Date.now() - lastAudioTimeRef.current > 15000) {
                    const nudgeMsg = 'استمر ولا تتوقف من حيث توقفتما';
                    const session = activeSpeakerRef.current === 'sarah' ? sarahSessionRef.current : khalidSessionRef.current;
                    session?.sendClientContent({ turns: [{ role: 'user', parts: [{ text: nudgeMsg }] }], turnComplete: true });
                    lastAudioTimeRef.current = Date.now();
                }
            }, 1000);

            // Optional mic setup (for potential future use, not sending audio)
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
                });
                mediaStreamRef.current = stream;

                const source = ctx.createMediaStreamSource(stream);
                audioSourceRef.current = source;

                const processor = ctx.createScriptProcessor(4096, 1, 1);
                processorRef.current = processor;
                processor.onaudioprocess = () => {
                    // No-op: mic audio not sent in radio mode
                };
                source.connect(processor);
                processor.connect(ctx.destination);
            } catch (micErr) {
                console.warn("Microphone access not granted. Radio mode uses text interruption only.", micErr);
            }

        } catch (error: any) {
            console.error("Radio Live Connection Failed:", error);
            const errMsg = error?.message || error?.toString?.() || 'خطأ غير معروف';
            setLiveErrorMessage("خطأ في الاتصال: " + errMsg);
            setConnectionStatus('error');
        }
    };

    const disconnectLiveSession = (stopUserIntention = false) => {
        if (stopUserIntention) userIntendedLiveRef.current = false;
        if (activeLiveSpeakerTimeoutRef.current) { clearTimeout(activeLiveSpeakerTimeoutRef.current); activeLiveSpeakerTimeoutRef.current = null; }
        if (liveKeepAliveIntervalRef.current) { clearInterval(liveKeepAliveIntervalRef.current); liveKeepAliveIntervalRef.current = null; }
        if (liveRetryTimeoutRef.current) { clearTimeout(liveRetryTimeoutRef.current); liveRetryTimeoutRef.current = null; }
        if (nudgeIntervalRef.current) { clearInterval(nudgeIntervalRef.current); nudgeIntervalRef.current = null; }

        // Close Gemini sessions directly
        if (sarahSessionRef.current) { try { sarahSessionRef.current.close(); } catch(e) {} sarahSessionRef.current = null; }
        if (khalidSessionRef.current) { try { khalidSessionRef.current.close(); } catch(e) {} khalidSessionRef.current = null; }
        activeSpeakerRef.current = null;

        if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach(track => track.stop()); mediaStreamRef.current = null; }
        if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
        if (audioSourceRef.current) { audioSourceRef.current.disconnect(); audioSourceRef.current = null; }

        for (const src of liveAudioSourcesRef.current.values()) { try { src.stop(); } catch(e) {} }
        liveAudioSourcesRef.current.clear();
        liveNextAudioTimeRef.current = 0;

        setConnectionStatus('disconnected');
        setActiveLiveSpeaker(null);
        setAudioStatus('idle');
    };

    const handlePlayPause = () => {
        if (audioStatus === 'speaking' || audioStatus === 'loading') {
            setIsPlaying(false);
            stopCurrentAudio();
        } else {
            setIsPlaying(true);
        }
    };

    const handleNextTurn = () => {
        if (content && currentTurnIndex < content.turns.length - 1) {
            setCurrentTurnIndex(prev => prev + 1);
        }
    };

    const handlePrevTurn = () => {
        if (currentTurnIndex > 0) {
            setCurrentTurnIndex(prev => prev - 1);
        }
    };

    const handleReset = () => {
        stopCurrentAudio();
        setCurrentTurnIndex(0);
        setCompletedTurns(new Set());
        setIsPlaying(false);
    };

    const handleExportConversation = () => {
        let textContent = "";
        if (isLiveMode) {
            textContent = `سجل البث المباشر - راديو العباقرة Easy7\n• الموضوع: ${topic.title}\n• التاريخ: ${new Date().toLocaleString('ar-EG')}\n====================\n\n`;
            if (liveConversation.length === 0) {
                textContent += "(لا توجد محادثات بث مباشر مسجلة في هذه الجلسة بعد)\n";
            } else {
                liveConversation.forEach(item => {
                    const speakerLabel = item.speaker === 'user' ? 'المستمع (مداخلة)' : (item.translation === 'sarah' ? 'سارة' : 'خالد');
                    textContent += `[${speakerLabel}]: ${item.text}\n\n`;
                });
            }
        } else if (content) {
            textContent = `سجل حوار الراديو تلقائي - راديو العباقرة Easy7\n• الموضوع: ${topic.title}\n• المستوى: ${level}\n• اللغة: ${language.name}\n====================\n\n`;
            content.turns.forEach((turn, idx) => {
                textContent += `[${idx + 1}] {${turn.speaker === 'Sara' ? 'سارة' : 'خالد'}}: ${turn.text}\n`;
                if (turn.nativeScript) {
                    textContent += `   المعنى/النطق: ${turn.nativeScript}\n`;
                }
                textContent += `   الترجمة بالعربية: ${turn.translation}\n\n`;
            });
        }

        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `easy7-radio-transcript-${topic.id}-${isLiveMode ? 'live' : 'static'}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleWrapUp = () => {
        const wrapupMsg = 'المستمع يرغب في إنهاء البرنامج الآن. تفضلا بتقديم خلاصة سريعة جداً وممتعة، وختام للبرنامج، وتوديع المستمعين معاً بأسلوبكما المميز والمضحك (في جملة قصيرة واحدة لكل منكما)!';
        setLiveConversation(prev => [...prev, { id: Date.now().toString(), speaker: 'user', text: '📡 تم طلب إنهاء الحوار بأدب...' }]);

        const activeSession = activeSpeakerRef.current === 'sarah' ? sarahSessionRef.current : khalidSessionRef.current;
        if (activeSession) {
            activeSession.sendClientContent({ turns: [{ role: 'user', parts: [{ text: wrapupMsg }] }], turnComplete: true });
        } else if (sarahSessionRef.current) {
            sarahSessionRef.current.sendClientContent({ turns: [{ role: 'user', parts: [{ text: wrapupMsg }] }], turnComplete: true });
        }
    };

    // Loading State
    if (isLoading) {
        return (
            <div id="radio_stage_loading" className="flex flex-col items-center justify-center p-12 min-h-[500px] bg-slate-950 text-white rounded-2xl border border-slate-900 shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-pink-500 to-indigo-500 animate-pulse" />
                <div 
                    className="flex flex-col items-center max-w-md text-center animate-fade-in"
                >
                    <div className="relative mb-8">
                        <div className="absolute -inset-4 rounded-full bg-pink-500/20 blur-xl animate-pulse" />
                        <div className="w-20 h-20 rounded-full border-4 border-dashed border-pink-500 border-t-transparent animate-spin flex items-center justify-center">
                            <Radio className="w-10 h-10 text-pink-400" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold font-sans tracking-tight mb-3">راديو العباقرة الـ AI قيد التحضير... 📻</h3>
                    <p className="text-sm text-slate-400 leading-relaxed font-sans mb-6">
                        سارة وخالد يقومان بضبط الميكروفونات ومراجعة الدرس! سيتحدثان بضحك هستيري ومواقف مضحكة لتحسين مهارة السمع لديك.
                    </p>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-pink-500 h-1.5 rounded-full animate-marquee" style={{ width: '40%' }} />
                    </div>
                </div>
            </div>
        );
    }

    // Error State
    if (error || !content) {
        return (
            <div id="radio_stage_error" className="flex flex-col items-center justify-center p-12 min-h-[500px] bg-slate-950 text-white rounded-2xl border border-red-900 shadow-2xl">
                <AlertCircle className="w-20 h-20 text-red-500 mb-6 animate-pulse" />
                <h3 className="text-xl font-bold mb-3 font-sans">حدث خطأ أثناء الاتصال بالراديو!</h3>
                <p className="text-sm text-slate-400 mb-8 max-w-sm text-center leading-relaxed font-sans">
                    لم نتمكن من ضبط التردد لتوليد نقاش الراديو بين سارة وخالد. يرجى إعادة المحاولة من جديد.
                </p>
                <div className="flex gap-4">
                    <button 
                        onClick={onRetry}
                        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 transition-all text-white font-semibold rounded-lg text-sm flex items-center gap-2 shadow-lg"
                    >
                        <RefreshCw className="w-4 h-4" />
                        إعادة المحاولة
                    </button>
                    <button 
                        onClick={onBack}
                        className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-sm"
                    >
                        رجوع للدرس
                    </button>
                </div>
            </div>
        );
    }

    const turns = content.turns;
    const currentTurn = turns[currentTurnIndex];
    const isSaraActive = isLiveMode ? (activeLiveSpeaker === 'sarah') : (audioStatus === 'speaking' && currentTurn?.speaker === 'Sara');
    const isKhalidActive = isLiveMode ? (activeLiveSpeaker === 'khalid') : (audioStatus === 'speaking' && currentTurn?.speaker === 'Khalid');

    return (
        <div id="radio_stage_container" className="flex flex-col h-[calc(100vh-2rem)] md:min-h-screen bg-slate-950 text-slate-100 p-3 md:p-8 rounded-2xl md:rounded-3xl border border-slate-900 shadow-2xl relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-900/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Toolbar Navigation - compact on mobile */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 pb-3 md:pb-6 border-b border-slate-900 z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-pink-600/10 rounded-xl border border-pink-500/20 shadow-inner">
                        <Radio className="w-6 h-6 text-pink-500 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-2 py-0.5 bg-pink-500/20 text-pink-400 border border-pink-500/30 rounded-full">المرحلة الختامية</span>
                            <span className="text-xs font-bold font-mono text-slate-500">Day {dayNumber}</span>
                        </div>
                        <h1 className="text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-300 tracking-tight font-sans">
                            بودكاست راديو AI: سارة وخالد 🎧
                        </h1>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 justify-end">
                    {/* Live mode toggle - Play/Live animated button */}
                    <button 
                        onClick={() => {
                            if (isLiveMode) {
                                disconnectLiveSession(true);
                                setIsLiveMode(false);
                            } else {
                                setIsLiveMode(true);
                                setTimeout(() => connectToLiveSession(), 100);
                            }
                        }}
                        className={`relative px-5 py-2.5 rounded-xl text-xs font-bold border transition-all duration-500 flex items-center gap-2.5 overflow-hidden ${isLiveMode ? 'bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]' : 'bg-purple-600/20 text-purple-400 border-purple-500/30 hover:bg-purple-600/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]'}`}
                    >
                        {/* Animated icon swap */}
                        <span className={`relative flex items-center justify-center w-5 h-5 transition-all duration-500 ${isLiveMode ? 'rotate-0 scale-100' : 'rotate-0 scale-100'}`}>
                            {!isLiveMode && <Play className="w-4 h-4 fill-current transition-all duration-300" />}
                            {isLiveMode && <div className="flex items-center gap-1">
                                <span className="absolute w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="absolute w-2 h-2 rounded-full bg-red-400 animate-ping opacity-40" />
                            </div>}
                        </span>
                        {/* Animated text swap */}
                        <span className={`transition-all duration-500 ${isLiveMode ? 'translate-x-0 opacity-100' : 'translate-x-0 opacity-100'}`}>
                            {isLiveMode ? '🔴 Live' : '▶ Play'}
                        </span>
                        {/* Animated background glow on live */}
                        {isLiveMode && <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10 animate-pulse" />}
                    </button>

                    {!isLiveMode && (
                        <button 
                            onClick={onRegenerate} 
                            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl transition duration-200 flex items-center gap-2"
                            title="إعادة توليد الحوار"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            توليد حوار جديد
                        </button>
                    )}
                    
                    <button 
                        onClick={handleExportConversation} 
                        className="px-4 py-2 text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-550/30 rounded-xl transition duration-200 flex items-center gap-1.5"
                        title="تنزيل سجل الحوار كاملاً كملف نصي"
                    >
                        <Download className="w-3.5 h-3.5" />
                        تنزيل السجل 💾
                    </button>

                    <button 
                        onClick={onBack}
                        className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl transition duration-200"
                    >
                        خروج
                    </button>
                </div>
            </header>

            {/* Error notifications for Live API */}
            {isLiveMode && liveErrorMessage && (
                <div className="mt-4 bg-red-950/40 border border-red-900 text-red-400 px-4 py-3 rounded-xl text-center text-sm font-bold flex items-center justify-center gap-2 z-10 w-full">
                    <span>⚠️</span> {liveErrorMessage}
                </div>
            )}

            {/* Main Interactive Studio Arena */}
            <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 my-4 lg:my-8 z-10 items-stretch">
                {/* Left Panel: Hosts Panel - Horizontal on mobile, vertical on desktop */
                <div className="lg:col-span-4 flex flex-row lg:flex-col justify-between gap-3 lg:gap-6">
                    {/* Sara Host Card - compact on mobile */}
                    <div 
                        style={{
                            transform: isSaraActive || (isLiveMode && audioStatus === 'speaking') ? 'scale(1.02)' : 'scale(1)',
                            borderColor: isSaraActive || (isLiveMode && audioStatus === 'speaking') ? '#db2777' : '#1e293b'
                        }}
                        className={`flex-1 lg:flex-none p-3 sm:p-5 rounded-2xl border bg-slate-900/50 backdrop-blur-sm shadow-xl flex flex-row lg:flex-col items-center lg:items-stretch justify-between lg:justify-between gap-3 transition-all duration-300 relative overflow-hidden ${isSaraActive || (isLiveMode && audioStatus === 'speaking') ? 'shadow-pink-500/10 shadow-2xl' : ''}`}
                    >
                        {(isSaraActive || (isLiveMode && audioStatus === 'speaking')) && <div className="absolute top-0 left-0 w-full h-1 bg-pink-600 animate-pulse" />}
                        <div className="flex flex-row lg:flex-col items-center gap-3 w-full">
                            <div className="relative flex-shrink-0">
                                <div className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl bg-slate-950 shadow-lg border border-pink-400/20 transform transition duration-300 ${isSaraActive ? 'scale-105 shadow-pink-500/20' : ''} overflow-hidden`}>
                                    <video 
                                        src={isSaraActive ? "/female_teacher.mp4" : "/female_teacher_idle.mp4"}
                                        autoPlay 
                                        loop 
                                        muted 
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {(isSaraActive || (isLiveMode && audioStatus === 'speaking')) && (
                                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-4 w-4 bg-pink-500 border-2 border-slate-900"></span>
                                    </span>
                                )}
                            </div>
                            <div className="text-center lg:text-right flex-1 min-w-0">
                                <h3 className="font-bold text-base lg:text-xl text-slate-100 font-sans truncate">سارة ✨</h3>
                                <p className="text-[10px] lg:text-xs font-mono text-pink-400 uppercase tracking-wider font-semibold mt-0.5">المضيفة الرئيسية</p>
                            </div>
                            <span className="text-[10px] bg-pink-500/10 border border-pink-500/20 px-2 py-1 rounded-full text-pink-300 font-sans hidden lg:block">نشيطة ومرحة</span>
                        </div>

                        {/* Sound Equalizer - hidden on mobile */}
                        <div className="hidden lg:flex mt-4 items-center justify-between bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                            <span className="text-xs text-slate-400 font-sans">مستوى الصوت / الميكروفون</span>
                            <div className="flex gap-0.5 h-6 items-end">
                                {[...Array(7)].map((_, i) => (
                                    <div 
                                        key={i}
                                        className={`w-1 bg-gradient-to-t ${(isSaraActive || (isLiveMode && audioStatus === 'speaking')) ? 'from-pink-600 to-pink-400' : 'from-slate-700 to-slate-600'} rounded-full ${(isSaraActive || (isLiveMode && audioStatus === 'speaking')) ? 'animate-[eq-bounce_0.6s_ease-in-out_infinite]' : ''}`}
                                        style={{ animationDelay: `${i * 0.1}s`, height: (isSaraActive || (isLiveMode && audioStatus === 'speaking')) ? '20px' : '4px' }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Radio Equalizer Center - compact on mobile */}
                    <div className="hidden lg:flex p-4 bg-slate-950/60 rounded-xl border border-slate-900 shadow-inner flex-col justify-center gap-1">
                        <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
                            <span>AUDIO CHANNEL L / R</span>
                            <span>{isLiveMode ? 'LIVE FEED ACTIVE' : 'STEADY STREAM'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 justify-center h-8">
                            {[...Array(24)].map((_, i) => (
                                <div 
                                    key={i}
                                    className={`w-1 md:w-1.5 h-full rounded-xs transition-opacity duration-300 ${i % 2 === 0 ? 'bg-indigo-500/40' : 'bg-pink-500/40'} ${(audioStatus === 'speaking' || connectionStatus === 'connected') ? 'animate-[eq-bounce_1.2s_ease-in-out_infinite]' : 'opacity-20'}`}
                                    style={{ animationDelay: `${(i % 5) * 0.15}s` }}
                                />
                             ))}
                        </div>
                    </div>

                    {/* Khalid Host Card - compact on mobile */}
                    <div 
                        style={{
                            transform: isKhalidActive || (isLiveMode && audioStatus === 'speaking') ? 'scale(1.02)' : 'scale(1)',
                            borderColor: isKhalidActive || (isLiveMode && audioStatus === 'speaking') ? '#3b82f6' : '#1e293b'
                        }}
                        className={`flex-1 lg:flex-none p-3 sm:p-5 rounded-2xl border bg-slate-900/50 backdrop-blur-sm shadow-xl flex flex-row lg:flex-col items-center lg:items-stretch justify-between lg:justify-between gap-3 transition-all duration-300 relative overflow-hidden ${isKhalidActive || (isLiveMode && audioStatus === 'speaking') ? 'shadow-indigo-500/10 shadow-2xl' : ''}`}
                    >
                        {(isKhalidActive || (isLiveMode && audioStatus === 'speaking')) && <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600 animate-pulse" />}
                        <div className="flex flex-row lg:flex-col items-center gap-3 w-full">
                            <div className="relative flex-shrink-0">
                                <div className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl bg-slate-950 shadow-lg border border-indigo-400/20 transform transition duration-300 ${isKhalidActive ? 'scale-105 shadow-indigo-500/20' : ''} overflow-hidden`}>
                                    <video 
                                        src={isKhalidActive ? "/male_teacher.mp4" : "/male_teacher_idle.mp4"}
                                        autoPlay 
                                        loop 
                                        muted 
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {(isKhalidActive || (isLiveMode && audioStatus === 'speaking')) && (
                                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-slate-900"></span>
                                    </span>
                                )}
                            </div>
                            <div className="text-center lg:text-right flex-1 min-w-0">
                                <h3 className="font-bold text-base lg:text-xl text-slate-100 font-sans truncate">خالد 😂</h3>
                                <p className="text-[10px] lg:text-xs font-mono text-indigo-400 uppercase tracking-wider font-semibold mt-0.5">المضيف الكوميدي</p>
                            </div>
                            <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-full text-indigo-300 font-sans hidden lg:block">مضحك وساخر</span>
                        </div>

                        {/* Sound Equalizer - hidden on mobile */}
                        <div className="hidden lg:flex mt-6 items-center justify-between bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                            <span className="text-xs text-slate-400 font-sans">مستوى الصوت / الميكروفون</span>
                            <div className="flex gap-0.5 h-6 items-end">
                                {[...Array(7)].map((_, i) => (
                                    <div 
                                        key={i}
                                        className={`w-1 bg-gradient-to-t ${(isKhalidActive || (isLiveMode && audioStatus === 'speaking')) ? 'from-indigo-600 to-indigo-400' : 'from-slate-700 to-slate-600'} rounded-full ${(isKhalidActive || (isLiveMode && audioStatus === 'speaking')) ? 'animate-[eq-bounce_0.6s_ease-in-out_infinite]' : ''}`}
                                        style={{ animationDelay: `${i * 0.1}s`, height: (isKhalidActive || (isLiveMode && audioStatus === 'speaking')) ? '20px' : '4px' }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Active Subtitles Display OR Live Channel Stream (8 Columns) */}
                <div className="lg:col-span-8 flex flex-col justify-between gap-4 lg:gap-6">
                    
                    {/* STANDARD MODE PANEL */}
                    {!isLiveMode && (
                        <div className="flex-1 p-4 md:p-8 rounded-3xl bg-slate-900/40 border border-slate-900 backdrop-blur-md shadow-2xl flex flex-col justify-between items-center relative min-h-[200px] md:min-h-[320px]">
                            <div className="absolute top-4 right-4 text-xs font-mono text-slate-600 uppercase tracking-wider hidden md:block">OUTPUT STATION FEED</div>

                            {/* Current Turn display */}
                            <div 
                                key={currentTurnIndex}
                                className="w-full flex flex-col items-center justify-center text-center my-auto px-2 animate-fade-in-up"
                            >
                                    <div className="flex items-center gap-2 mb-3 md:mb-4">
                                        <span className={`text-[10px] md:text-xs px-2.5 md:px-3 py-1 font-bold rounded-full ${
                                            currentTurn?.speaker === 'Sara' 
                                                ? 'bg-pink-500/15 text-pink-300 border border-pink-500/30' 
                                                : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                                        }`}>
                                            {currentTurn?.speaker === 'Sara' ? 'سارة تتكلم' : 'خالد يتكلم'}
                                        </span>

                                        {currentTurn?.laughterLevel !== 'none' && (
                                            <span className="text-[10px] md:text-xs px-2 md:px-2.5 py-1 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-full flex items-center gap-1 font-sans animate-bounce">
                                                <Smile className="w-3 h-3" />
                                                {currentTurn?.laughterLevel === 'hysterical' ? 'ضحك هستيري! 😂' : 'ضحك/قهقهة'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Main target language sentence script */}
                                    <div className="text-lg md:text-2xl lg:text-3xl font-extrabold tracking-tight text-white font-sans max-w-2xl leading-relaxed select-text">
                                        {currentTurn?.text}
                                    </div>

                                    {/* Active native script helper for ja/zh if available */}
                                    {currentTurn?.nativeScript && currentTurn?.nativeScript !== currentTurn?.text && (
                                        <div className="text-sm md:text-md font-medium text-slate-400 font-mono mt-2 md:mt-3 select-text">
                                            [{currentTurn?.nativeScript}]
                                        </div>
                                    )}

                                    {/* Arabic translation subtitles */}
                                    {showTranslation && (
                                        <div className="text-sm md:text-base lg:text-lg text-emerald-400 font-medium font-sans mt-4 md:mt-7 max-w-2xl leading-relaxed border-t border-slate-900 pt-3 md:pt-5 text-right w-full flex justify-center gap-2 select-text">
                                            <MessageSquare className="w-4 h-4 md:w-5 md:h-5 opacity-60 flex-shrink-0 mt-1" />
                                            <span>{currentTurn?.translation}</span>
                                        </div>
                                    )}
                            </div>

                            {/* Pagination circles indicators */}
                            <div className="flex gap-2 justify-center mt-4 md:mt-6">
                                {turns.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentTurnIndex(idx)}
                                        className={`w-3.5 h-1.5 transition-all duration-300 rounded-full ${
                                            idx === currentTurnIndex 
                                                ? 'w-7 bg-pink-500' 
                                                : completedTurns.has(idx) 
                                                    ? 'bg-indigo-500' 
                                                    : 'bg-slate-800'
                                        }`}
                                        title={`الانتقال إلى المقطع ${idx + 1}`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* LIVE MODE PANEL */}
                    {isLiveMode && (
                        <div className="flex-1 p-6 md:p-8 rounded-3xl bg-slate-900/40 border border-slate-900 backdrop-blur-md shadow-2xl flex flex-col justify-between min-h-[320px]">
                            
                            {/* Live Transmission Indicator Orb */}
                            <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`}></div>
                                    <span className="text-xs font-mono font-bold text-slate-400 tracking-wider">
                                        {connectionStatus === 'connected' ? 'LIVE BROADCAST ACTV' : 'LIVE STUDIO STANDBY'}
                                    </span>
                                </div>
                                <div className="text-[10px] bg-red-600/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold">
                                    Direct Connection (Live API)
                                </div>
                            </div>

                            {/* Live Conversation Stream Box */}
                            <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[200px] md:max-h-[240px] custom-scrollbar pb-2">
                                {liveConversation.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-10 text-slate-400">
                                        <Mic className="w-12 h-12 text-purple-400 mb-3 animate-pulse" />
                                        <p className="font-bold text-sm">
                                            {connectionStatus === 'connected' ? 'البث نشط! تحدث عبر المايك مباشرة مع سارة وخالد...' : 'جاري الاتصال بقناة البث المباشرة...'}
                                        </p>
                                        <p className="text-[10.5px] text-slate-500 mt-1 max-w-xs">
                                            سارة وخالد سيسمعان صوتك، ويتفاعلان معك، ويصححان نطقك مباشرة برعاية مبرمجي البث!
                                        </p>
                                    </div>
                                )}

                                {liveConversation.map((item, index) => (
                                    <div 
                                        key={item.id || index} 
                                        className={`flex flex-col ${item.speaker === 'user' ? 'items-start' : 'items-end'} animate-slideUp`}
                                    >
                                        <div className={`text-[10px] font-mono text-slate-500 mb-1 px-1`}>
                                            {item.speaker === 'user' ? 'صوتك المكتشف' : 'سارة وخالد'}
                                        </div>
                                        <div className={`p-3 max-w-sm rounded-2xl ${
                                            item.speaker === 'user' 
                                                ? 'bg-slate-950/80 text-emerald-400 border border-emerald-500/20 rounded-tl-none font-sans font-semibold' 
                                                : 'bg-purple-950/60 text-pink-400 border border-purple-500/20 rounded-tr-none font-sans font-bold'
                                        }`}>
                                            {item.text}
                                        </div>
                                    </div>
                                ))}
                                <div ref={transcriptionEndRef} />
                            </div>

                            {/* Dynamic Live Status Interruption Input - at bottom on mobile */}
                            {connectionStatus === 'connected' && (
                                <div className="mt-2 md:mt-4 p-2 bg-slate-950/40 rounded-xl border border-slate-900 flex gap-2 lg:order-last">
                                    <input 
                                        type="text" 
                                        placeholder="اكتب تعليقك..." 
                                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                                        id="live_interruption_input"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const target = e.currentTarget;
                                                const text = target.value.trim();
                                                if (text) {
                                                    const interruptSession = activeSpeakerRef.current === 'sarah' ? sarahSessionRef.current : khalidSessionRef.current;
                                                    if (interruptSession) {
                                                        interruptSession.sendClientContent({ turns: [{ role: 'user', parts: [{ text: 'مداخلة من المستمع: ' + text }] }], turnComplete: true });
                                                        setLiveConversation(prev => [
                                                            ...prev,
                                                            { id: Date.now().toString(), speaker: 'user', text: `🎤 مداخلتك: "${text}"` }
                                                        ]);
                                                    }
                                                    target.value = "";
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            const el = document.getElementById('live_interruption_input') as HTMLInputElement;
                                            const text = el?.value.trim();
                                            if (text) {
                                                const interruptSession = activeSpeakerRef.current === 'sarah' ? sarahSessionRef.current : khalidSessionRef.current;
                                                if (interruptSession) {
                                                    interruptSession.sendClientContent({ turns: [{ role: 'user', parts: [{ text: 'مداخلة من المستمع: ' + text }] }], turnComplete: true });
                                                    setLiveConversation(prev => [
                                                        ...prev,
                                                        { id: Date.now().toString(), speaker: 'user', text: `🎤 مداخلتك: "${text}"` }
                                                    ]);
                                                }
                                                if (el) el.value = "";
                                            }
                                        }}
                                        className="px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg text-xs font-bold font-sans"
                                    >
                                        إرسال
                                    </button>
                                </div>
                            )}

                            {/* Dynamic Live Status Ring Indicator */}
                            <div className="mt-4 pt-4 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/20 p-3 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-full ${
                                        connectionStatus === 'connected' ? 'bg-red-500/10 text-red-500' : 'bg-slate-800 text-slate-400 animate-pulse'
                                    }`}>
                                        <Mic className="w-5 h-5" />
                                    </div>
                                    <div className="text-right">
                                        {connectionStatus === 'connected' ? (
                                            <>
                                                <p className="text-xs font-bold text-red-500">ميكروفونك مفتوح الآن!</p>
                                                <p className="text-[10px] text-slate-400">تحدث بلغة الدرس وسيتفاعل المذيعان فوراً.</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-xs font-bold text-slate-400">البث قيد الربط...</p>
                                                <p className="text-[10px] text-slate-500">يرجى الانتظار لتحديث تردد الراديو.</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {connectionStatus === 'connected' && (
                                        <button
                                            onClick={handleWrapUp}
                                            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                                            title="الطلب من سارة وخالد تلخيص النقاش وتوديع المستمعين"
                                        >
                                            <Sparkles className="w-4 h-4 animate-pulse" />
                                            خاتم الحوار 🏁
                                        </button>
                                    )}

                                    <button
                                        onClick={() => {
                                            if (connectionStatus === 'connected') {
                                                disconnectLiveSession(true);
                                            } else {
                                                connectToLiveSession();
                                            }
                                        }}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                            connectionStatus === 'connected' 
                                                ? 'bg-red-600 hover:bg-red-700 text-white' 
                                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                                        }`}
                                    >
                                        <Power className="w-4 h-4" />
                                        {connectionStatus === 'connected' ? 'قطع البث' : 'إعادة الاتصال'}
                                    </button>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* Integrated Control Panel HUD - compact on mobile */}
                    <div className="p-2 md:p-4 rounded-2xl bg-slate-900 border border-slate-900 shadow-xl flex flex-row md:flex-row items-center justify-between gap-2 md:gap-4 flex-shrink-0">
                        {/* Audio Controls */}
                        <div className="flex items-center gap-1.5 md:gap-2.5">
                            <button
                                onClick={handlePrevTurn}
                                disabled={isLiveMode || currentTurnIndex === 0}
                                className="p-2 md:p-3 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg md:rounded-xl active:scale-95 disabled:opacity-40 transition"
                                title="المقطع السابق"
                            >
                                <SkipBack className="w-4 h-4 md:w-5 md:h-5" />
                            </button>

                            <button
                                onClick={handlePlayPause}
                                disabled={isLiveMode}
                                className={`p-3 md:p-4 rounded-full text-white active:scale-95 transition-all shadow-lg flex items-center justify-center ${
                                    isLiveMode ? 'bg-slate-800 opacity-30 cursor-not-allowed' :
                                    isPlaying 
                                        ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' 
                                        : 'bg-pink-600 hover:bg-pink-700 shadow-pink-600/20'
                                }`}
                                title={isPlaying ? "إيقاف مؤقت" : "تشغيل تلقائي"}
                            >
                                {audioStatus === 'loading' ? (
                                    <Spinner size="w-5 h-5 md:w-6 md:h-6" />
                                ) : isPlaying ? (
                                    <Pause className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                                ) : (
                                    <Play className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                                )}
                            </button>

                            <button
                                onClick={handleNextTurn}
                                disabled={isLiveMode || currentTurnIndex === turns.length - 1}
                                className="p-2 md:p-3 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg md:rounded-xl active:scale-95 disabled:opacity-40 transition"
                                title="المقطع التالي"
                            >
                                <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
                            </button>

                            <button
                                onClick={handleReset}
                                disabled={isLiveMode}
                                className="p-2 md:p-3 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg md:rounded-xl active:scale-95 disabled:opacity-40 transition hidden sm:block"
                                title="إعادة من البداية"
                            >
                                <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                        </div>

                        {/* Speed - hidden on very small screens */}
                        <div className="hidden md:flex items-center gap-3 bg-slate-950/50 p-1.5 px-3 rounded-xl border border-slate-950">
                            <span className="text-xs text-slate-400 font-sans">سرعة البودكاست:</span>
                            <div className="flex gap-1.5">
                                {[0.8, 1.0, 1.25].map(v => (
                                    <button
                                        key={v}
                                        disabled={isLiveMode}
                                        onClick={() => setPlaybackSpeed(v)}
                                        className={`px-3 py-1 font-mono text-xs font-semibold rounded-lg transition-all ${
                                            isLiveMode ? 'opacity-30 cursor-not-allowed' :
                                            playbackSpeed === v 
                                                ? 'bg-pink-600 text-white shadow-md' 
                                                : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'
                                        }`}
                                    >
                                        {v}x
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Mute & Translation toggle */}
                        <div className="flex items-center gap-2 md:gap-3">
                            <button
                                onClick={() => setShowTranslation(v => !v)}
                                disabled={isLiveMode}
                                className={`px-2.5 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs font-bold rounded-lg md:rounded-xl transition ${
                                    isLiveMode ? 'opacity-30 cursor-not-allowed bg-slate-800' :
                                    showTranslation 
                                        ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-850'
                                }`}
                            >
                                {showTranslation ? 'إخفاء' : 'ترجمة'}
                            </button>

                            <button
                                onClick={() => setIsMuted(v => !v)}
                                disabled={isLiveMode}
                                className={`p-2 md:p-3 rounded-lg md:rounded-xl transition ${
                                    isLiveMode ? 'opacity-30 cursor-not-allowed bg-slate-800' :
                                    isMuted 
                                        ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-inner' 
                                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-850'
                                }`}
                                title={isMuted ? "إلغاء كتم الصوت" : "كتم الصوت"}
                            >
                                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Timeline History Logs of Transcript Dialog Turns */}
            {!isLiveMode && (
                <div className="mt-2 md:mt-4 bg-slate-900/30 border border-slate-900/60 p-3 md:p-5 rounded-2xl z-10 max-h-[30vh] overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-400 mb-3 md:mb-4 text-right">
                        <ListMusic className="w-4 h-4 md:w-5 md:h-5 text-pink-500" />
                        <h4 className="font-sans font-bold">محتوى النقاش السمعي</h4>
                    </div>

                    <div className="flex flex-col gap-2 md:gap-2.5 overflow-y-auto pr-1">
                        {turns.map((turn, idx) => {
                            const isTurnActive = idx === currentTurnIndex;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setCurrentTurnIndex(idx);
                                        setIsPlaying(true);
                                    }}
                                    className={`w-full p-3 rounded-xl border flex items-center justify-between text-right gap-4 transition-all duration-200 hover:-translate-x-1 ${
                                        isTurnActive 
                                            ? 'bg-pink-500/10 border-pink-500/30 text-white shadow-md' 
                                            : 'bg-slate-950/60 border-slate-950 hover:bg-slate-850/50 text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-mono text-slate-600 font-bold">0{idx + 1}</span>
                                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-sm shadow">
                                            {turn.speaker === 'Sara' ? '👩‍💼' : '👨‍💼'}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-bold text-slate-200 font-sans">{turn.speaker === 'Sara' ? 'سارة' : 'خالد'}</span>
                                            <p className="text-xs text-slate-500 font-sans mt-0.5 max-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis">{turn.translation}</p>
                                        </div>
                                    </div>

                                    <div className="text-left max-w-lg md:max-w-xl truncate font-semibold font-sans text-sm tracking-tight text-right flex-1 select-text">
                                        {turn.text}
                                    </div>

                                    <div className="flex-shrink-0 pl-1">
                                        {isTurnActive && audioStatus === 'speaking' ? (
                                            <div className="flex gap-0.5 items-end h-4">
                                                <span className="w-1 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                                <span className="w-1 h-4 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                                <span className="w-1 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                            </div>
                                        ) : completedTurns.has(idx) ? (
                                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                                        ) : (
                                            <Play className="w-4 h-4 opacity-30" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Bottom Lesson Complete action stage trigger */}
            <div className="mt-4 md:mt-8 flex justify-end z-10 border-t border-slate-900/45 pt-3 md:pt-6">
                <button
                    onClick={() => {
                        disconnectLiveSession(true);
                        onNextStage();
                    }}
                    className="px-4 md:px-8 py-2 md:py-3 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 active:scale-95 text-white font-bold rounded-xl text-sm md:text-md flex items-center gap-2 md:gap-2.5 shadow-xl transition-all duration-200"
                >
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-yellow-300 animate-pulse" />
                    <span>أكملت الدرس! 🎯</span>
                </button>
            </div>
        </div>
    );
};

export default RadioStage;
