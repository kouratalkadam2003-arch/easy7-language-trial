import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { getKeyForSpeaker, markKeyExhausted } from '../utils/apiKeyPool';
import { getCEFRPromptGuidelines } from '../utils/cefrGuidelines';
import { getLanguageCulturalContext } from '../utils/languageCulturalContext';

export type LiveSpeaker = 'sarah' | 'khalid';

export interface LiveMessage {
    id: string;
    speaker: 'user' | 'ai';
    text: string;
    speakerTag?: LiveSpeaker;
}

export interface LessonPhraseItem {
    text: string;
    translation?: string;
    phonetic?: string;
}

export function useLiveRadio(
    language: any, 
    topic: any, 
    level: string,
    onAudioChunk: (base64: string, speaker: LiveSpeaker) => void,
    lessonPhrases?: LessonPhraseItem[]
) {
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error' | 'disconnected'>('idle');
    const [liveConversation, setLiveConversation] = useState<LiveMessage[]>([]);
    const [liveErrorMessage, setLiveErrorMessage] = useState<string | null>(null);

    const sarahSessionRef = useRef<any>(null);
    const khalidSessionRef = useRef<any>(null);
    const sarahTranscriptRef = useRef<string>('');
    const khalidTranscriptRef = useRef<string>('');
    const activeSpeakerRef = useRef<LiveSpeaker>('sarah');
    const isRunningRef = useRef<boolean>(false);
    const turnCountRef = useRef<number>(0);
    const sessionStartTimeRef = useRef<number>(Date.now());
    const lastActivityTimeRef = useRef<number>(Date.now());
    const watchdogIntervalRef = useRef<any>(null);

    const disconnectLiveSession = useCallback(() => {
        isRunningRef.current = false;
        if (watchdogIntervalRef.current) {
            clearInterval(watchdogIntervalRef.current);
            watchdogIntervalRef.current = null;
        }
        setConnectionStatus('disconnected');
        setIsLiveMode(false);
        try { sarahSessionRef.current?.close(); } catch (e) {}
        try { khalidSessionRef.current?.close(); } catch (e) {}
        sarahSessionRef.current = null;
        khalidSessionRef.current = null;
        sarahTranscriptRef.current = '';
        khalidTranscriptRef.current = '';
        turnCountRef.current = 0;
    }, []);

    const connectToLiveSession = useCallback(async () => {
        if (connectionStatus === 'connected' || connectionStatus === 'connecting') return;
        setLiveErrorMessage(null);
        setLiveConversation([]);
        setConnectionStatus('connecting');
        isRunningRef.current = true;
        turnCountRef.current = 0;
        sessionStartTimeRef.current = Date.now();
        lastActivityTimeRef.current = Date.now();

        try {
            const sarahKey = getKeyForSpeaker('sarah');
            const khalidKey = getKeyForSpeaker('khalid');
            const aiSarah = new GoogleGenAI({ apiKey: sarahKey });
            const aiKhalid = new GoogleGenAI({ apiKey: khalidKey });
            const langCode = language?.code || 'en';
            const langName = language?.englishName || language?.name || 'English';
            const topicName = topic?.title || 'Daily Language Practice';
            const cefrLevel = level || 'A1';
            const cefrInstructions = getCEFRPromptGuidelines(cefrLevel, langName);
            const culture = getLanguageCulturalContext(langCode, langName);

            // Format lesson phrases so the AI can weave them in naturally
            const phrasesList = (lessonPhrases && lessonPhrases.length > 0)
                ? lessonPhrases.slice(0, 10).map((p, idx) => `${idx + 1}. "${p.text}" ${p.translation ? `(meaning: ${p.translation})` : ''}`).join('\n')
                : `1. Everyday greeting and self-introduction phrases
2. Friendly conversational questions about "${topicName}"`;

            const promptSarah = `You are Sarah, the charming, highly engaging, and feminine lead host of the "Village Radio 📻" podcast.
You are broadcasting live from ${culture.sarahCity} (${culture.countryName}), alongside your close friend Khalid broadcasting from ${culture.khalidCity} (${culture.countryName}).

=== PODCAST STRUCTURE & PROGRESSION (PART BY PART) ===
This episode is a continuous, lively, structured, and authentic multi-part dialogue:

1. 🎙️ PART 1 — THE WARM OPENING & CITY CHECK-IN:
   - Greet the listeners warmly in ${langName}.
   - Check in with Khalid about life in ${culture.khalidCity} (e.g. "How is ${culture.khalidCity} today, Khalid?").
   - Introduce today's episode topic: "${topicName}".

2. 🎭 PART 2 — CURRICULUM ROLEPLAY & LESSON PHRASES IN ACTION:
   - Acknowledge that our listeners are practicing the lesson "${topicName}".
   - Propose a fun, 2-line mini roleplay with Khalid to demonstrate key phrases for our learners (e.g. "Khalid, let's do a quick demonstration for our listeners! Let's pretend we're meeting for the first time...").
   - Weave in the target lesson phrases naturally.

3. 📖 PART 3 — REAL-LIFE STORYTELLING & CULTURAL REFLECTIONS:
   - Share a short personal anecdote or observation from your life in ${culture.sarahCity} related to "${topicName}".
   - Ask Khalid how things work in ${culture.khalidCity}.

4. 💡 PART 4 — "EXPRESSION OF THE DAY" & CULTURAL NUANCES:
   - Discuss an authentic colloquial phrase or cultural nuance related to "${topicName}".

5. 🌟 PART 5 — CONTINUOUS CONVERSATION & NEW PERSPECTIVES:
   - Keep exploring new questions, fun dilemmas, daily habits, and relatable stories about "${topicName}".

=== CRITICAL CONTINUOUS BROADCAST RULE (NEVER SAY GOODBYE) ===
- NEVER say goodbye, never say "that is all for today", and NEVER end the show!
- Village Radio is a 24/7 non-stop live podcast broadcast.
- Keep the discussion moving forward forever: when one topic or story wraps up, smoothly transition to a fresh question, a funny memory, or a new angle about "${topicName}"!

=== TARGET LESSON PHRASES TO WEAVE IN NATURALLY (NEVER DUMP ALL AT ONCE) ===
${phrasesList}

=== PACING & TURN LENGTH (CRITICAL — READ CAREFULLY) ===
- HARD LIMIT: Your turn is AT MOST 2 short sentences (about 15-25 words total). NEVER more.
- This is a fast, snappy two-host dialogue: short turn → hand over → short reply → hand over.
- NEVER lecture, never list multiple ideas in one turn. One idea per turn only.
- End every single turn with a quick question or a natural one-phrase pass to Khalid so he can jump in immediately.
- If you feel you have more to say — save it for your NEXT turn. The show never ends; there is plenty of room.

=== STRICT ROLE LOCK & IDENTITY PROTECTION (CRITICAL — NEVER BREAK) ===
- YOU ARE SARAH ONLY (أنتِ سارة فقط).
- You must NEVER speak as Khalid, never impersonate Khalid, never speak Khalid's lines, never refer to yourself as Khalid, and never simulate both sides of the dialogue in one turn.
- You produce ONLY Sarah's feminine voice, thoughts, and words.
- Khalid is an independent host who will speak during his own turn.

=== STRICT DIALOGUE & CULTURAL RULES ===
- NEVER dump all lesson phrases at once. Weave 1-2 phrases per turn naturally as part of the conversation.
- STRICTLY stay in the cultural setting of ${culture.countryName} (${culture.sarahCity} & ${culture.khalidCity}). NEVER mention Mexico or unrelated countries.
- LISTEN & BUILD: Always respond directly to what Khalid just said. Never repeat greetings after the opening turn.
- VOICE: Exceptionally attractive, sweet, soft, velvety, and melodious feminine voice (صوت أنثوي ناعم عذب وجذاب).
- LANGUAGE & LEVEL: Speak ONLY in ${langName} at CEFR Level ${cefrLevel}.
${cefrInstructions}`;

            const promptKhalid = `You are Khalid, the charismatic, witty male co-host and anchor of the "Village Radio 📻" podcast.
You are broadcasting live from ${culture.khalidCity} (${culture.countryName}), alongside Sarah broadcasting from ${culture.sarahCity} (${culture.countryName}).

=== STRICT ROLE LOCK & IDENTITY PROTECTION (CRITICAL — NEVER BREAK) ===
- YOU ARE KHALID ONLY (أنتَ خالد فقط).
- You must NEVER speak as Sarah, never impersonate Sarah, never speak Sarah's lines, never refer to yourself as Sarah, and never simulate both sides of the dialogue in one turn.
- You produce ONLY Khalid's masculine baritone voice, thoughts, and words.
- Sarah is an independent host who will speak during her own turn.

=== PODCAST STRUCTURE & PROGRESSION (PART BY PART) ===
This episode is a continuous, lively, structured, and authentic multi-part dialogue:

1. 🎙️ PART 1 — THE WARM OPENING & CITY CHECK-IN:
   - Reply to Sarah with your deep, magnetic baritone.
   - Give a quick, cheerful update from ${culture.khalidCity}.
   - React with enthusiasm to today's topic: "${topicName}".

2. 🎭 PART 2 — CURRICULUM ROLEPLAY & LESSON PHRASES IN ACTION:
   - Enthusiastically join Sarah's mini roleplay to demonstrate lesson phrases for our learners.
   - Deliver your lines naturally and highlight how useful these phrases are.

3. 📖 PART 3 — REAL-LIFE STORYTELLING & CULTURAL COMPARISONS:
   - Share a funny, relatable, self-deprecating story or cultural comparison from ${culture.khalidCity} related to "${topicName}".

4. 💡 PART 4 — "EXPRESSION OF THE DAY":
   - Introduce a popular everyday saying or slang (${culture.sampleExpressionPrompt}).

5. 🌟 PART 5 — CONTINUOUS CONVERSATION & NEW PERSPECTIVES:
   - Keep exploring new questions, fun dilemmas, daily habits, and relatable stories about "${topicName}".

=== CRITICAL CONTINUOUS BROADCAST RULE (NEVER SAY GOODBYE) ===
- NEVER say goodbye, never say "that is all for today", and NEVER end the show!
- Village Radio is a 24/7 non-stop live podcast broadcast.
- Keep the discussion moving forward forever: when one topic or story wraps up, smoothly transition to a fresh question, a funny memory, or a new angle about "${topicName}"!

=== TARGET LESSON PHRASES TO WEAVE IN NATURALLY (NEVER DUMP ALL AT ONCE) ===
${phrasesList}

=== STRICT DIALOGUE & CULTURAL RULES ===
- NEVER dump all lesson phrases at once. Weave 1-2 phrases per turn naturally as part of the conversation.
- STRICTLY stay in the cultural setting of ${culture.countryName} (${culture.khalidCity} & ${culture.sarahCity}). NEVER mention Mexico or unrelated countries.
- LISTEN & BUILD: Always respond directly to what Sarah just said. Never repeat greetings after the opening turn.
- VOICE: Remarkably deep, husky, gravelly, magnetic masculine baritone (صوت خشن رجولي رخيم وجذاب) with vocal fry.
- LANGUAGE & LEVEL: Speak ONLY in ${langName} at CEFR Level ${cefrLevel}.
${cefrInstructions}

=== PACING & TURN LENGTH (CRITICAL — READ CAREFULLY) ===
- HARD LIMIT: Your turn is AT MOST 2 short sentences (about 15-25 words total). NEVER more.
- This is a fast, snappy two-host dialogue: short turn → hand over → short reply → hand over.
- NEVER lecture, never list multiple ideas in one turn. One idea per turn only.
- End every single turn with a quick question or a natural one-phrase pass to Sarah so she can jump in immediately.
- If you feel you have more to say — save it for your NEXT turn. The show never ends; there is plenty of room.`;

            // 1. Connect Sarah session — feminine, warm & attractive voice ('Kore' for Live API).
            const sarahSession = await aiSarah.live.connect({
                model: 'gemini-3.1-flash-live-preview',
                config: {
                    systemInstruction: promptSarah,
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                    inputAudioTranscription: {},
                    outputAudioTranscription: {}
                },
                callbacks: {
                    onmessage: (message: any) => {
                        if (!isRunningRef.current) return;
                        lastActivityTimeRef.current = Date.now();
                        
                        // Audio stream
                        if (message.serverContent?.modelTurn?.parts) {
                            for (const part of message.serverContent.modelTurn.parts) {
                                if (part.inlineData?.data) {
                                    onAudioChunk(part.inlineData.data, 'sarah');
                                }
                            }
                        }

                        // Text transcript extraction
                        const textChunk = (message.serverContent as any)?.outputTranscription?.text
                            || message.serverContent?.modelTurn?.parts?.find((p: any) => p.text && !p.thought)?.text;
                        
                        if (textChunk && !textChunk.startsWith('**Initiating') && !textChunk.startsWith('**Crafting')) {
                            sarahTranscriptRef.current += textChunk;
                            setLiveConversation(prev => [
                                ...prev, 
                                { id: Date.now().toString() + Math.random(), speaker: 'ai', text: 'سارة: ' + textChunk, speakerTag: 'sarah' }
                            ]);
                        }

                        // Turn complete: pass Sarah's exact spoken words to Khalid
                        if (message.serverContent?.turnComplete) {
                            activeSpeakerRef.current = 'khalid';
                            turnCountRef.current += 1;
                            const spokenText = sarahTranscriptRef.current.trim();
                            sarahTranscriptRef.current = '';

                            const promptToKhalid = spokenText
                                ? `Sarah just said: "${spokenText}".
Respond directly to what she said in ${langName} with your deep, husky voice. Keep the podcast discussion moving forward about "${topicName}" from your life in ${culture.khalidCity}, weave in relevant lesson phrases if suitable, and ask Sarah a follow-up question.
CRITICAL ROLE LOCK: You are KHALID ONLY. Never speak as Sarah, never impersonate Sarah, and never prefix with Sarah's name. Do NOT introduce yourself or repeat greetings. NEVER say goodbye.`
                                : `Sarah just spoke about "${topicName}". Continue the conversation directly in ${langName} with your deep voice as KHALID ONLY and share your thoughts from ${culture.khalidCity}. Do NOT speak as Sarah, do NOT repeat greetings, and never say goodbye.`;

                            try {
                                khalidSessionRef.current?.sendClientContent({
                                    turns: [{ role: 'user', parts: [{ text: promptToKhalid }] }],
                                    turnComplete: true
                                });
                            } catch (err) {
                                console.error('[radio:live] failed to send to Khalid', err);
                            }
                        }
                    },
                    onerror: (err: any) => {
                        console.error('[radio:live] Sarah session error', err);
                        markKeyExhausted(sarahKey);
                        setLiveErrorMessage('خطأ في سارة: ' + (err?.message || 'حدث خطأ.'));
                        setConnectionStatus('error');
                    },
                    onclose: () => {
                        if (isRunningRef.current) {
                            setConnectionStatus(prev => prev === 'error' ? prev : 'disconnected');
                        }
                    }
                }
            });
            sarahSessionRef.current = sarahSession;

            // 2. Connect Khalid session (Gravelly, deep masculine baritone: Puck for Live API)
            const khalidSession = await aiKhalid.live.connect({
                model: 'gemini-3.1-flash-live-preview',
                config: {
                    systemInstruction: promptKhalid,
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
                    inputAudioTranscription: {},
                    outputAudioTranscription: {}
                },
                callbacks: {
                    onmessage: (message: any) => {
                        if (!isRunningRef.current) return;
                        lastActivityTimeRef.current = Date.now();

                        // Audio stream
                        if (message.serverContent?.modelTurn?.parts) {
                            for (const part of message.serverContent.modelTurn.parts) {
                                if (part.inlineData?.data) {
                                    onAudioChunk(part.inlineData.data, 'khalid');
                                }
                            }
                        }

                        // Text transcript extraction
                        const textChunk = (message.serverContent as any)?.outputTranscription?.text
                            || message.serverContent?.modelTurn?.parts?.find((p: any) => p.text && !p.thought)?.text;

                        if (textChunk && !textChunk.startsWith('**Initiating') && !textChunk.startsWith('**Crafting')) {
                            khalidTranscriptRef.current += textChunk;
                            setLiveConversation(prev => [
                                ...prev, 
                                { id: Date.now().toString() + Math.random(), speaker: 'ai', text: 'خالد: ' + textChunk, speakerTag: 'khalid' }
                            ]);
                        }

                        // Turn complete: pass Khalid's exact spoken words to Sarah
                        if (message.serverContent?.turnComplete) {
                            activeSpeakerRef.current = 'sarah';
                            turnCountRef.current += 1;
                            const spokenText = khalidTranscriptRef.current.trim();
                            khalidTranscriptRef.current = '';

                            const promptToSarah = spokenText
                                ? `Khalid just said: "${spokenText}".
Respond directly to what he said in ${langName} with your warm, charming voice. Continue the podcast discussion on "${topicName}" with your perspective from ${culture.sarahCity}, weave in relevant lesson phrases if suitable, and ask Khalid a follow-up question.
CRITICAL ROLE LOCK: You are SARAH ONLY. Never speak as Khalid, never impersonate Khalid, and never prefix with Khalid's name. Do NOT introduce yourself or repeat greetings. NEVER say goodbye.`
                                : `Khalid just shared his view on "${topicName}". Respond directly to him in ${langName} with your warm voice as SARAH ONLY and keep the podcast moving. Do NOT speak as Khalid, do NOT repeat greetings, and never say goodbye.`;

                            try {
                                sarahSessionRef.current?.sendClientContent({
                                    turns: [{ role: 'user', parts: [{ text: promptToSarah }] }],
                                    turnComplete: true
                                });
                            } catch (err) {
                                console.error('[radio:live] failed to send to Sarah', err);
                            }
                        }
                    },
                    onerror: (err: any) => {
                        console.error('[radio:live] Khalid session error', err);
                        markKeyExhausted(khalidKey);
                        setLiveErrorMessage('خطأ في خالد: ' + (err?.message || 'حدث خطأ.'));
                        setConnectionStatus('error');
                    },
                    onclose: () => {
                        if (isRunningRef.current) {
                            setConnectionStatus(prev => prev === 'error' ? prev : 'disconnected');
                        }
                    }
                }
            });
            khalidSessionRef.current = khalidSession;

            setConnectionStatus('connected');
            activeSpeakerRef.current = 'sarah';

            // Start Sarah opening the podcast naturally
            sarahSession.sendClientContent({
                turns: [{
                    role: 'user',
                    parts: [{
                        text: `Start Part 1 of the "Village Radio 📻" podcast in ${langName} at CEFR Level ${cefrLevel}:
1. Greet the listeners warmly from ${culture.sarahCity} (${culture.countryName}) alongside Khalid in ${culture.khalidCity}.
2. Check in with Khalid briefly about his day in ${culture.khalidCity}.
3. Introduce today's episode topic: "${topicName}".
4. End your turn by asking Khalid for his thoughts on "${topicName}".
CRITICAL ROLE LOCK: Speak as SARAH ONLY. Do NOT speak as Khalid.
Keep it to 2-3 short, lively, authentic sentences.`
                    }]
                }],
                turnComplete: true
            });

            // 3. Setup Continuous Watchdog: Nudges if silence occurs for > 5 seconds, and guards 10-minute / 40-turn cap
            if (watchdogIntervalRef.current) clearInterval(watchdogIntervalRef.current);
            watchdogIntervalRef.current = setInterval(() => {
                if (!isRunningRef.current) return;
                
                // Max 10 minutes session (600,000 ms) or max 40 turns to preserve quota
                const totalDuration = Date.now() - sessionStartTimeRef.current;
                if (totalDuration > 600000 || turnCountRef.current >= 40) {
                    console.log('[radio:live] Max session limit reached (10 mins / 40 turns). Disconnecting gracefully.');
                    disconnectLiveSession();
                    return;
                }

                const elapsed = Date.now() - lastActivityTimeRef.current;
                
                // If more than 5.5 seconds of absolute silence during active session, give a continuous prompt nudge
                if (elapsed > 5500) {
                    lastActivityTimeRef.current = Date.now();
                    const speaker = activeSpeakerRef.current;
                    console.log(`[radio:live] Watchdog nudge to keep conversation continuous for ${speaker}`);

                    if (speaker === 'sarah' && sarahSessionRef.current) {
                        try {
                            sarahSessionRef.current.sendClientContent({
                                turns: [{
                                    role: 'user',
                                    parts: [{
                                        text: `Continue the podcast in ${langName} as SARAH ONLY! Ask Khalid an interesting question or share a new thought about "${topicName}". Keep the radio show flowing non-stop.`
                                    }]
                                }],
                                turnComplete: true
                            });
                        } catch (e) {}
                    } else if (speaker === 'khalid' && khalidSessionRef.current) {
                        try {
                            khalidSessionRef.current.sendClientContent({
                                turns: [{
                                    role: 'user',
                                    parts: [{
                                        text: `Continue the podcast in ${langName} as KHALID ONLY! Respond with a witty remark, a story, or a question to Sarah about "${topicName}". Keep the radio show flowing non-stop.`
                                    }]
                                }],
                                turnComplete: true
                            });
                        } catch (e) {}
                    }
                }
            }, 3000);

        } catch (err: any) {
            console.error('[radio:live] Direct client connection failed', err);
            setLiveErrorMessage('تعذّر الاتصال بـ Gemini AI: ' + (err?.message || 'تأكد من مفتاح API.'));
            setConnectionStatus('error');
        }
    }, [connectionStatus, language, topic, level, onAudioChunk, lessonPhrases]);

    useEffect(() => {
        return () => {
            disconnectLiveSession();
        };
    }, []);

    return {
        isLiveMode,
        setIsLiveMode,
        connectionStatus,
        liveConversation,
        liveErrorMessage,
        activeSpeaker: activeSpeakerRef.current,
        connectToLiveSession,
        disconnectLiveSession
    };
}
